import "server-only";
import { auth, currentUser } from "@clerk/nextjs/server";

export async function getUser(): Promise<{ userId: string; displayName: string } | null> {
  // Missing configuration must never create an authenticated identity.
  if (!process.env.CLERK_SECRET_KEY || !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) return null;
  const session = await auth();
  if (!session.userId) return null;
  const user = await currentUser();
  if (!user) return null;
  return { userId: session.userId, displayName: user.fullName || user.primaryEmailAddress?.emailAddress || "Wishnest member" };
}
