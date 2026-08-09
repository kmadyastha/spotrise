import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// This runs automatically when someone clicks the magic link in their
// email. Supabase sends them to /auth/callback?code=xxxx — we swap that
// code for a real logged-in session, then send them back into the app.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Something went wrong with the link (expired, already used, etc.)
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}