import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function DELETE() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "not_authenticated" }, { status: 401 });

    // TODO once Stripe billing is live: if this user has an active Pro
    // subscription, cancel it with Stripe FIRST, before deleting any
    // data below — otherwise they'd keep being billed for an account
    // that no longer exists. Not needed yet since "Upgrade to Pro" is
    // still a client-side-only toggle, not a real subscription.

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