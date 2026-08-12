import { createClient } from "@/lib/supabase/server";
import { currentMembershipPeriodStart } from "@/lib/membership";
import { NextResponse } from "next/server";

const MONTHLY_ACTION_LIMIT = 5;

function normalizeText(r: any): string {
  if (typeof r === "string") return r;
  if (r && typeof r === "object") return r.text ?? r.content ?? JSON.stringify(r);
  return String(r ?? "");
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "not_authenticated" }, { status: 401 });

    const { data: profile } = await supabase.from("profiles").select("plan, pro_since").eq("id", user.id).single();
    if (profile?.plan !== "pro") return NextResponse.json({ error: "pro_only" }, { status: 403 });

    const { businessId, placeId, name } = await request.json();
    if (!businessId || !placeId || !name) return NextResponse.json({ error: "missing_fields" }, { status: 400 });

    const { data: business } = await supabase.from("businesses").select("id, user_id, name").eq("id", businessId).single();
    if (!business || business.user_id !== user.id) return NextResponse.json({ error: "not_found" }, { status: 404 });

    const { count } = await supabase.from("competitors").select("*", { count: "exact", head: true }).eq("business_id", businessId);
    if ((count ?? 0) >= 2) return NextResponse.json({ error: "competitor_limit_reached" }, { status: 403 });

    // Monthly change quota — adds AND deletes both count, so someone
    // can't cycle through unlimited competitors by repeatedly deleting
    // and re-adding within the 2-slot cap.
    const periodStart = currentMembershipPeriodStart(profile.pro_since ?? new Date());
    const { count: actionsUsed } = await supabase
      .from("competitor_actions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", periodStart.toISOString());
    if ((actionsUsed ?? 0) >= MONTHLY_ACTION_LIMIT) {
      return NextResponse.json({ error: "monthly_action_limit_reached" }, { status: 403 });
    }

    // Pull the user's own latest audit + a few real reviews, to ground
    // the comparison in specifics rather than just raw numbers.
    const { data: myLatestSnapshot } = await supabase
      .from("audit_snapshots").select("*").eq("business_id", businessId).order("scraped_at", { ascending: false }).limit(1).single();
    const { data: myReviews } = await supabase.from("reviews").select("text, rating").eq("business_id", businessId).limit(10);

    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    const detailsRes = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
      headers: { "X-Goog-Api-Key": apiKey!, "X-Goog-FieldMask": "rating,userRatingCount,photos" },
    });
    const details = await detailsRes.json();
    if (!detailsRes.ok) return NextResponse.json({ error: "places_details_error", details }, { status: 502 });

    const compRating = details.rating ?? 0;
    const compReviewCount = details.userRatingCount ?? 0;
    const compPhotoCount = details.photos?.length ?? 0;

    // Smaller review sample than the main audit — this is for comparison
    // insight, not full reply generation, so a lighter Outscraper pull
    // keeps the cost down per the 2-competitor cap we agreed on.
    let compReviews: string[] = [];
    try {
      const outscraperRes = await fetch(
        `https://api.app.outscraper.com/maps/reviews-v2?query=${encodeURIComponent(placeId)}&reviewsLimit=15&sort=newest&async=false`,
        { headers: { "X-API-KEY": process.env.OUTSCRAPER_API_KEY! } }
      );
      const outscraperData = await outscraperRes.json();
      if (outscraperRes.ok) {
        const raw = outscraperData?.[0]?.reviews_data ?? outscraperData?.data?.[0]?.reviews_data ?? [];
        compReviews = raw.map((r: any) => r.review_text ?? r.text ?? "").filter((t: string) => t.trim());
      }
    } catch (err) {
      console.error("Outscraper competitor fetch failed:", err);
    }

    const compScore = Math.round(Math.min(100, compRating * 15 + Math.min(compReviewCount, 200) / 4 + Math.min(compPhotoCount, 20) * 1.5));

    const prompt = `You are a local-business consultant comparing "${business.name}" against its competitor "${name}".

${business.name} (the client): Audit score ${myLatestSnapshot?.score ?? "unknown"}, ${myLatestSnapshot?.reviews_count ?? "unknown"} reviews, ${myLatestSnapshot?.rating ?? "unknown"} rating, ${myLatestSnapshot?.photo_count ?? "unknown"} photos.
Sample of ${business.name}'s real reviews: ${(myReviews ?? []).slice(0, 8).map((r) => `"${r.text}"`).join(" / ") || "none available"}

${name} (the competitor): ${compRating} rating, ${compReviewCount} reviews, ${compPhotoCount} photos.
Sample of ${name}'s real reviews: ${compReviews.slice(0, 10).map((t) => `"${t}"`).join(" / ") || "none available"}

Respond with ONLY valid JSON (no markdown fences, no commentary):
{ "insights": [ { "type": "gap" | "strength", "text": "<one specific, consulting-grade sentence — a real, actionable difference between the two, grounded in the actual numbers and review content above>" } ] }

Rules: 3-5 insights. "gap" = something the competitor does better that ${business.name} should address. "strength" = something ${business.name} already does better and should lean into or promote. Every insight must reference specific real numbers or specific real themes from the review samples — never generic advice like "respond to reviews more."`;

    let insights: { type: string; text: string }[] = [];
    try {
      const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "x-api-key": process.env.ANTHROPIC_API_KEY!, "anthropic-version": "2023-06-01", "content-type": "application/json" },
        body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 1000, messages: [{ role: "user", content: prompt }] }),
      });
      const claudeData = await claudeRes.json();
      if (claudeRes.ok) {
        const cleaned = (claudeData.content?.[0]?.text ?? "{}").replace(/```json|```/g, "").trim();
        insights = (JSON.parse(cleaned).insights ?? []).map((i: any) => ({ type: i.type, text: normalizeText(i.text) }));
      } else {
        console.error("Claude competitor analysis error:", claudeData);
      }
    } catch (e) {
      console.error("Competitor analysis failed:", e);
    }

    const { data: competitor, error: insertError } = await supabase
      .from("competitors")
      .insert({
        business_id: businessId, place_id: placeId, name,
        score: compScore, reviews_count: compReviewCount, rating: compRating, photo_count: compPhotoCount,
        gap_insights: insights,
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: "db_error", details: insertError.message }, { status: 500 });
    }

    await supabase.from("competitor_actions").insert({ user_id: user.id, business_id: businessId, action: "add" });

    return NextResponse.json({ competitor });
  } catch (err) {
    console.error("confirm-competitor failed:", err);
    return NextResponse.json({ error: "unexpected_error", details: String(err) }, { status: 500 });
  }
}