import { createClient } from "@supabase/supabase-js";

/**
 * Supabase client factory (browser).
 * Avoid importing a pre-created client at module scope because Next.js can
 * evaluate modules during build/prerender.
 */
export function supabaseClient() {
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
