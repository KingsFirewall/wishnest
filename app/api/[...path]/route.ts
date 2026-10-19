import { getDb } from "@/db";
import { getUser } from "@/lib/auth";
import { photoStorage } from "@/lib/photo-storage";
import { createApiHandler } from "@/lib/api-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const route = createApiHandler({ getDb, getUser, storage: photoStorage });
export { route as GET, route as POST, route as PATCH, route as PUT, route as DELETE, route as OPTIONS };
