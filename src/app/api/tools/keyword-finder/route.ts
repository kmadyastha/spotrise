import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const MONTHLY_LIMIT = 20;

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "not_authenticated" }, { status: 401 });

    const { businessId } = await request.json();
    if (!businessId) return NextResponse.json({ error: "missing_business_id" }, { status: 400 });

    const { data: profile } = await supabase.from("profiles").select("plan").eq("id", user.id).single();
    if (profile?.plan !== "pro") return NextResponse.json({ error: "pro_only" }, { status: 403 });

    const { data: business } = await supabase.from("businesses").select("id, user_id, name").eq("id", businessId).single();
    if (!business || business.user_id !== user.id) return NextResponse.json({ error: "not_found" }, { status: 404 });

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const { count } = await supabase
      .from("tool_usage")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("tool", "keyword_finder")
      .gte("created_at", startOfMonth.toISOString());

    if ((count ?? 0) >= MONTHLY_LIMIT) {
      return NextResponse.json({ error: "monthly_limit_reached" }, { status: 429 });
    }

    // Reuses reviews already stored from the last audit/refresh — no new
    // Outscraper call needed, this tool is Claude-only.
    const { data: reviews } = await supabase
      .from("reviews")
      .select("text, rating")
      .eq("business_id", businessId)
      .limit(50);

    const reviewTexts = (reviews ?? []).filter((r) => r.text?.trim()).map((r) => r.text);

    const prompt = `You are a local-SEO consultant for "${business.name}". Here are real customer reviews for context:
${reviewTexts.slice(0, 30).map((t, i) => `${i + 1}. "${t}"`).join("\n") || "(no review text available)"}

Suggest likely local-search phrases customers use to find a business like this, and separately pull genuinely recurring short phrases directly from the review text above.

Respond with ONLY valid JSON (no markdown fences, no commentary):
{
  "likelySearches": [ { "phrase": "<search phrase>", "relevance": "high" | "medium" } ],
  "fromReviews": ["<short real phrase from the reviews>"]
}

Rules: 4-6 likelySearches (mix of high/medium relevance), realistic phrases someone would actually type, include the business type and area if inferable. 4-8 fromReviews — genuinely recurring short phrases (2-4 words) that actually appear in or closely paraphrase the review text, not invented ones.`;

    const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": process.env.ANTHROPIC_API_KEY!, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 800, messages: [{ role: "user", content: prompt }] }),
    });
    const claudeData = await claudeRes.json();
    if (!claudeRes.ok) return NextResponse.json({ error: "claude_error", details: claudeData }, { status: 502 });

    const cleaned = (claudeData.content?.[0]?.text ?? "{}").replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    await supabase.from("tool_usage").insert({ user_id: user.id, business_id: businessId, tool: "keyword_finder" });

    return NextResponse.json({ likelySearches: parsed.likelySearches ?? [], fromReviews: parsed.fromReviews ?? [] });
  } catch (err) {
    console.error("keyword-finder failed:", err);
    return NextResponse.json({ error: "unexpected_error", details: String(err) }, { status: 500 });
  }
}