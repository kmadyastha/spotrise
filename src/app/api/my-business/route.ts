import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Defensive cleanup for rows saved before the reply-format fix — Claude
// sometimes wrapped a reply in {"review":1,"reviewer":"...","reply":"..."}
// instead of returning a plain string. New generations are already clean
// (see normalizeReply() in confirm-business and refresh-audit), but rows
// created before that fix still have the raw JSON sitting in ai_reply.
// Cleaning it up here — at read time, on every load — means every old
// review shows plain text immediately, with no need to regenerate each
// one by hand.
function cleanLegacyReply(raw: string | null): string | null {
  if (!raw) return raw;
  const trimmed = raw.trim();
  if (!trimmed.startsWith("{")) return raw;
  try {
    const parsed = JSON.parse(trimmed);
    return parsed.reply ?? parsed.text ?? parsed.content ?? raw;
  } catch {
    return raw;
  }
}

// Runs once when the app loads for a logged-in user. Returns their real
// plan from the database (never trust client-side state for this), and
// — if they have a linked business — its latest audit data, so a
// returning Pro user lands on their dashboard instead of the marketing
// page every time they refresh.
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "not_authenticated" }, { status: 401 });

    let { data: profile } = await supabase
      .from("profiles")
      .select("plan, audit_credits_used")
      .eq("id", user.id)
      .single();

    if (!profile) {
      const { data: newProfile } = await supabase
        .from("profiles")
        .insert({ id: user.id, email: user.email ?? "" })
        .select("plan, audit_credits_used")
        .single();
      profile = newProfile;
    }

    const { data: business } = await supabase
      .from("businesses")
      .select("id, name, place_id")
      .eq("user_id", user.id)
      .eq("is_linked", true)
      .maybeSingle();

    if (!business) {
      return NextResponse.json({ plan: profile?.plan ?? "free", hasBusiness: false });
    }

    const { data: snapshot } = await supabase
      .from("audit_snapshots")
      .select("*")
      .eq("business_id", business.id)
      .order("scraped_at", { ascending: false })
      .limit(1)
      .single();

    const { data: actionItems } = snapshot
      ? await supabase.from("action_items").select("*").eq("audit_snapshot_id", snapshot.id)
      : { data: [] };

    const { data: reviews } = await supabase
      .from("reviews")
      .select("*")
      .eq("business_id", business.id)
      .order("review_date", { ascending: false });

    const { data: posts } = await supabase
      .from("posts")
      .select("*")
      .eq("business_id", business.id)
      .order("created_at", { ascending: false });

    const { data: competitors } = await supabase
      .from("competitors")
      .select("*")
      .eq("business_id", business.id)
      .order("added_at", { ascending: false });

    // Reconstruct address from the raw Places data saved on the snapshot.
    // The latest snapshot might be one created by refresh-audit before
    // its field mask included formattedAddress (now fixed going forward),
    // so first scan the last several snapshots for one that has it —
    // done in code rather than a DB-side JSON filter, so it doesn't
    // depend on raw_data's exact column type/indexing being filter-
    // friendly. If literally none of them have it (e.g. this business's
    // very first snapshot predates formattedAddress being requested at
    // all), fetch it live from Google Places as a last resort — a single
    // cheap details call, and self-healing for any historical gap.
    let address = snapshot?.raw_data?.formattedAddress ?? "";
    if (!address) {
      const { data: recentSnapshots } = await supabase
        .from("audit_snapshots")
        .select("raw_data")
        .eq("business_id", business.id)
        .order("scraped_at", { ascending: false })
        .limit(10);
      address = (recentSnapshots ?? []).map((s) => s.raw_data?.formattedAddress).find(Boolean) ?? "";
    }
    if (!address && business.place_id) {
      try {
        const detailsRes = await fetch(
          `https://places.googleapis.com/v1/places/${business.place_id}`,
          { headers: { "X-Goog-Api-Key": process.env.GOOGLE_PLACES_API_KEY!, "X-Goog-FieldMask": "formattedAddress" } }
        );
        if (detailsRes.ok) {
          const details = await detailsRes.json();
          address = details.formattedAddress ?? "";
        } else {
          console.error("my-business: live address fallback failed:", await detailsRes.text());
        }
      } catch (err) {
        console.error("my-business: live address fallback request failed:", err);
      }
    }

    const cleanedReviews = (reviews ?? []).map((r) => ({ ...r, ai_reply: cleanLegacyReply(r.ai_reply) }));

    return NextResponse.json({
      plan: profile?.plan ?? "free",
      hasBusiness: true,
      business: { id: business.id, name: business.name, address },
      snapshot: snapshot
        ? { ...snapshot, sentiment: { positive: snapshot.sentiment_positive, neutral: snapshot.sentiment_neutral, negative: snapshot.sentiment_negative } }
        : null,
      actionItems: actionItems ?? [],
      reviews: cleanedReviews,
      posts: posts ?? [],
      competitors: competitors ?? [],
    });
  } catch (err) {
    console.error("my-business failed:", err);
    return NextResponse.json({ error: "unexpected_error", details: String(err) }, { status: 500 });
  }
}