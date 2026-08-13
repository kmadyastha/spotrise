import Stripe from "stripe";

// One shared Stripe client, server-side only. Never import this from
// anything that runs in the browser — STRIPE_SECRET_KEY must never
// reach client code.
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);