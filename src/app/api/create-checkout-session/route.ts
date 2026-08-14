import { createClient } from "@/lib/supabase/server";
import { getRazorpay } from "@/lib/razorpay";
import { describeError } from "@/lib/error-utils";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "not_authenticated" }, { status: 401 });

    const { data: profile } = await supabase.from("profiles").select("plan").eq("id", user.id).single();
    if (profile?.plan === "pro") {
      return NextResponse.json({ error: "already_pro" }, { status: 400 });
    }

    // total_count is required by Razorpay's Subscriptions API — there's
    // no native "bill indefinitely" option, so 1200 monthly cycles
    // (100 years) is the standard way to represent an open-ended plan.
    // The Supabase user ID goes in notes so the webhook can match this
    // subscription back to the right account without depending on a
    // pre-created customer record.
    const subscription = await getRazorpay().subscriptions.create({
      plan_id: process.env.RAZORPAY_PLAN_ID!,
      customer_notify: 1,
      total_count: 1200,
      notes: { supabase_user_id: user.id },
    });

    await supabase.from("profiles").update({ razorpay_subscription_id: subscription.id }).eq("id", user.id);

    // key_id (unlike key_secret) is meant to be public — Razorpay's own
    // Checkout widget requires it client-side. Returning it here avoids
    // needing a separate NEXT_PUBLIC_ env var duplicating the same value.
    return NextResponse.json({ subscriptionId: subscription.id, keyId: process.env.RAZORPAY_KEY_ID });
  } catch (err) {
    console.error("create-razorpay-subscription failed:", err);
    return NextResponse.json({ error: "unexpected_error", details: describeError(err) }, { status: 500 });
  }
}