import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Claude is asked for plain-string replies but sometimes wraps one in an
// object anyway (a known model reliability quirk, not something wording
// alone reliably prevents) — extract the actual reply text regardless of
// shape instead of letting the raw JSON leak into what the user sees.
function normalizeReply(r: any): string {
  if (typeof r === "string") return r;
  if (r && typeof r === "object") return r.reply ?? r.text ?? r.content ?? JSON.stringify(r);
  return String(r ?? "");
}

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
    // Pro tier: fetch 50 upfront (analysis AND initial display). Reviews
    // beyond 50, up to an 80 cap, are pulled on demand via the "Load 10
    // more" button in the Reviews tab (see /api/load-more-reviews) —
    // not fetched all at once here, to avoid an unnecessarily large
    // Outscraper call on every single audit.
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

    // Fallback score if Claude's analysis fails entirely (no reviews, or
    // a parse error below) — real Places metadata, deliberately capped
    // lower than 100 since it can't account for what reviews actually say.
    const fallbackScore = Math.round(
      Math.min(85, rating * 12 + Math.min(reviewCount, 200) / 5 + Math.min(photoCount, 20) * 1)
    );
    let score = fallbackScore;

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
  "score": <int 0-100, your overall audit score for this profile>,
  "sentiment": { "positive": <int 0-100>, "neutral": <int 0-100>, "negative": <int 0-100> },
  "actionItems": [
    { "priority": "high" | "medium" | "low", "title": "<short title>", "description": "<one sentence, specific and actionable, referencing real patterns from the reviews or stats above>", "impact": "<short estimated benefit, e.g. '+15% customer trust'>" }
  ],
  "reviewReplies": ["<reply to review 1>", ${reviewsToReply.length > 1 ? `"<reply to review 2>", ...` : ""}]
}

Rules: the score, sentiment, and actionItems must all be CONSISTENT with each other and with what the reviews actually say — do not let a high star rating alone drive a high score if the review text describes real, recurring problems (broken equipment, poor service, hygiene, safety, etc). A profile with significant negative themes across reviews should score well below 100 even with a decent average rating. Sentiment percentages must sum to 100, based on all ${allReviews.length} reviews above. Give 3-5 actionItems, ordered highest priority first, genuinely derived from patterns across all the reviews (not generic filler). For reviewReplies, draft a reply for ONLY the first ${reviewsToReply.length} review(s) listed above, in order — warm, specific to that review's content, under 40 words, professional. Do not draft replies for reviews beyond the first ${reviewsToReply.length}. Each item in reviewReplies must be a PLAIN STRING — never an object, never wrapped with review number or reviewer name fields.`;

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
          score = typeof parsed.score === "number" ? Math.max(0, Math.min(100, Math.round(parsed.score))) : fallbackScore;
          sentiment = parsed.sentiment ?? sentiment;
          actionItems = parsed.actionItems ?? [];
          reviewReplies = (parsed.reviewReplies ?? []).map(normalizeReply);
        } catch (parseErr) {
          console.error("Claude response wasn't valid JSON:", claudeData.content?.[0]?.text);
        }
      } else {
        console.error("Claude API error:", claudeData);
      }
    }

    // ---- Real Weekly Posts, generated from the actual business + reviews ----
    // Separate call from the review analysis above — keeps each prompt
    // focused and easier to debug independently.
    let generatedPosts: { type: string; title: string; content: string }[] = [];
    if (allReviews.length > 0) {
      const postsPrompt = `You are a local-business social media consultant writing Google Business Profile posts for "${name}". Rating: ${rating}★, ${reviewCount} reviews.

Here are real customer reviews to draw genuine, specific details from (things praised, things mentioned, offerings referenced):
${allReviews.slice(0, 15).map((r, i) => `${i + 1}. [${r.rating}★] "${r.text}"`).join("\n")}

Write 4 Google Business Profile posts. Respond with ONLY valid JSON (no markdown fences, no commentary):
{
  "posts": [
    { "type": "Offer" | "Update" | "Event" | "Story", "title": "<short catchy title>", "content": "<the post text, 1-2 sentences, include one relevant emoji, reference something genuinely specific to this business from the reviews above — not generic filler>" }
  ]
}

Rules: exactly 4 posts, one of each type. Every post must reference something real and specific about THIS business (a praised feature, a real offering, a real strength mentioned in reviews) — never invent unrelated promotions (no pizza deals unless this is actually a pizza place).`;

      try {
        const postsRes = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "x-api-key": process.env.ANTHROPIC_API_KEY!,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
          },
          body: JSON.stringify({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 1000,
            messages: [{ role: "user", content: postsPrompt }],
          }),
        });
        const postsData = await postsRes.json();
        if (postsRes.ok) {
          const cleaned = (postsData.content?.[0]?.text ?? "{}").replace(/```json|```/g, "").trim();
          generatedPosts = JSON.parse(cleaned).posts ?? [];
        } else {
          console.error("Claude posts generation error:", postsData);
        }
      } catch (e) {
        console.error("Posts generation failed:", e);
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

    let savedPosts: any[] = [];
    if (generatedPosts.length > 0) {
      const { data: insertedPosts } = await supabase
        .from("posts")
        .insert(generatedPosts.map((p) => ({ business_id: business.id, type: p.type, title: p.title, content: p.content })))
        .select();
      savedPosts = insertedPosts ?? [];
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
      posts: savedPosts,
      analysisReviewCount: allReviews.length,
    });
  } catch (err) {
    console.error("confirm-business failed:", err);
    return NextResponse.json({ error: "unexpected_error", details: String(err) }, { status: 500 });
  }
}