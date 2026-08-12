import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Disambiguation search for competitors — Google Places only, same
// pattern as the main business search. No Outscraper cost here at all;
// that only happens after a competitor is actually confirmed.
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "not_authenticated" }, { status: 401 });

    const { data: profile } = await supabase.from("profiles").select("plan").eq("id", user.id).single();
    if (profile?.plan !== "pro") return NextResponse.json({ error: "pro_only" }, { status: 403 });

    const { businessId, competitorName, location } = await request.json();
    if (!businessId || !competitorName?.trim() || !location?.trim()) {
      return NextResponse.json({ error: "missing_fields" }, { status: 400 });
    }

    const { data: business } = await supabase.from("businesses").select("id, user_id").eq("id", businessId).single();
    if (!business || business.user_id !== user.id) return NextResponse.json({ error: "not_found" }, { status: 404 });

    const { count } = await supabase.from("competitors").select("*", { count: "exact", head: true }).eq("business_id", businessId);
    if ((count ?? 0) >= 2) return NextResponse.json({ error: "competitor_limit_reached" }, { status: 403 });

    const apiKey = process.env.GOOGLE_PLACES_API_KEY;

    let locationBias: any;
    try {
      const geoRes = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location)}&key=${apiKey}`);
      const geoData = await geoRes.json();
      const coords = geoData.results?.[0]?.geometry?.location;
      if (coords) locationBias = { circle: { center: { latitude: coords.lat, longitude: coords.lng }, radius: 15000 } };
    } catch {}

    const placesRes = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey!,
        "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.location",
      },
      body: JSON.stringify({ textQuery: `${competitorName} near ${location}`, ...(locationBias ? { locationBias } : {}) }),
    });
    const data = await placesRes.json();
    if (!placesRes.ok) return NextResponse.json({ error: "places_api_error", details: data }, { status: 502 });

    const allResults = (data.places || []).map((p: any) => ({
      placeId: p.id, name: p.displayName?.text ?? competitorName, address: p.formattedAddress ?? "",
      rating: p.rating ?? null, reviewCount: p.userRatingCount ?? 0, lat: p.location?.latitude, lng: p.location?.longitude,
    }));

    const withinRadius = locationBias
      ? allResults.filter((r: any) => {
          if (r.lat == null || r.lng == null) return true;
          const R = 6371, dLat = (r.lat - locationBias.circle.center.latitude) * Math.PI / 180, dLon = (r.lng - locationBias.circle.center.longitude) * Math.PI / 180;
          const a = Math.sin(dLat / 2) ** 2 + Math.cos(locationBias.circle.center.latitude * Math.PI / 180) * Math.cos(r.lat * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
          return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) <= 30;
        })
      : allResults;

    const searchWords = competitorName.toLowerCase().split(/\s+/).filter((w: string) => w.length >= 3);
    const relevant = withinRadius.filter((r: any) => searchWords.some((w: string) => r.name.toLowerCase().includes(w)));
    const matches = (relevant.length > 0 ? relevant : withinRadius).slice(0, 5);

    return NextResponse.json({ matches });
  } catch (err) {
    console.error("search-competitor failed:", err);
    return NextResponse.json({ error: "unexpected_error", details: String(err) }, { status: 500 });
  }
}