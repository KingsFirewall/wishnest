import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseConfigured, safeNext } from "@/lib/supabase/config";

const otpTypes = new Set(["magiclink", "signup", "email", "invite", "recovery", "email_change"]);

// Completes the emailed sign-in link (PKCE `code`, or `token_hash` templates).
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const next = safeNext(params.get("next"));
  const fail = NextResponse.redirect(new URL(`/sign-in?error=link&next=${encodeURIComponent(next)}`, request.url));
  if (!supabaseConfigured) return fail;
  const supabase = await createSupabaseServerClient();
  const code = params.get("code");
  const tokenHash = params.get("token_hash");
  const type = params.get("type");
  const { error } = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : tokenHash && type && otpTypes.has(type)
      ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type: type as EmailOtpType })
      : { error: new Error("missing token") };
  return error ? fail : NextResponse.redirect(new URL(next, request.url));
}
