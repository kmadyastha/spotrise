import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Compares the two most recent audit_snapshots for a business to show
// real "vs last week" deltas. Returns hasEnoughData: false when there's
// only ever been one snapshot — no fake numbers in that case.
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "not_authenticated" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("businessId");
    if (!businessId) return NextResponse.json({ error: "missing_business_id" }, { status: 400 });

    // Confirm this business belongs to the requesting user before
    // returning anything about it.
    const { data: business } = await supabase
      .from("businesses")
      .select("id, user_id")
      .eq("id", businessId)
      .single();

    if (!business || business.user_id !== user.id) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const { data: snapshots } = await supabase
      .from("audit_snapshots")
      .select("score, reviews_count, rating, photo_count, response_rate, scraped_at")
      .eq("business_id", businessId)
      .order("scraped_at", { ascending: false })
      .limit(2);

    if (!snapshots || snapshots.length < 2) {
      return NextResponse.json({ hasEnoughData: false });
    }

    const [current, previous] = snapshots;
    const pctChange = (curr: number, prev: number) => (prev === 0 ? 0 : Math.round(((curr - prev) / prev) * 1000) / 10);

    return NextResponse.json({
      hasEnoughData: true,
      current: {
        reviewsCount: current.reviews_count,
        rating: current.rating,
        responseRate: current.response_rate,
        photoCount: current.photo_count,
      },
      changes: {
        reviewsCount: current.reviews_count - previous.reviews_count,
        reviewsCountPct: pctChange(current.reviews_count, previous.reviews_count),
        rating: Math.round((current.rating - previous.rating) * 10) / 10,
        responseRate: current.response_rate - previous.response_rate,
        photoCount: current.photo_count - previous.photo_count,
      },
      lastRefreshed: current.scraped_at,
    });
  } catch (err) {
    console.error("weekly-pulse failed:", err);
    return NextResponse.json({ error: "unexpected_error", details: String(err) }, { status: 500 });
  }
}