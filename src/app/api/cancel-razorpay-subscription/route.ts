import { createClient } from "@/lib/supabase/server";
import { getRazorpay } from "@/lib/razorpay";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "not_authenticated" }, { status: 401 });

    const { data: profile } = await supabase.from("profiles").select("razorpay_subscription_id").eq("id", user.id).single();
    if (!profile?.razorpay_subscription_id) {
      return NextResponse.json({ error: "no_subscription" }, { status: 400 });
    }

    // cancel_at_cycle_end: keep Pro access through the current billing
    // period rather than cutting it off immediately — matches what the
    // Terms of Service already promises ("access continues through the
    // end of your current billing period"). The plan itself flips back
    // to free later, when Razorpay's subscription.cancelled webhook
    // actually fires at cycle end — not here.
    await getRazorpay().subscriptions.cancel(profile.razorpay_subscription_id, true);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("cancel-razorpay-subscription failed:", err);
    return NextResponse.json({ error: "unexpected_error", details: String(err) }, { status: 500 });
  }
}