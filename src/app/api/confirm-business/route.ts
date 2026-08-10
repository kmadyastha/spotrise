import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
    }

    const { placeId, name } = await request.json();
    if (!placeId || !name) {
      return NextResponse.json({ error: "missing_fields" }, { status: 400 });
    }

    // Re-check everything server-side — never trust the client's word on
    // credits or plan, even though the search route already checked once.
    let { data: profile } = await supabase
      .from("profiles")
      .select("plan, audit_credits_used")
      .eq("id", user.id)
      .single();

    // Self-heal: the signup trigger should always create this row, but
    // if it ever didn't (or ran before the trigger existed), create it
    // now rather than failing every request for this account forever.
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

    const isLocked =
      profile?.plan === "free" &&
      (profile?.audit_credits_used ?? 0) >= 2 &&
      !linkedBusiness;

    if (isLocked) {
      return NextResponse.json({ error: "locked" }, { status: 403 });
    }

    // Fetch richer details for the confirmed place only (not for every
    // candidate in the search list) — keeps cost down since Place Details
    // is billed separately from Text Search.
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    const detailsRes = await fetch(
      `https://places.googleapis.com/v1/places/${placeId}`,
      {
        headers: {
          "X-Goog-Api-Key": apiKey!,
          "X-Goog-FieldMask": "displayName,formattedAddress,rating,userRatingCount,photos",
        },
      }
    );

    const details = await detailsRes.json();

    // Google returned an error body (bad place ID, quota, etc) — catch
    // this explicitly instead of silently treating it as empty data.
    if (!detailsRes.ok) {
      return NextResponse.json(
        { error: "places_details_error", details },
        { status: 502 }
      );
    }

    const reviewCount = details.userRatingCount ?? 0;
    const rating = details.rating ?? 0;
    const photoCount = details.photos?.length ?? 0;

    // NOTE: this is a placeholder scoring formula using real Places data —
    // not yet the full Claude-generated audit (that's still to come). It's
    // deterministic and honest, just not AI-analyzed yet.
    const score = Math.round(
      Math.min(100, rating * 15 + Math.min(reviewCount, 200) / 4 + Math.min(photoCount, 20) * 1.5)
    );

    const isPro = profile?.plan === "pro";

    const { data: business, error: businessError } = await supabase
      .from("businesses")
      .insert({
        user_id: user.id,
        place_id: placeId,
        name,
        is_linked: isPro,
      })
      .select()
      .single();

    if (businessError) {
      return NextResponse.json({ error: "db_error", details: businessError.message }, { status: 500 });
    }

    const { data: snapshot, error: snapshotError } = await supabase
      .from("audit_snapshots")
      .insert({
        business_id: business.id,
        score,
        reviews_count: reviewCount,
        rating,
        photo_count: photoCount,
        response_rate: 0,
        raw_data: details,
      })
      .select()
      .single();

    if (snapshotError) {
      return NextResponse.json({ error: "db_error", details: snapshotError.message }, { status: 500 });
    }

    // Only free-tier searches burn a credit — Pro's business is linked,
    // not a one-off lookup, so it doesn't count against the free cap.
    if (!isPro) {
      await supabase
        .from("profiles")
        .update({ audit_credits_used: (profile?.audit_credits_used ?? 0) + 1 })
        .eq("id", user.id);
    }

    return NextResponse.json({ business, snapshot });
  } catch (err) {
    // Catch-all so a hiccup anywhere above always returns clean JSON
    // instead of crashing the route with an unreadable error page.
    console.error("confirm-business failed:", err);
    return NextResponse.json(
      { error: "unexpected_error", details: String(err) },
      { status: 500 }
    );
  }
}