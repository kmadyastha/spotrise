import Razorpay from "razorpay";

// Server-side only. RAZORPAY_KEY_SECRET must never reach client code.
//
// Built lazily (only when a route actually calls getRazorpay(), not at
// module import time) — Next.js evaluates every route module during
// the build's "collect page data" step, so a top-level
// `new Razorpay(...)` throws and fails the ENTIRE deployment the
// moment RAZORPAY_KEY_ID/SECRET are missing, even for routes that
// never touch Razorpay. Building it inside a function means a missing
// key only breaks the specific request that needed it, at runtime.
let cachedClient: Razorpay | null = null;

export function getRazorpay(): Razorpay {
  if (!cachedClient) {
    cachedClient = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });
  }
  return cachedClient;
}