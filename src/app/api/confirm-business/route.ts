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

    // Fetch richer details for the confirmed place, including up to 5
    // real reviews — this is what feeds the AI analysis below.
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    const detailsRes = await fetch(
      `https://places.googleapis.com/v1/places/${placeId}`,
      {
        headers: {
          "X-Goog-Api-Key": apiKey!,
          "X-Goog-FieldMask": "displayName,formattedAddress,rating,userRatingCount,photos,reviews",
        },
      }
    );

    const details = await detailsRes.json();

    if (!detailsRes.ok) {
      return NextResponse.json(
        { error: "places_details_error", details },
        { status: 502 }
      );
    }

    const reviewCount = details.userRatingCount ?? 0;
    const rating = details.rating ?? 0;
    const photoCount = details.photos?.length ?? 0;

    const rawReviews: any[] = details.reviews ?? [];
    const reviewsForAnalysis = rawReviews.slice(0, 5).map((r: any) => ({
      author: r.authorAttribution?.displayName ?? "Anonymous",
      rating: r.rating ?? 0,
      text: r.text?.text ?? r.originalText?.text ?? "",
      publishTime: r.publishTime ?? null,
    }));

    // Placeholder base score from real Places metrics — real AI-weighted
    // scoring can refine this further later, this stays deterministic.
    const score = Math.round(
      Math.min(100, rating * 15 + Math.min(reviewCount, 200) / 4 + Math.min(photoCount, 20) * 1.5)
    );

    // ---- Real AI analysis via Claude ----
    // One call generates sentiment breakdown, prioritized action items,
    // and a drafted reply for every review — cached from here on, never
    // regenerated unless the user explicitly hits "Regenerate."
    let sentiment = { positive: 0, neutral: 0, negative: 0 };
    let actionItems: { priority: string; title: string; description: string; impact: string }[] = [];
    let reviewReplies: string[] = reviewsForAnalysis.map(() => "");

    if (reviewsForAnalysis.length > 0) {
      const prompt = `You are a local-business consultant analyzing a Google Business Profile for "${name}". Current stats: ${rating} average rating, ${reviewCount} total reviews, ${photoCount} photos.

Here are up to 5 real recent reviews:
${reviewsForAnalysis.map((r, i) => `${i + 1}. [${r.rating}★] ${r.author}: "${r.text}"`).join("\n")}

Respond with ONLY valid JSON (no markdown fences, no commentary) in exactly this shape:
{
  "sentiment": { "positive": <int 0-100>, "neutral": <int 0-100>, "negative": <int 0-100> },
  "actionItems": [
    { "priority": "high" | "medium" | "low", "title": "<short title>", "description": "<one sentence, specific and actionable, referencing real patterns from the reviews or stats above>", "impact": "<short estimated benefit, e.g. '+15% customer trust'>" }
  ],
  "reviewReplies": ["<reply to review 1>", "<reply to review 2>", ...]
}

Rules: sentiment percentages must sum to 100. Give 3-5 actionItems, ordered highest priority first, genuinely derived from the reviews/stats (not generic filler). Each reviewReply must be warm, specific to that review's content, under 40 words, and professional — one reply per review, in the same order as listed above.`;

      const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": process.env.ANTHROPIC_API_KEY!,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 1500,
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
          reviewReplies = parsed.reviewReplies ?? reviewReplies;
        } catch (parseErr) {
          console.error("Claude response wasn't valid JSON:", claudeData.content?.[0]?.text);
          // Fall through with empty/default values rather than failing
          // the whole confirm — the audit still gets saved with real
          // Places data even if AI analysis hiccups this one time.
        }
      } else {
        console.error("Claude API error:", claudeData);
      }
    }

    const isPro = profile?.plan === "pro";

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

    // Save action items
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

    // Save reviews + their AI-drafted replies
    let savedReviews: any[] = [];
    if (reviewsForAnalysis.length > 0) {
      const { data: insertedReviews } = await supabase
        .from("reviews")
        .insert(
          reviewsForAnalysis.map((r, i) => ({
            business_id: business.id,
            author: r.author,
            rating: r.rating,
            text: r.text,
            review_date: r.publishTime,
            sentiment: r.rating >= 4 ? "positive" : r.rating === 3 ? "neutral" : "negative",
            ai_reply: reviewReplies[i] ?? "",
            ai_reply_generated_at: reviewReplies[i] ? new Date().toISOString() : null,
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
    });
  } catch (err) {
    console.error("confirm-business failed:", err);
    return NextResponse.json(
      { error: "unexpected_error", details: String(err) },
      { status: 500 }
    );
  }
}