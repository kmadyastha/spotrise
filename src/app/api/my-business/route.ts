import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

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

    // Reconstruct address from the raw Places data saved on the snapshot.
    const address = snapshot?.raw_data?.formattedAddress ?? "";

    return NextResponse.json({
      plan: profile?.plan ?? "free",
      hasBusiness: true,
      business: { id: business.id, name: business.name, address },
      snapshot: snapshot
        ? { ...snapshot, sentiment: { positive: snapshot.sentiment_positive, neutral: snapshot.sentiment_neutral, negative: snapshot.sentiment_negative } }
        : null,
      actionItems: actionItems ?? [],
      reviews: reviews ?? [],
      posts: posts ?? [],
    });
  } catch (err) {
    console.error("my-business failed:", err);
    return NextResponse.json({ error: "unexpected_error", details: String(err) }, { status: 500 });
  }
}