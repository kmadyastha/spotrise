import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Must be logged in to search at all — this is what stops the
    // old "unlimited anonymous searches" loophole.
    if (!user) {
      return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
    }

    const { businessName, location } = await request.json();
    if (!businessName?.trim() || !location?.trim()) {
      return NextResponse.json({ error: "missing_fields" }, { status: 400 });
    }

    // Check plan + credits + whether they already have a linked business.
    let { data: profile } = await supabase
      .from("profiles")
      .select("plan, audit_credits_used")
      .eq("id", user.id)
      .single();

    // Self-heal: create the profile row if the signup trigger ever
    // missed it, instead of failing every request for this account.
    if (!profile) {
      const { data: newProfile } = await supabase
        .from("profiles")
        .insert({ id: user.id, email: user.email ?? "" })
        .select("plan, audit_credits_used")
        .single();
      profile = newProfile;
    }

    const { data: linkedBusiness } = await supabase
      .from("businesses")
      .select("id")
      .eq("user_id", user.id)
      .eq("is_linked", true)
      .maybeSingle();

    // Pro users with an already-linked business don't search again here —
    // that flow goes through the "change my business" path instead (not
    // built yet). Free users who've used both credits and have no linked
    // business are locked out of new real searches entirely.
    const isLocked =
      profile?.plan === "free" &&
      (profile?.audit_credits_used ?? 0) >= 2 &&
      !linkedBusiness;

    if (isLocked) {
      return NextResponse.json({ locked: true });
    }

    if (profile?.plan === "pro" && linkedBusiness) {
      return NextResponse.json({ error: "already_linked" }, { status: 409 });
    }

    const apiKey = process.env.GOOGLE_PLACES_API_KEY;

    // Convert the typed location into real coordinates first, so we can
    // hard-bias the search to that area — without this, "near X" in the
    // text query is only a soft hint, which is how businesses 60-100km
    // away were sneaking into results.
    let locationBias: { circle: { center: { latitude: number; longitude: number }; radius: number } } | undefined;
    try {
      const geoRes = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location)}&key=${apiKey}`
      );
      const geoData = await geoRes.json();
      const coords = geoData.results?.[0]?.geometry?.location;
      if (coords) {
        locationBias = {
          circle: { center: { latitude: coords.lat, longitude: coords.lng }, radius: 15000 },
        };
      }
    } catch {
      // If geocoding fails for any reason, fall through and search
      // without a bias rather than blocking the whole search.
    }

    // Real Google Places search — server-side only, key never touches the browser.
    const placesRes = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey!,
        "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.location",
      },
      body: JSON.stringify({
        textQuery: `${businessName} near ${location}`,
        ...(locationBias ? { locationBias } : {}),
      }),
    });

    const data = await placesRes.json();
    if (!placesRes.ok) {
      return NextResponse.json({ error: "places_api_error", details: data }, { status: 502 });
    }

    const allResults = (data.places || []).map((p: any) => ({
      placeId: p.id,
      name: p.displayName?.text ?? businessName,
      address: p.formattedAddress ?? "",
      rating: p.rating ?? null,
      reviewCount: p.userRatingCount ?? 0,
      lat: p.location?.latitude,
      lng: p.location?.longitude,
    }));

    // Belt-and-suspenders: even with locationBias, Places can still return
    // a strong text match from far away. Hard-filter anything outside a
    // reasonable radius of the searched area, when we know its coordinates.
    const withinRadius = locationBias
      ? allResults.filter((r: any) => {
          if (r.lat == null || r.lng == null) return true; // keep if we can't check
          const dist = haversineKm(locationBias!.circle.center.latitude, locationBias!.circle.center.longitude, r.lat, r.lng);
          return dist <= 30; // 30km — generous for a metro area, excludes other cities
        })
      : allResults;

    // Google's text search ranks by relevance but doesn't filter out
    // loosely-related results (a "mart" query can pull in any grocery
    // store nearby). Keep only results whose name actually shares a
    // meaningful word with what was searched — falls back to the
    // unfiltered list only if that leaves nothing, so the user never
    // hits a dead end.
    const searchWords = businessName.toLowerCase().split(/\s+/).filter((w: string) => w.length >= 3);
    const relevant = withinRadius.filter((r: any) =>
      searchWords.some((w: string) => r.name.toLowerCase().includes(w))
    );

    const matches = (relevant.length > 0 ? relevant : withinRadius).slice(0, 5);

    return NextResponse.json({ locked: false, matches });
  } catch (err) {
    console.error("search-business failed:", err);
    return NextResponse.json(
      { error: "unexpected_error", details: String(err) },
      { status: 500 }
    );
  }
}

// Straight-line distance between two lat/lng points, in kilometers.
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}