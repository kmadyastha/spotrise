import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "not_authenticated" }, { status: 401 });

    const { data: profile } = await supabase.from("profiles").select("plan, stripe_customer_id").eq("id", user.id).single();
    if (profile?.plan === "pro") {
      return NextResponse.json({ error: "already_pro" }, { status: 400 });
    }

    // Reuse an existing Stripe customer if this user already has one
    // (e.g. a past cancellation), rather than creating a duplicate.
    let customerId = profile?.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;
      await supabase.from("profiles").update({ stripe_customer_id: customerId }).eq("id", user.id);
    }

    const origin = request.headers.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      // Belt-and-suspenders alongside the customer link — the webhook
      // primarily matches on customer ID, but having the Supabase user
      // ID directly on the session too makes checkout.session.completed
      // resilient even in edge cases where the customer lookup is slow.
      client_reference_id: user.id,
      line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
      success_url: `${origin}/?checkout=success`,
      cancel_url: `${origin}/?checkout=cancelled`,
    });

    if (!session.url) {
      return NextResponse.json({ error: "no_checkout_url" }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("create-checkout-session failed:", err);
    return NextResponse.json({ error: "unexpected_error", details: String(err) }, { status: 500 });
  }
}