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

    const isPro = profile?.plan === "pro";

    // Places is still used for score/rating/photo-count/name/address —
    // just no longer for review text (Places only ever returns 5,
    // and not reliably the newest 5 — see Outscraper below).
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
    if (!detailsRes.ok) {
      return NextResponse.json({ error: "places_details_error", details }, { status: 502 });
    }

    const reviewCount = details.userRatingCount ?? 0;
    const rating = details.rating ?? 0;
    const photoCount = details.photos?.length ?? 0;

    // ---- Real review text via Outscraper ----
    // Free tier: fetch 10 (analysis only — display still caps at 1).
    // Pro tier: fetch 50 (analysis AND full display).
    const fetchCount = isPro ? 50 : 10;
    let outscraperReviews: any[] = [];
    try {
      const outscraperRes = await fetch(
        `https://api.app.outscraper.com/maps/reviews-v2?query=${encodeURIComponent(placeId)}&reviewsLimit=${fetchCount}&sort=newest&async=false`,
        { headers: { "X-API-KEY": process.env.OUTSCRAPER_API_KEY! } }
      );
      const outscraperData = await outscraperRes.json();
      if (outscraperRes.ok) {
        // Outscraper's response shape can vary slightly by endpoint version —
        // log the raw shape once here if this ever comes back empty, so the
        // field names below can be corrected against the real payload.
        outscraperReviews = outscraperData?.[0]?.reviews_data ?? outscraperData?.data?.[0]?.reviews_data ?? [];
        if (outscraperReviews.length === 0) {
          console.error("Outscraper returned 0 reviews — raw response for debugging:", JSON.stringify(outscraperData).slice(0, 2000));
        }
      } else {
        console.error("Outscraper error:", outscraperData);
      }
    } catch (err) {
      console.error("Outscraper request failed:", err);
    }

    const allReviews = outscraperReviews.map((r: any) => ({
      author: r.author_title ?? r.author_name ?? "Anonymous",
      rating: r.review_rating ?? r.rating ?? 0,
      text: r.review_text ?? r.text ?? "",
      publishTime: r.review_datetime_utc ?? r.review_timestamp ?? null,
      googleReviewId: r.review_id ?? r.review_link ?? null,
    }));

    // How many of the fetched reviews actually get an AI reply generated
    // up front: free tier only ever shows 1, so only generate 1. Pro
    // shows all 50 but only pre-generates replies for the newest 10 —
    // the rest get a "Generate Reply" button, on demand.
    const autoReplyCount = isPro ? Math.min(10, allReviews.length) : Math.min(1, allReviews.length);

    const score = Math.round(
      Math.min(100, rating * 15 + Math.min(reviewCount, 200) / 4 + Math.min(photoCount, 20) * 1.5)
    );

    // ---- Real AI analysis via Claude ----
    let sentiment = { positive: 0, neutral: 0, negative: 0 };
    let actionItems: { priority: string; title: string; description: string; impact: string }[] = [];
    let reviewReplies: string[] = [];

    if (allReviews.length > 0) {
      const reviewsToReply = allReviews.slice(0, autoReplyCount);
      const prompt = `You are a local-business consultant analyzing a Google Business Profile for "${name}". Current stats: ${rating} average rating, ${reviewCount} total reviews, ${photoCount} photos.

Here are ${allReviews.length} real recent reviews for overall analysis:
${allReviews.map((r, i) => `${i + 1}. [${r.rating}★] ${r.author}: "${r.text}"`).join("\n")}

Respond with ONLY valid JSON (no markdown fences, no commentary) in exactly this shape:
{
  "sentiment": { "positive": <int 0-100>, "neutral": <int 0-100>, "negative": <int 0-100> },
  "actionItems": [
    { "priority": "high" | "medium" | "low", "title": "<short title>", "description": "<one sentence, specific and actionable, referencing real patterns from the reviews or stats above>", "impact": "<short estimated benefit, e.g. '+15% customer trust'>" }
  ],
  "reviewReplies": ["<reply to review 1>", ${reviewsToReply.length > 1 ? `"<reply to review 2>", ...` : ""}]
}

Rules: sentiment percentages must sum to 100, based on all ${allReviews.length} reviews above. Give 3-5 actionItems, ordered highest priority first, genuinely derived from patterns across all the reviews (not generic filler). For reviewReplies, draft a reply for ONLY the first ${reviewsToReply.length} review(s) listed above, in order — warm, specific to that review's content, under 40 words, professional. Do not draft replies for reviews beyond the first ${reviewsToReply.length}.`;

      const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": process.env.ANTHROPIC_API_KEY!,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 2500,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      const claudeData = await claudeRes.json();

      if (claudeRes.ok) {
        try {
          const rawText = claudeData.content?.[0]?.text ?? "{}";
          const cleaned = rawText.replace(/```json|```/g, "").trim();
          const parsed = JSON.parse(cleaned);
          sentiment = parsed.sentiment ?? sentiment;
          actionItems = parsed.actionItems ?? [];
          reviewReplies = parsed.reviewReplies ?? [];
        } catch (parseErr) {
          console.error("Claude response wasn't valid JSON:", claudeData.content?.[0]?.text);
        }
      } else {
        console.error("Claude API error:", claudeData);
      }
    }

    const { data: business, error: businessError } = await supabase
      .from("businesses")
      .insert({ user_id: user.id, place_id: placeId, name, is_linked: isPro })
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

    // Free tier only ever stores/shows 1 review (the newest) — no reason
    // to save the other 9 we fetched purely for analysis. Pro stores all
    // fetched reviews, with replies only on the auto-generated head.
    const reviewsToStore = isPro ? allReviews : allReviews.slice(0, 1);

    let savedReviews: any[] = [];
    if (reviewsToStore.length > 0) {
      const { data: insertedReviews } = await supabase
        .from("reviews")
        .insert(
          reviewsToStore.map((r, i) => ({
            business_id: business.id,
            google_review_id: r.googleReviewId,
            author: r.author,
            rating: r.rating,
            text: r.text,
            review_date: r.publishTime,
            sentiment: r.rating >= 4 ? "positive" : r.rating === 3 ? "neutral" : "negative",
            ai_reply: i < autoReplyCount ? (reviewReplies[i] ?? "") : "",
            ai_reply_generated_at: i < autoReplyCount && reviewReplies[i] ? new Date().toISOString() : null,
          }))
        )
        .select();
      savedReviews = insertedReviews ?? [];
    }

    if (!isPro) {
      await supabase
        .from("profiles")
        .update({ audit_credits_used: (profile?.audit_credits_used ?? 0) + 1 })
        .eq("id", user.id);
    }

    return NextResponse.json({
      business,
      snapshot: { ...snapshot, sentiment },
      actionItems,
      reviews: savedReviews,
      analysisReviewCount: allReviews.length,
    });
  } catch (err) {
    console.error("confirm-business failed:", err);
    return NextResponse.json({ error: "unexpected_error", details: String(err) }, { status: 500 });
  }
}