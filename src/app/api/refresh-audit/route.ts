import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Re-runs a full audit (fresh Outscraper reviews + fresh Claude analysis)
// for an already-linked Pro business, creating a NEW audit_snapshot so
// Weekly Pulse has something real to compare against. Only Pro/linked
// businesses can be refreshed — free-tier audits are one-time by design.
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "not_authenticated" }, { status: 401 });

    const { businessId } = await request.json();
    if (!businessId) return NextResponse.json({ error: "missing_business_id" }, { status: 400 });

    const { data: profile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("id", user.id)
      .single();

    const { data: business } = await supabase
      .from("businesses")
      .select("id, user_id, place_id, name, is_linked")
      .eq("id", businessId)
      .single();

    if (!business || business.user_id !== user.id) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    if (profile?.plan !== "pro" || !business.is_linked) {
      return NextResponse.json({ error: "not_pro_or_not_linked" }, { status: 403 });
    }

    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    const detailsRes = await fetch(
      `https://places.googleapis.com/v1/places/${business.place_id}`,
      { headers: { "X-Goog-Api-Key": apiKey!, "X-Goog-FieldMask": "rating,userRatingCount,photos" } }
    );
    const details = await detailsRes.json();
    if (!detailsRes.ok) {
      return NextResponse.json({ error: "places_details_error", details }, { status: 502 });
    }

    const reviewCount = details.userRatingCount ?? 0;
    const rating = details.rating ?? 0;
    const photoCount = details.photos?.length ?? 0;

    let outscraperReviews: any[] = [];
    try {
      const outscraperRes = await fetch(
        `https://api.app.outscraper.com/maps/reviews-v2?query=${encodeURIComponent(business.place_id)}&reviewsLimit=50&sort=newest&async=false`,
        { headers: { "X-API-KEY": process.env.OUTSCRAPER_API_KEY! } }
      );
      const outscraperData = await outscraperRes.json();
      if (outscraperRes.ok) {
        outscraperReviews = outscraperData?.[0]?.reviews_data ?? outscraperData?.data?.[0]?.reviews_data ?? [];
      }
    } catch (err) {
      console.error("Outscraper refresh failed:", err);
    }

    const allReviews = outscraperReviews.map((r: any) => ({
      author: r.author_title ?? r.author_name ?? "Anonymous",
      rating: r.review_rating ?? r.rating ?? 0,
      text: r.review_text ?? r.text ?? "",
      publishTime: r.review_datetime_utc ?? r.review_timestamp ?? null,
      googleReviewId: r.review_id ?? r.review_link ?? null,
    }));

    const fallbackScore = Math.round(Math.min(85, rating * 12 + Math.min(reviewCount, 200) / 5 + Math.min(photoCount, 20) * 1));
    let score = fallbackScore;
    let sentiment = { positive: 0, neutral: 0, negative: 0 };
    let actionItems: { priority: string; title: string; description: string; impact: string }[] = [];
    let reviewReplies: string[] = [];
    const autoReplyCount = Math.min(10, allReviews.length);

    if (allReviews.length > 0) {
      const reviewsToReply = allReviews.slice(0, autoReplyCount);
      const prompt = `You are a local-business consultant analyzing a Google Business Profile for "${business.name}". Current stats: ${rating} average rating, ${reviewCount} total reviews, ${photoCount} photos.

Here are ${allReviews.length} real recent reviews for overall analysis:
${allReviews.map((r, i) => `${i + 1}. [${r.rating}★] ${r.author}: "${r.text}"`).join("\n")}

Respond with ONLY valid JSON (no markdown fences, no commentary) in exactly this shape:
{
  "score": <int 0-100, your overall audit score for this profile>,
  "sentiment": { "positive": <int 0-100>, "neutral": <int 0-100>, "negative": <int 0-100> },
  "actionItems": [
    { "priority": "high" | "medium" | "low", "title": "<short title>", "description": "<one sentence, specific and actionable>", "impact": "<short estimated benefit>" }
  ],
  "reviewReplies": ["<reply to review 1>", ${reviewsToReply.length > 1 ? `"<reply to review 2>", ...` : ""}]
}

Rules: the score, sentiment, and actionItems must all be CONSISTENT with each other and with what the reviews actually say — do not let a high star rating alone drive a high score if the review text describes real, recurring problems. Sentiment percentages must sum to 100. Give 3-5 actionItems. Draft replies for ONLY the first ${reviewsToReply.length} review(s), in order.`;

      const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "x-api-key": process.env.ANTHROPIC_API_KEY!, "anthropic-version": "2023-06-01", "content-type": "application/json" },
        body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 2500, messages: [{ role: "user", content: prompt }] }),
      });
      const claudeData = await claudeRes.json();
      if (claudeRes.ok) {
        try {
          const cleaned = (claudeData.content?.[0]?.text ?? "{}").replace(/```json|```/g, "").trim();
          const parsed = JSON.parse(cleaned);
          score = typeof parsed.score === "number" ? Math.max(0, Math.min(100, Math.round(parsed.score))) : fallbackScore;
          sentiment = parsed.sentiment ?? sentiment;
          actionItems = parsed.actionItems ?? [];
          reviewReplies = parsed.reviewReplies ?? [];
        } catch (e) {
          console.error("Claude response wasn't valid JSON on refresh:", claudeData.content?.[0]?.text);
        }
      }
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
        sentiment_positive: sentiment.positive,
        sentiment_neutral: sentiment.neutral,
        sentiment_negative: sentiment.negative,
        raw_data: details,
      })
      .select()
      .single();

    if (snapshotError) {
      return NextResponse.json({ error: "db_error", details: snapshotError.message }, { status: 500 });
    }

    if (actionItems.length > 0) {
      await supabase.from("action_items").insert(
        actionItems.map((item) => ({
          audit_snapshot_id: snapshot.id,
          priority: item.priority,
          title: item.title,
          description: item.description,
          impact: item.impact,
        }))
      );
    }

    // Upsert reviews — new ones get inserted, previously-seen ones (same
    // google_review_id) just get their stats refreshed, never duplicated.
    let savedReviews: any[] = [];
    if (allReviews.length > 0) {
      const { data: upserted } = await supabase
        .from("reviews")
        .upsert(
          allReviews.map((r, i) => ({
            business_id: business.id,
            google_review_id: r.googleReviewId,
            author: r.author,
            rating: r.rating,
            text: r.text,
            review_date: r.publishTime,
            sentiment: r.rating >= 4 ? "positive" : r.rating === 3 ? "neutral" : "negative",
            ai_reply: i < autoReplyCount ? (reviewReplies[i] ?? "") : "",
            ai_reply_generated_at: i < autoReplyCount && reviewReplies[i] ? new Date().toISOString() : null,
          })),
          { onConflict: "business_id,google_review_id", ignoreDuplicates: false }
        )
        .select();
      savedReviews = upserted ?? [];
    }

    return NextResponse.json({
      snapshot: { ...snapshot, sentiment },
      actionItems,
      reviews: savedReviews,
      analysisReviewCount: allReviews.length,
    });
  } catch (err) {
    console.error("refresh-audit failed:", err);
    return NextResponse.json({ error: "unexpected_error", details: String(err) }, { status: 500 });
  }
}