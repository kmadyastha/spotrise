// Razorpay's SDK (and some Stripe error paths) throw structured error
// objects rather than plain Error instances — typically shaped like
// { statusCode, error: { code, description, ... } }. Calling
// String(err) on one of these just gives "[object Object]", which is
// useless for debugging. This pulls out the actual message wherever
// it's found, falling back to JSON.stringify so nothing is ever lost.
export function describeError(err: unknown): string {
  if (err && typeof err === "object") {
    const anyErr = err as Record<string, any>;
    if (anyErr.error?.description) {
      return `${anyErr.error.code ?? "error"}: ${anyErr.error.description}`;
    }
    if (typeof anyErr.message === "string") {
      return anyErr.message;
    }
    try {
      return JSON.stringify(err);
    } catch {
      return String(err);
    }
  }
  return String(err);
}