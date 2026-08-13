// This client uses the SERVICE ROLE key and bypasses RLS entirely.
// Only ever use it server-side, for actions that genuinely need admin
// privileges — like deleting an auth user, which the regular
// server client (anon key + user's own session) cannot do.
// Requires SUPABASE_SERVICE_ROLE_KEY to be set in your environment
// (Supabase dashboard → Project Settings → API → service_role key).
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}