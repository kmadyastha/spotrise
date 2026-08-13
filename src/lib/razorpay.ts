import Razorpay from "razorpay";

// One shared Razorpay client, server-side only. RAZORPAY_KEY_SECRET
// must never reach client code.
export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});