import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const MAX_REVIEWS = 80;
const BATCH_SIZE = 10;

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "not_authenticated" }, { status: 401 });

    const { businessId } = await request.json();
    if (!businessId) return NextResponse.json({ error: "missing_business_id" }, { status: 400 });

    const { data: profile } = await supabase.from("profiles").select("plan").eq("id", user.id).single();
    if (profile?.plan !== "pro") return NextResponse.json({ error: "pro_only" }, { status: 403 });

    const { data: business } = await supabase.from("businesses").select("id, user_id, place_id").eq("id", businessId).single();
    if (!business || business.user_id !== user.id) return NextResponse.json({ error: "not_found" }, { status: 404 });

    const { count: currentCount } = await supabase
      .from("reviews")
      .select("*", { count: "exact", head: true })
      .eq("business_id", businessId);

    const current = currentCount ?? 0;
    if (current >= MAX_REVIEWS) {
      return NextResponse.json({ error: "max_reached" }, { status: 400 });
    }

    // Outscraper doesn't support fetching just "the next 10" — it only
    // takes a total limit, sorted newest-first. So each click re-fetches
    // from scratch up to the new total (e.g. 60, then 70, then 80) and
    // we rely on the upsert below to skip everything already stored.
    const newLimit = Math.min(current + BATCH_SIZE, MAX_REVIEWS);

    let outscraperReviews: any[] = [];
    try {
      const outscraperRes = await fetch(
        `https://api.app.outscraper.com/maps/reviews-v2?query=${encodeURIComponent(business.place_id)}&reviewsLimit=${newLimit}&sort=newest&async=false`,
        { headers: { "X-API-KEY": process.env.OUTSCRAPER_API_KEY! } }
      );
      const outscraperData = await outscraperRes.json();
      if (outscraperRes.ok) {
        outscraperReviews = outscraperData?.[0]?.reviews_data ?? outscraperData?.data?.[0]?.reviews_data ?? [];
      } else {
        console.error("load-more-reviews: Outscraper error:", outscraperData);
        return NextResponse.json({ error: "outscraper_error", details: outscraperData }, { status: 502 });
      }
    } catch (err) {
      console.error("load-more-reviews: Outscraper request failed:", err);
      return NextResponse.json({ error: "outscraper_error", details: String(err) }, { status: 502 });
    }

    const rows = outscraperReviews
      .map((r: any) => {
        const rating = r.review_rating ?? r.rating ?? 0;
        return {
          business_id: businessId,
          google_review_id: r.review_id ?? r.review_link ?? null,
          author: r.author_title ?? r.author_name ?? "Anonymous",
          rating,
          text: r.review_text ?? r.text ?? "",
          review_date: r.review_datetime_utc ?? r.review_timestamp ?? null,
          sentiment: rating >= 4 ? "positive" : rating === 3 ? "neutral" : "negative",
        };
      })
      .filter((r) => r.google_review_id);

    // ignoreDuplicates: true means rows already in the table (same
    // business_id + google_review_id) are skipped entirely rather than
    // overwritten — so any AI reply already generated on an existing
    // review is left completely untouched. Only the genuinely new
    // reviews from this batch actually get inserted.
    if (rows.length > 0) {
      const { error: upsertError } = await supabase
        .from("reviews")
        .upsert(rows, { onConflict: "business_id,google_review_id", ignoreDuplicates: true });

      if (upsertError) {
        console.error("load-more-reviews: upsert failed:", upsertError);
        return NextResponse.json({ error: "db_error", details: upsertError.message }, { status: 500 });
      }
    }

    const { data: allReviews } = await supabase
      .from("reviews")
      .select("*")
      .eq("business_id", businessId)
      .order("review_date", { ascending: false });

    return NextResponse.json({ reviews: allReviews ?? [] });
  } catch (err) {
    console.error("load-more-reviews failed:", err);
    return NextResponse.json({ error: "unexpected_error", details: String(err) }, { status: 500 });
  }
}