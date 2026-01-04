"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
export default function ExchangeClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const [msg, setMsg] = useState("Exchanging link…");

  useEffect(() => {
    const run = async () => {
      const supabase = supabaseBrowser();
      if (!supabase) {
        setMsg("Missing Supabase env vars. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel.\");
        return;
      }

      const code = sp.get("code");
      const next = sp.get("next") || "/select";

      if (!code) {
        router.replace(`/login?next=${encodeURIComponent(next)}`);
        return;
      }

      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        setMsg("Link expired. Please login again.");
        router.replace(`/login?next=${encodeURIComponent(next)}`);
        return;
      }

      // ✅ Now session exists in browser -> go next
      router.replace(next);
    };

    run();
  }, [sp, router]);

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      {msg}
    </div>
  );
}