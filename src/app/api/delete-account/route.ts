import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRazorpay } from "@/lib/razorpay";
import { describeError } from "@/lib/error-utils";
import { NextResponse } from "next/server";

export async function DELETE() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "not_authenticated" }, { status: 401 });

    // Self-service deletion is Pro-only, on purpose: a Free account can
    // delete+recreate to reset its 2-lifetime-audit limit indefinitely,
    // since a fresh signup always starts with a clean slate. Gating this
    // to Pro removes the incentive — there's nothing to "reset" that's
    // worth losing a paid plan over. Free users can still request
    // deletion; it just goes through support instead of being instant.
    const { data: profile } = await supabase.from("profiles").select("plan, razorpay_subscription_id").eq("id", user.id).single();
    if (profile?.plan !== "pro") {
      return NextResponse.json({ error: "pro_only" }, { status: 403 });
    }

    // Cancel the real subscription FIRST, before deleting anything —
    // immediately (not cancel_at_cycle_end), since there's no account
    // left afterward to keep access alive for. If this fails, stop here
    // rather than deleting the account and leaving a live subscription
    // silently billing nobody-knows-who forever.
    if (profile.razorpay_subscription_id) {
      try {
        await getRazorpay().subscriptions.cancel(profile.razorpay_subscription_id, false);
      } catch (err) {
        console.error("delete-account: failed to cancel Razorpay subscription:", err);
        return NextResponse.json({ error: "cancel_failed", details: describeError(err) }, { status: 500 });
      }
    }

    const admin = createAdminClient();

    const { data: businesses } = await admin.from("businesses").select("id").eq("user_id", user.id);
    const businessIds = (businesses ?? []).map((b) => b.id);

    // Business-scoped tables first (they reference business_id), then
    // user-scoped tables, then the business rows themselves, then the
    // profile, then finally the auth user — deleting in this order
    // avoids leaving any orphaned rows behind if something fails partway.
    if (businessIds.length > 0) {
      await admin.from("reviews").delete().in("business_id", businessIds);
      await admin.from("posts").delete().in("business_id", businessIds);
      await admin.from("action_items").delete().in("business_id", businessIds);
      await admin.from("audit_snapshots").delete().in("business_id", businessIds);
      await admin.from("competitors").delete().in("business_id", businessIds);
    }
    await admin.from("competitor_actions").delete().eq("user_id", user.id);
    await admin.from("tool_usage").delete().eq("user_id", user.id);
    await admin.from("businesses").delete().eq("user_id", user.id);
    await admin.from("profiles").delete().eq("id", user.id);

    const { error: authDeleteError } = await admin.auth.admin.deleteUser(user.id);
    if (authDeleteError) {
      console.error("delete-account: auth user deletion failed:", authDeleteError);
      return NextResponse.json({ error: "auth_delete_failed", details: authDeleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("delete-account failed:", err);
    return NextResponse.json({ error: "unexpected_error", details: String(err) }, { status: 500 });
  }
}