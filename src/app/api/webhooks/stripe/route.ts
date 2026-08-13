import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";
import type Stripe from "stripe";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "missing_signature" }, { status: 400 });
  }

  // Signature verification requires the exact raw request body — do
  // not parse this as JSON before passing it to Stripe's SDK, or
  // verification will fail even for genuine events.
  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error("stripe webhook: signature verification failed:", err);
    return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
  }

  const admin = createAdminClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
        const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
        const userId = session.client_reference_id;

        if (!customerId) break;

        const update = { plan: "pro", pro_since: new Date().toISOString(), stripe_subscription_id: subscriptionId ?? null };

        // Match on stripe_customer_id primarily; client_reference_id
        // (the Supabase user ID we set when creating the session) is a
        // fallback in case the customer link is somehow out of sync.
        const { error } = await admin.from("profiles").update(update).eq("stripe_customer_id", customerId);
        if (error || userId) {
          await admin.from("profiles").update({ ...update, stripe_customer_id: customerId }).eq("id", userId ?? "");
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
        const isActive = subscription.status === "active" || subscription.status === "trialing";

        await admin
          .from("profiles")
          .update({
            plan: isActive ? "pro" : "free",
            stripe_subscription_id: subscription.id,
          })
          .eq("stripe_customer_id", customerId);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;

        await admin
          .from("profiles")
          .update({ plan: "free" })
          .eq("stripe_customer_id", customerId);
        break;
      }

      default:
        // Other event types are fine to ignore — we only act on the
        // three that actually change subscription status.
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("stripe webhook: handler failed:", err);
    // Return 500 so Stripe retries this event automatically rather than
    // silently dropping a plan change.
    return NextResponse.json({ error: "handler_failed" }, { status: 500 });
  }
}