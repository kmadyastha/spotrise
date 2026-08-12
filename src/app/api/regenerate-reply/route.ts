import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
    }

    const { reviewId, businessName, reviewText, reviewRating } = await request.json();
    if (!reviewId) {
      return NextResponse.json({ error: "missing_fields" }, { status: 400 });
    }

    // Confirm this review actually belongs to a business owned by this
    // user, before spending an AI call or touching the database.
    // Two simple queries instead of one embedded join — a join here
    // depends on Supabase auto-detecting the reviews->businesses foreign
    // key AND on RLS allowing the embedded businesses row to be visible
    // in that shape; if either isn't right, it silently comes back empty
    // with no way to tell which one failed. This version logs the real
    // Supabase error at each step so a failure is actually diagnosable.
    const { data: review, error: reviewError } = await supabase
      .from("reviews")
      .select("id, business_id")
      .eq("id", reviewId)
      .single();

    if (reviewError || !review) {
      console.error("regenerate-reply: review lookup failed:", reviewError);
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const { data: business, error: businessError } = await supabase
      .from("businesses")
      .select("user_id")
      .eq("id", review.business_id)
      .single();

    if (businessError || !business || business.user_id !== user.id) {
      console.error("regenerate-reply: business ownership check failed:", businessError);
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const prompt = `You are a local-business consultant drafting a reply for "${businessName}" to this ${reviewRating}-star review${
      reviewText ? `: "${reviewText}"` : " (the customer left only a star rating, no written comment)"
    }.

Respond with ONLY the reply text — no JSON, no quotes, no commentary. Keep it warm, ${reviewText ? "specific to this review's content, " : "genuinely appreciative and inviting them to share more detail, "}under 40 words, and professional.`;

    const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 200,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const claudeData = await claudeRes.json();
    if (!claudeRes.ok) {
      return NextResponse.json({ error: "claude_error", details: claudeData }, { status: 502 });
    }

    const newReply = (claudeData.content?.[0]?.text ?? "").trim();

    const { error: updateError } = await supabase
      .from("reviews")
      .update({ ai_reply: newReply, ai_reply_generated_at: new Date().toISOString() })
      .eq("id", reviewId);

    if (updateError) {
      return NextResponse.json({ error: "db_error", details: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ reply: newReply });
  } catch (err) {
    console.error("regenerate-reply failed:", err);
    return NextResponse.json({ error: "unexpected_error", details: String(err) }, { status: 500 });
  }
}