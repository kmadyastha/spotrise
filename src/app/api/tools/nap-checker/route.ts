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

    const { data: business } = await supabase.from("businesses").select("id, user_id, name, place_id").eq("id", businessId).single();
    if (!business || business.user_id !== user.id) return NextResponse.json({ error: "not_found" }, { status: 404 });

    // Membership-month, not calendar month — anchored to when this
    // account actually went Pro, consistent with every other Pro quota.
    const startOfMonth = currentMembershipPeriodStart(profile?.pro_since ?? new Date());
    const { count } = await supabase
      .from("tool_usage")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("tool", "nap_checker")
      .gte("created_at", startOfMonth.toISOString());

    if ((count ?? 0) >= MONTHLY_LIMIT) {
      return NextResponse.json({ error: "monthly_limit_reached" }, { status: 429 });
    }

    // Fetch NAP live from Google Places rather than trusting whatever
    // happens to be in the latest stored audit snapshot — snapshots are
    // written by different code paths over time (confirm-business,
    // refresh-audit) and phone number in particular was never part of
    // any stored field mask until now. This guarantees a fresh,
    // accurate canonical NAP regardless of any historical gaps.
    let canonical = { name: business.name, address: "", phone: "" };
    if (business.place_id) {
      try {
        const detailsRes = await fetch(
          `https://places.googleapis.com/v1/places/${business.place_id}`,
          { headers: { "X-Goog-Api-Key": process.env.GOOGLE_PLACES_API_KEY!, "X-Goog-FieldMask": "displayName,formattedAddress,nationalPhoneNumber,internationalPhoneNumber" } }
        );
        if (detailsRes.ok) {
          const details = await detailsRes.json();
          canonical = {
            name: details.displayName?.text ?? business.name,
            address: details.formattedAddress ?? "",
            phone: details.nationalPhoneNumber ?? details.internationalPhoneNumber ?? "",
          };
        } else {
          console.error("nap-checker: Places details fetch failed:", await detailsRes.text());
        }
      } catch (err) {
        console.error("nap-checker: Places details request failed:", err);
      }
    }

    const prompt = `You are a local-SEO consultant helping "${canonical.name}" fix NAP (Name, Address, Phone) consistency across directory listings.

Canonical NAP from their Google Business Profile — this is the exact version that should be used everywhere:
Name: ${canonical.name}
Address: ${canonical.address || "not available"}
Phone: ${canonical.phone || "not listed on Google Business Profile"}

Give a short, specific consistency checklist for keeping this exact NAP identical on Facebook Business Page, Bing Places, and Yelp. Call out the specific formatting mistakes owners commonly make that would realistically apply to fixing THIS listing (e.g. abbreviations like "St." vs "Street", suite/floor formatting, phone format with or without country code, business name with vs without a location suffix like "8th Phase").

Respond with ONLY valid JSON (no markdown fences, no commentary):
{ "checklist": [ { "platform": "Facebook" | "Bing Places" | "Yelp", "tip": "<specific, actionable tip, under 25 words>" } ] }

Exactly 3 items, one per platform, in that order.`;

    const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": process.env.ANTHROPIC_API_KEY!, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 500, messages: [{ role: "user", content: prompt }] }),
    });
    const claudeData = await claudeRes.json();
    if (!claudeRes.ok) return NextResponse.json({ error: "claude_error", details: claudeData }, { status: 502 });

    const cleaned = (claudeData.content?.[0]?.text ?? "{}").replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    await supabase.from("tool_usage").insert({ user_id: user.id, business_id: businessId, tool: "nap_checker" });

    return NextResponse.json({ canonical, checklist: parsed.checklist ?? [] });
  } catch (err) {
    console.error("nap-checker failed:", err);
    return NextResponse.json({ error: "unexpected_error", details: String(err) }, { status: 500 });
  }
}