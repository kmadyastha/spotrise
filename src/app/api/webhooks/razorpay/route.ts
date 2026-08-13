import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import crypto from "crypto";

interface RazorpaySubscriptionEntity {
  id: string;
  customer_id?: string;
  status: string;
  notes?: { supabase_user_id?: string };
}

export async function POST(request: Request) {
  const signature = request.headers.get("x-razorpay-signature");
  if (!signature) {
    return NextResponse.json({ error: "missing_signature" }, { status: 400 });
  }

  // Signature verification needs the exact raw body — parsing it first
  // would change the bytes being hashed and always fail verification,
  // even for genuine events from Razorpay.
  const rawBody = await request.text();

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(rawBody)
    .digest("hex");

  if (expectedSignature !== signature) {
    console.error("razorpay webhook: signature verification failed");
    return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
  }

  const event = JSON.parse(rawBody);
  const admin = createAdminClient();

  try {
    const subscription: RazorpaySubscriptionEntity | undefined = event.payload?.subscription?.entity;
    const userId = subscription?.notes?.supabase_user_id;

    if (!subscription || !userId) {
      // Not a subscription event we care about (or missing the note we
      // set at creation time) — acknowledge and move on rather than
      // erroring, so Razorpay doesn't keep retrying something we'll
      // never be able to match to a user.
      return NextResponse.json({ received: true });
    }

    switch (event.event) {
      case "subscription.activated":
      case "subscription.charged": {
        await admin
          .from("profiles")
          .update({
            plan: "pro",
            pro_since: new Date().toISOString(),
            razorpay_subscription_id: subscription.id,
            razorpay_customer_id: subscription.customer_id ?? null,
          })
          .eq("id", userId);
        break;
      }

      case "subscription.cancelled":
      case "subscription.completed":
      case "subscription.halted": {
        await admin.from("profiles").update({ plan: "free" }).eq("id", userId);
        break;
      }

      default:
        // Other event types (authenticated, pending, paused, resumed,
        // updated) don't need a plan change on their own.
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("razorpay webhook: handler failed:", err);
    // Non-200 so Razorpay retries this event automatically rather than
    // silently dropping a plan change.
    return NextResponse.json({ error: "handler_failed" }, { status: 500 });
  }
}