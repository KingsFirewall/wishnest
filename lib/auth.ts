import "server-only";
import { supabaseConfigured } from "./supabase/config";
import { createSupabaseServerClient } from "./supabase/server";

export async function getUser(): Promise<{ userId: string; displayName: string } | null> {
  // Missing configuration must never create an authenticated identity.
  if (!supabaseConfigured) return null;
  const supabase = await createSupabaseServerClient();
  // getClaims verifies the session JWT signature; never trust getSession() on the server.
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (error || !claims?.sub) return null;
  const meta = (claims.user_metadata ?? {}) as Record<string, unknown>;
  const name = typeof meta.full_name === "string" ? meta.full_name : typeof meta.name === "string" ? meta.name : null;
  return { userId: claims.sub, displayName: name || (typeof claims.email === "string" ? claims.email : "Wishnest member") };
}
