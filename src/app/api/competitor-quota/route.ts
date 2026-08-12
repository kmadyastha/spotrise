import { createClient } from "@/lib/supabase/server";
import { currentMembershipPeriodStart } from "@/lib/membership";
import { NextResponse } from "next/server";

const MONTHLY_LIMIT = 5;

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "not_authenticated" }, { status: 401 });

    const { data: profile } = await supabase.from("profiles").select("plan, pro_since").eq("id", user.id).single();
    if (profile?.plan !== "pro") return NextResponse.json({ error: "pro_only" }, { status: 403 });

    const periodStart = currentMembershipPeriodStart(profile.pro_since ?? new Date());
    const { count } = await supabase
      .from("competitor_actions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", periodStart.toISOString());

    const used = count ?? 0;
    return NextResponse.json({ used, limit: MONTHLY_LIMIT, remaining: Math.max(0, MONTHLY_LIMIT - used), periodStart: periodStart.toISOString() });
  } catch (err) {
    console.error("competitor-quota failed:", err);
    return NextResponse.json({ error: "unexpected_error", details: String(err) }, { status: 500 });
  }
}