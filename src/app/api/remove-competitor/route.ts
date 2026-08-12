import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "not_authenticated" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const competitorId = searchParams.get("id");
    if (!competitorId) return NextResponse.json({ error: "missing_id" }, { status: 400 });

    // Confirm this competitor belongs to a business owned by this user.
    const { data: competitor } = await supabase
      .from("competitors")
      .select("id, business_id, businesses!inner(user_id)")
      .eq("id", competitorId)
      .single();

    if (!competitor || (competitor as any).businesses.user_id !== user.id) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const { error } = await supabase.from("competitors").delete().eq("id", competitorId);
    if (error) return NextResponse.json({ error: "db_error", details: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("delete-competitor failed:", err);
    return NextResponse.json({ error: "unexpected_error", details: String(err) }, { status: 500 });
  }
}