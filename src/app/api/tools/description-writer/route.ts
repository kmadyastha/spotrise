import { createClient } from "@/lib/supabase/server";
import { currentMembershipPeriodStart } from "@/lib/membership";
import { NextResponse } from "next/server";

const MONTHLY_LIMIT = 20;

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "not_authenticated" }, { status: 401 });

    const { businessId, differentiators, tone, highlights } = await request.json();
    if (!businessId) return NextResponse.json({ error: "missing_business_id" }, { status: 400 });

    const { data: profile } = await supabase.from("profiles").select("plan, pro_since").eq("id", user.id).single();
    if (profile?.plan !== "pro") return NextResponse.json({ error: "pro_only" }, { status: 403 });

    const { data: business } = await supabase.from("businesses").select("id, user_id, name").eq("id", businessId).single();
    if (!business || business.user_id !== user.id) return NextResponse.json({ error: "not_found" }, { status: 404 });

    // Monthly cap — abuse prevention, not a cost concern (each call is a
    // fraction of a cent), same pattern as audit_credits_used.
    // Membership-month, not calendar month — anchored to when this
    // account actually went Pro (e.g. upgraded Aug 15 -> resets the 15th
    // of each month, not the 1st), consistent with every other Pro quota.
    const startOfMonth = currentMembershipPeriodStart(profile?.pro_since ?? new Date());
    const { count } = await supabase
      .from("tool_usage")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("tool", "description_writer")
      .gte("created_at", startOfMonth.toISOString());

    if ((count ?? 0) >= MONTHLY_LIMIT) {
      return NextResponse.json({ error: "monthly_limit_reached" }, { status: 429 });
    }

    const prompt = `You are a local-business copywriter writing the official "From the business" description for "${business.name}" on Google Business Profile.

What makes this business different: ${differentiators || "not specified"}
Tone: ${tone || "Professional"}
Things to highlight: ${highlights || "not specified"}

Write 2 full-length description options. Respond with ONLY valid JSON (no markdown fences, no commentary):
{ "options": ["<description 1>", "<description 2>"] }

Hard rules: each option must be between 500-650 characters — this is a strict technical limit (Google rejects anything over 750, so stay well under it; models tend to overestimate their own length, aim short). The first 250 characters must work as a standalone hook (who/what/where) since that's all that shows before "Read more." No pricing, deals, sales, or time-sensitive offers — Google's policy reserves that for Posts, not this field. No URLs or HTML. No emojis (this is a formal bio field, not a social post). Write in ${tone || "a professional"} tone, naturally incorporating relevant local-search phrases without keyword-stuffing.`;

    const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": process.env.ANTHROPIC_API_KEY!, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 1200, messages: [{ role: "user", content: prompt }] }),
    });
    const claudeData = await claudeRes.json();
    if (!claudeRes.ok) return NextResponse.json({ error: "claude_error", details: claudeData }, { status: 502 });

    const cleaned = (claudeData.content?.[0]?.text ?? "{}").replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    // Safety net: LLMs are unreliable at hitting an exact character count
    // (they estimate, they don't actually count as they write) — asking
    // more firmly in the prompt reduces overshoot but can't guarantee it.
    // Hard-enforce the real Google limit here regardless of what came back,
    // trimming at the last full sentence (or word) before the cutoff.
    const GBP_LIMIT = 750;
    const enforceLimit = (text: string): string => {
      if (text.length <= GBP_LIMIT) return text;
      const cut = text.slice(0, GBP_LIMIT);
      const lastSentenceEnd = cut.lastIndexOf(". ");
      if (lastSentenceEnd > GBP_LIMIT * 0.6) return cut.slice(0, lastSentenceEnd + 1);
      const lastSpace = cut.lastIndexOf(" ");
      return lastSpace > 0 ? cut.slice(0, lastSpace) : cut;
    };
    const options = (parsed.options ?? []).map(enforceLimit);

    await supabase.from("tool_usage").insert({ user_id: user.id, business_id: businessId, tool: "description_writer" });

    return NextResponse.json({ options });
  } catch (err) {
    console.error("description-writer failed:", err);
    return NextResponse.json({ error: "unexpected_error", details: String(err) }, { status: 500 });
  }
}