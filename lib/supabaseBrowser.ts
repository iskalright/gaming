import { createClient } from "@supabase/supabase-js";

/**
 * Browser-only Supabase client factory.
 * Call this INSIDE a click handler / useEffect.
 *
 * Why: Creating a client at module scope in a "use client" file can still
 * be evaluated during Next.js prerender/build, which crashes if env vars
 * aren’t injected at build time.
 */
export function supabaseBrowser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }

  return createClient(url, anon, {
    auth: { persistSession: true, autoRefreshToken: true },
  });
}
