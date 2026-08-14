import Stripe from "stripe";

// Server-side only. Never import this from anything that runs in the
// browser — STRIPE_SECRET_KEY must never reach client code.
//
// Built lazily, same reasoning as src/lib/razorpay.ts: a top-level
// `new Stripe(...)` throws and fails the entire Vercel build the
// moment STRIPE_SECRET_KEY is missing, even though these Stripe
// routes currently aren't wired into the app (Razorpay is the active
// payment provider). Building it inside a function means these unused
// routes sit harmlessly until Stripe access actually comes through.
let cachedClient: Stripe | null = null;

export function getStripe(): Stripe {
  if (!cachedClient) {
    cachedClient = new Stripe(process.env.STRIPE_SECRET_KEY!);
  }
  return cachedClient;
}