import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Always returns a valid site URL.
 * Priority:
 * 1) NEXT_PUBLIC_SITE_URL (recommended, explicit)
 * 2) VERCEL_URL (auto by Vercel)
 * 3) localhost fallback
 */
function getSiteUrl() {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (explicit) return explicit;

  const vercel = process.env.VERCEL_URL?.replace(/\/$/, "");
  if (vercel) return vercel.startsWith("http") ? vercel : `https://${vercel}`;

  return "http://localhost:3000";
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const full_name = String(body?.full_name || "").trim();
    const phone = String(body?.phone || "").trim();
    const email = String(body?.email || "").trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_URL || !SERVICE_ROLE) {
      return NextResponse.json(
        { error: "Server misconfiguration: Supabase env vars missing." },
        { status: 500 }
      );
    }

    const siteUrl = getSiteUrl();

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { persistSession: false },
    });

    /**
     * Invite → auth/callback → auth/exchange → set-password → select
     */
    const redirectTo =
      `${siteUrl}/auth/callback?next=` +
      encodeURIComponent("/set-password?next=/select");

    // 1️⃣ Try invite
    const { data: invited, error: inviteError } =
      await admin.auth.admin.inviteUserByEmail(email, {
        redirectTo,
      });

    // 2️⃣ If user already exists → send reset link
    if (inviteError) {
      const msg = inviteError.message.toLowerCase();
      if (msg.includes("already") || msg.includes("registered")) {
        const { error: resetError } =
          await admin.auth.resetPasswordForEmail(email, {
            redirectTo,
          });

        if (resetError) {
          return NextResponse.json(
            { error: resetError.message },
            { status: 500 }
          );
        }

        return NextResponse.json({
          ok: true,
          mode: "reset",
          message: "Account exists. Password reset link sent.",
        });
      }

      return NextResponse.json(
        { error: inviteError.message },
        { status: 500 }
      );
    }

    const user_id = invited?.user?.id;
    if (!user_id) {
      return NextResponse.json(
        { error: "Invite succeeded but user_id missing." },
        { status: 500 }
      );
    }

    // 3️⃣ Upsert profile
    const { error: profileError } = await admin
      .from("profiles")
      .upsert(
        { user_id, full_name, phone, email },
        { onConflict: "email" }
      );

    if (profileError) {
      return NextResponse.json(
        { error: profileError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      mode: "invite",
      message: "Invite email sent.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Server error" },
      { status: 500 }
    );
  }
}