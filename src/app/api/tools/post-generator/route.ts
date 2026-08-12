import { createClient } from "@/lib/supabase/server";
import { currentMembershipPeriodStart } from "@/lib/membership";
import { NextResponse } from "next/server";

const MONTHLY_LIMIT = 20;

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "not_authenticated" }, { status: 401 });

    const { businessId, focus } = await request.json();
    if (!businessId) return NextResponse.json({ error: "missing_business_id" }, { status: 400 });

    const { data: profile } = await supabase.from("profiles").select("plan, pro_since").eq("id", user.id).single();
    if (profile?.plan !== "pro") return NextResponse.json({ error: "pro_only" }, { status: 403 });

    const { data: business } = await supabase.from("businesses").select("id, user_id, name").eq("id", businessId).single();
    if (!business || business.user_id !== user.id) return NextResponse.json({ error: "not_found" }, { status: 404 });

    // Membership-month, not calendar month — anchored to when this
    // account actually went Pro, consistent with every other Pro quota.
    const startOfMonth = currentMembershipPeriodStart(profile?.pro_since ?? new Date());
    const { count } = await supabase
      .from("tool_usage")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("tool", "post_generator")
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

    const prompt = `You are a local-business social media consultant writing Google Business Profile posts for "${business.name}".

Real customer reviews for context (things praised, things mentioned, offerings referenced):
${reviewTexts.slice(0, 15).map((t, i) => `${i + 1}. "${t}"`).join("\n") || "(no review text available)"}

${focus?.trim() ? `The owner wants a post about: "${focus.trim()}"` : "Suggest natural post ideas based on what's genuinely notable about this business right now, drawn from the reviews above."}

Write 3 Google Business Profile post options. Respond with ONLY valid JSON (no markdown fences, no commentary):
{ "posts": [ { "type": "Offer" | "Update" | "Event" | "Story", "title": "<short catchy title>", "content": "<the post text, 1-2 sentences, include one relevant emoji>" } ] }

Every post must reference something real and specific about THIS business (a praised feature, a real offering, a real strength mentioned in reviews) — never invent unrelated promotions (no discounts or deals unless the owner specifically asked for one). Keep each post well under 1500 characters (the Google Business Profile post limit).`;

    const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": process.env.ANTHROPIC_API_KEY!, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 1000, messages: [{ role: "user", content: prompt }] }),
    });
    const claudeData = await claudeRes.json();
    if (!claudeRes.ok) return NextResponse.json({ error: "claude_error", details: claudeData }, { status: 502 });

    const cleaned = (claudeData.content?.[0]?.text ?? "{}").replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    await supabase.from("tool_usage").insert({ user_id: user.id, business_id: businessId, tool: "post_generator" });

    return NextResponse.json({ posts: parsed.posts ?? [] });
  } catch (err) {
    console.error("post-generator failed:", err);
    return NextResponse.json({ error: "unexpected_error", details: String(err) }, { status: 500 });
  }
}