// Public values only. They are inlined into the browser bundle at build time.
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
export const supabaseConfigured = !!(supabaseUrl && supabasePublishableKey);

/** Only same-site relative paths; blocks `//evil.com`, `/\evil.com` and auth loops. */
export function safeNext(value: string | null | undefined, fallback = "/dashboard") {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  try {
    const url = new URL(value, "https://wishnest.invalid");
    if (url.origin !== "https://wishnest.invalid" || url.pathname.startsWith("/auth/")) return fallback;
    return url.pathname + url.search + url.hash;
  } catch {
    return fallback;
  }
}
