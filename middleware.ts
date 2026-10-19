import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest, type NextFetchEvent } from "next/server";

const protectedRoute = createRouteMatcher(["/dashboard(.*)"]);
const clerk = clerkMiddleware(async (auth, request) => {
  if (protectedRoute(request)) await auth.protect();
});
export default function middleware(request: NextRequest, event: NextFetchEvent) {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || !process.env.CLERK_SECRET_KEY) {
    // Public previews can render before setup; owners still cannot enter.
    if (protectedRoute(request)) return NextResponse.redirect(new URL("/sign-in", request.url));
    return NextResponse.next();
  }
  return clerk(request, event);
}
export const config = { matcher: ["/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)", "/(api|trpc)(.*)"] };
