import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/supabase/config";

// POST only, same-origin only, so other sites cannot sign visitors out.
export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin) return new NextResponse("Forbidden", { status: 403 });
  if (supabaseConfigured) await (await createSupabaseServerClient()).auth.signOut();
  return NextResponse.redirect(new URL("/", request.url), 303);
}
