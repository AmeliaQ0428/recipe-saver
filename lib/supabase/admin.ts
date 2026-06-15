import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client. Bypasses RLS - only ever used server-side
 * inside the cron cache-refresh route, never exposed to the client bundle.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
