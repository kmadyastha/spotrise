import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "invalid_email" }, { status: 400 });
    }

    // Uses the admin client rather than the regular anon-key client —
    // this table has RLS enabled with no policies (correct: nobody
    // should be able to read or write it directly from the browser,
    // since it just stores email addresses), so only trusted
    // server-side code like this route can touch it at all.
    const admin = createAdminClient();
    // Upsert so re-submitting the same email (e.g. a double click) isn't
    // an error — the unique index on email already prevents duplicates.
    const { error } = await admin
      .from("international_waitlist")
      .upsert({ email: email.trim().toLowerCase() }, { onConflict: "email", ignoreDuplicates: true });

    if (error) {
      console.error("international-waitlist insert failed:", error);
      return NextResponse.json({ error: "db_error", details: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("international-waitlist failed:", err);
    return NextResponse.json({ error: "unexpected_error", details: String(err) }, { status: 500 });
  }
}