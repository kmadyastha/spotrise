import { createClient } from "@/lib/supabase/server";
import { currentMembershipPeriodStart } from "@/lib/membership";
import { NextResponse } from "next/server";

const MONTHLY_LIMIT = 20;

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "not_authenticated" }, { status: 401 });

    const { businessId } = await request.json();
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
      .eq("tool", "photo_strategy")
      .gte("created_at", startOfMonth.toISOString());

    if ((count ?? 0) >= MONTHLY_LIMIT) {
      return NextResponse.json({ error: "monthly_limit_reached" }, { status: 429 });
    }

    const { data: reviews } = await supabase
      .from("reviews")
      .select("text")
      .eq("business_id", businessId)
      .limit(50);
    const reviewTexts = (reviews ?? []).filter((r) => r.text?.trim()).map((r) => r.text);

    const { data: latestSnapshot } = await supabase
      .from("audit_snapshots")
      .select("photo_count")
      .eq("business_id", businessId)
      .order("scraped_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const prompt = `You are a local-business marketing consultant advising "${business.name}" on Google Business Profile photos. They currently have ${latestSnapshot?.photo_count ?? "an unknown number of"} photos listed.

Real customer reviews for context (mentions of ambience, offerings, features):
${reviewTexts.slice(0, 20).map((t, i) => `${i + 1}. "${t}"`).join("\n") || "(no review text available)"}

Recommend specific photo categories this business should add, prioritized by likely impact on Google Maps visibility and click-through, tailored to what's genuinely relevant for this type of business based on the reviews above.

Respond with ONLY valid JSON (no markdown fences, no commentary):
{ "recommendations": [ { "category": "<short category name, e.g. 'Exterior / storefront'>", "why": "<1-2 sentences on why this helps, specific to this business where the reviews support it>" } ] }

5-7 recommendations, ordered highest-impact first. This is category-and-reasoning guidance only — do not attempt to generate, describe, or mock up any specific image.`;

    const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": process.env.ANTHROPIC_API_KEY!, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 900, messages: [{ role: "user", content: prompt }] }),
    });
    const claudeData = await claudeRes.json();
    if (!claudeRes.ok) return NextResponse.json({ error: "claude_error", details: claudeData }, { status: 502 });

    const cleaned = (claudeData.content?.[0]?.text ?? "{}").replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    await supabase.from("tool_usage").insert({ user_id: user.id, business_id: businessId, tool: "photo_strategy" });

    return NextResponse.json({ recommendations: parsed.recommendations ?? [] });
  } catch (err) {
    console.error("photo-strategy failed:", err);
    return NextResponse.json({ error: "unexpected_error", details: String(err) }, { status: 500 });
  }
}