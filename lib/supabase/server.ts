import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Supabase client for use in Server Components / Route Handlers, using the
 * anon key. Reads run under RLS, so this only sees publicly-readable rows
 * (Phase 1 cache tables, plus published user recipes from Phase 2 onward).
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component - safe to ignore because
            // middleware refreshes the session instead.
          }
        },
      },
    }
  );
}
