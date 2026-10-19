import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseConfigured, supabaseUrl, supabasePublishableKey } from "@/lib/supabase/config";

const protectedPath = (pathname: string) => pathname === "/dashboard" || pathname.startsWith("/dashboard/");

function signIn(request: NextRequest) {
  const url = new URL("/sign-in", request.url);
  url.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(url);
}

// Refreshes the Supabase session cookie on every request. Authorization still
// happens server-side in lib/auth.ts and the API; this is only the optimistic gate.
export async function proxy(request: NextRequest) {
  if (!supabaseConfigured) return protectedPath(request.nextUrl.pathname) ? signIn(request) : NextResponse.next();
  let response = NextResponse.next({ request });
  const supabase = createServerClient(supabaseUrl!, supabasePublishableKey!, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
      },
    },
  });
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims?.sub && protectedPath(request.nextUrl.pathname)) return signIn(request);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.svg|images/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)"],
};
