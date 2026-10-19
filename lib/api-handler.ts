import { sql, type SQL } from "../db/sql.ts";
import { z } from "zod";
import { publicWish, reservationSql, visibleState, occasions, categories } from "./domain.ts";
import type { Database } from "../db/contract.ts";

export interface PhotoStorage {
  put(id: string, bytes: Uint8Array<ArrayBuffer>, contentType: string): Promise<string>;
  get(pathname: string): Promise<ReadableStream<Uint8Array> | null>;
  delete(pathname: string): Promise<void>;
}
type Dependencies = {
  getDb(): Database;
  getUser(): Promise<{ userId: string; displayName: string } | null>;
  storage: PhotoStorage;
};
const celebrationInput = z.object({ title: z.string().trim().min(1).max(90), occasion: z.enum(occasions as [string,...string[]]), date: z.string().refine(s => s === "" || /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(Date.parse(s))), message: z.string().max(1000), currency: z.enum(["USD","EUR","GBP","EGP","AED"]), theme: z.enum(["peach","sage","lavender"]), visibility: z.enum(["unlisted","private"]) });
const externalUrl = z.string().max(2048).refine(s => { if (!s) return true; try { const u=new URL(s); return u.protocol==="https:" && !u.username && !u.password; } catch { return false; } }, "Use a complete https:// link.");
const wishInput = z.object({ title: z.string().trim().min(1).max(120), note: z.string().max(1000), kind: z.enum(["product","experience","custom"]), category: z.enum(categories as [string,...string[]]), price: z.number().int().min(0).max(100000000).nullable(), url: externalUrl, image: z.string().max(200).regex(/^(\/api\/images\/[a-f0-9-]+)?$/), priority: z.number().int().min(0).max(1), art: z.enum(["gift","coffee","camera","vase","book","headphones","trip"]) });
const response = (value: unknown, status = 200, extra: Record<string,string> = {}) =>
  Response.json(value, { status, headers: { "Cache-Control": "no-store", ...extra } });
const fail = (message: string, status = 400) => response({ error: message }, status);
async function hash(value: string) {
  return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value))))
    .map(v => v.toString(16).padStart(2, "0")).join("");
}
function cookie(req: Request) {
  return req.headers.get("cookie")?.match(/(?:^|;\s*)wn_guest=([a-f0-9-]{36})(?:;|$)/)?.[1] ?? null;
}
class BodyLimitError extends Error {}
async function bodyBytes(req: Request, limit: number) {
  if (Number(req.headers.get("content-length") || 0) > limit) throw new BodyLimitError();
  const chunks: Uint8Array[] = [];
  let size = 0;
  const reader = req.body?.getReader();
  if (reader) {
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.length;
        if (size > limit) { await reader.cancel(); throw new BodyLimitError(); }
        chunks.push(value);
      }
    } finally { reader.releaseLock(); }
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  return bytes;
}
async function json(req: Request) { return JSON.parse(new TextDecoder().decode(await bodyBytes(req, 12000))); }

// Dependency injection is used only by in-process tests. The Next route always
// supplies the real auth/database/storage adapters; no mock identity headers exist.
export function createApiHandler(deps: Dependencies) {
  async function handle(req: Request): Promise<Response> {
    const requestUrl = new URL(req.url);
    const [resource, id, action] = requestUrl.pathname.split("/").filter(Boolean).slice(1);
    if (req.method !== "GET" && req.headers.get("origin") !== requestUrl.origin)
      return fail("This request must come from Wishnest.", 403);
    const user = await deps.getUser();
    if (resource === "me" && req.method === "GET") return response({ user: user ? { name: user.displayName } : null });
    if (resource === "celebrations" && !user) return fail("Sign in to manage your celebrations.", 401);
    if (resource === "images" && req.method === "POST" && !user) return fail("Sign in to upload a photo.", 401);
    const db = deps.getDb();
    const rows = async (query: SQL) => (await db.execute(query)).rows;
    const first = async (query: SQL) => (await rows(query))[0];
    const guest = cookie(req);
    const guestHash = guest ? await hash(guest) : null;
    const photoOwned = async (url: string) => !url || !!(user && await first(sql`SELECT id FROM images WHERE id=${url.split("/").pop()} AND owner=${user.userId}`));

    if (resource === "celebrations" && user) {
      if (req.method === "GET" && !id) {
        const celebrations = await rows(sql`SELECT c.id,c.slug,c.title,c.occasion,c.date,c.message,c.currency,c.theme,c.visibility,COUNT(w.id)::integer AS count FROM celebrations c LEFT JOIN wishes w ON w.celebration_id=c.id WHERE c.owner=${user.userId} GROUP BY c.id ORDER BY c.created DESC`);
        return response({ celebrations });
      }
      if (req.method === "POST" && !id) {
        const c = celebrationInput.parse(await json(req));
        const cid = crypto.randomUUID(), slug = crypto.randomUUID();
        await db.execute(sql`INSERT INTO celebrations (id,owner,slug,title,occasion,date,message,currency,theme,visibility,created) VALUES (${cid},${user.userId},${slug},${c.title},${c.occasion},${c.date},${c.message},${c.currency},${c.theme},${c.visibility},${Date.now()})`);
        return response({ id: cid }, 201);
      }
      const c = await first(sql`SELECT * FROM celebrations WHERE id=${id} AND owner=${user.userId}`);
      if (!c) return fail("Celebration not found.", 404);
      if (req.method === "GET") {
        const wishes = await rows(sql`SELECT * FROM wishes WHERE celebration_id=${id} ORDER BY position,id`);
        const safe = { ...c }; delete safe.owner;
        return response({ celebration: safe, wishes: wishes.map(w => publicWish(normalize(w), null, true)), owner: true });
      }
      if (req.method === "PATCH") {
        const c = celebrationInput.parse(await json(req));
        await db.execute(sql`UPDATE celebrations SET title=${c.title},occasion=${c.occasion},date=${c.date},message=${c.message},currency=${c.currency},theme=${c.theme},visibility=${c.visibility} WHERE id=${id} AND owner=${user.userId}`);
        return response({ ok: true });
      }
      if (req.method === "POST" && action === "wishes") {
        const w = wishInput.parse(await json(req));
        if (!await photoOwned(w.image)) return fail("Photo not found.");
        const wid = crypto.randomUUID();
        await db.execute(sql`INSERT INTO wishes (id,celebration_id,title,note,kind,category,price,url,image,priority,art,position) VALUES (${wid},${id},${w.title},${w.note},${w.kind},${w.category},${w.price},${w.url},${w.image},${w.priority},${w.art},${Date.now()})`);
        return response({ id: wid }, 201);
      }
    }
    if (resource === "lists" && req.method === "GET") {
      const c = await first(sql`SELECT * FROM celebrations WHERE slug=${id}`);
      const owner = !!user && c?.owner === user.userId;
      if (!c || (c.visibility !== "unlisted" && !owner)) return fail("This celebration is private or unavailable.", 404);
      const wishes = await rows(sql`SELECT * FROM wishes WHERE celebration_id=${c.id} AND paused=0 ORDER BY position,id`);
      const safe = { ...c }; delete safe.owner;
      return response({ celebration: safe, wishes: wishes.map(w => publicWish(normalize(w), guestHash, owner)), owner });
    }
    if (resource === "wishes" && id) {
      const raw = await first(sql`SELECT w.*,c.owner,c.visibility FROM wishes w JOIN celebrations c ON c.id=w.celebration_id WHERE w.id=${id}`);
      if (!raw) return fail("Wish not found.", 404);
      const w = normalize(raw);
      const owner = !!user && w.owner === user.userId;
      if (req.method === "PATCH" && !action) {
        if (!owner) return fail("Only the list owner can edit wishes.", 403);
        if (visibleState(String(w.state), w.expires as number | null) !== "available")
          return fail("This gift is being handled. Its details are locked to protect the giver’s choice.", 409);
        const input = wishInput.parse(await json(req));
        if (!await photoOwned(input.image)) return fail("Photo not found.");
        const changed = await rows(sql`UPDATE wishes SET title=${input.title},note=${input.note},kind=${input.kind},category=${input.category},price=${input.price},url=${input.url},image=${input.image},priority=${input.priority},art=${input.art} WHERE id=${id} AND (state='available' OR (state='reserved' AND expires<=${Date.now()})) RETURNING id`);
        return changed.length ? response({ ok: true }) : fail("A guest just reserved this gift. Refresh to see its status.", 409);
      }
      if (req.method !== "POST") return fail("Method not supported.", 405);
      if (["pause", "resume", "received", "reopen"].includes(action)) {
        if (!owner) return fail("Only the list owner can do this.", 403);
        if (action === "pause" || action === "resume") {
          const changed = await rows(sql`UPDATE wishes SET paused=${action === "pause" ? 1 : 0} WHERE id=${id} AND (state='available' OR (state='reserved' AND expires<=${Date.now()})) RETURNING id`);
          return changed.length ? response({ ok: true }) : fail("You can pause a wish once its reservation is released.", 409);
        }
        if (action === "reopen") {
          const c = await first(sql`SELECT date FROM celebrations WHERE id=${w.celebration_id}`);
          if (!c?.date || Date.parse(c.date + "T23:59:59Z") > Date.now()) return fail("Reopen missing gifts after the celebration date.", 409);
        }
        await db.execute(sql`UPDATE wishes SET state=${action === "received" ? "received" : "available"},token=NULL,expires=NULL,extended=0 WHERE id=${id}`);
        return response({ ok: true });
      }
      if (w.visibility !== "unlisted" || w.paused) return fail("This gift is unavailable.", 404);
      if (owner) return fail("Owners cannot reserve their own gifts. Use the sample list to try the guest experience.", 403);
      if (action === "reserve") {
        const token = guest || crypto.randomUUID(), tokenHash = guestHash || await hash(token);
        const now = Date.now(), expires = now + 86400000;
        // This ordered batch runs in one transaction. The lock MUST
        // be a separate statement: the conditional UPDATE then receives a fresh
        // read-committed snapshot after any same-guest transaction finishes.
        const [, changed, count] = await db.batch([
          sql`SELECT pg_advisory_xact_lock(hashtextextended(${tokenHash}, 0))`,
          reservationSql.reserve(tokenHash, expires, id, now),
          sql`SELECT COUNT(*)::integer AS n FROM wishes WHERE token=${tokenHash} AND state='reserved' AND expires>${now}`,
        ]);
        const result = changed.rows.length ? 200 : Number(count.rows[0].n) >= 10 ? 429 : 409;
        if (result === 429) return fail("Please finish or release an existing reservation first.", 429);
        if (result === 409) return fail("Someone else has reserved this gift. Please choose another.", 409);
        const secure = process.env.VERCEL || process.env.NODE_ENV === "production" || requestUrl.protocol === "https:";
        return response({ ok: true, expires }, 200, { "Set-Cookie": `wn_guest=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=7776000${secure ? "; Secure" : ""}` });
      }
      if (!guestHash) return fail("Open this reservation in the browser where you made it.", 403);
      if (action === "extend" || action === "purchase" || action === "release") {
        const query = action === "release" ? reservationSql.release(id, guestHash) : reservationSql[action](id, guestHash, Date.now());
        return (await rows(query)).length ? response({ ok: true }) : fail("This reservation expired, was changed, or cannot be extended again. Refresh the list.", 409);
      }
    }
    if (resource === "images") {
      if (req.method === "POST" && user) {
        const bytes = await bodyBytes(req, 2000000);
        const jpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
        const png = [137,80,78,71,13,10,26,10].every((v,i) => bytes[i] === v);
        const webp = new TextDecoder().decode(bytes.slice(0,4)) === "RIFF" && new TextDecoder().decode(bytes.slice(8,12)) === "WEBP";
        if (!jpeg && !png && !webp) return fail("Use a JPG, PNG, or WebP photo.");
        const key = crypto.randomUUID(), contentType = jpeg ? "image/jpeg" : png ? "image/png" : "image/webp";
        const pathname = await deps.storage.put(key, bytes, contentType);
        try {
          await db.execute(sql`INSERT INTO images (id,owner,blob_pathname,content_type,created) VALUES (${key},${user.userId},${pathname},${contentType},${Date.now()})`);
        } catch (error) {
          // Do not leave a stored photo without its ownership record.
          await deps.storage.delete(pathname).catch(() => {});
          throw error;
        }
        return response({ url: `/api/images/${key}` }, 201);
      }
      if (req.method === "GET" && /^[a-f0-9-]{36}$/.test(id || "")) {
        const asset = await first(sql`SELECT * FROM images WHERE id=${id}`);
        if (!asset) return fail("Photo not found.", 404);
        if (asset.owner !== user?.userId) {
          const linked = await first(sql`SELECT w.id FROM wishes w JOIN celebrations c ON c.id=w.celebration_id WHERE w.image=${"/api/images/" + id} AND c.visibility='unlisted' LIMIT 1`);
          if (!linked) return fail("Photo not found.", 404);
        }
        // Check authorization BEFORE retrieving bytes; never redirect to a blob URL.
        const stream = await deps.storage.get(String(asset.blob_pathname));
        if (!stream) return fail("Photo not found.", 404);
        return new Response(stream, { headers: { "Content-Type": String(asset.content_type), "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
      }
    }
    return fail("Not found.", 404);
  }
  return async (req: Request) => {
    try { return await handle(req); }
    catch (error) {
      if (error instanceof BodyLimitError) return fail("Request is too large.", 413);
      if (error instanceof z.ZodError) return fail(error.issues[0]?.message || "Check the fields and try again.");
      if (error instanceof SyntaxError) return fail("Invalid request.");
      // Do not log tokens, database connection URLs, or query parameters.
      console.error("Wishnest request failed");
      return fail("We couldn’t save that change. Please try again.", 500);
    }
  };
}
function normalize(w: Record<string, unknown>): Record<string, unknown> {
  // Raw Postgres queries return bigint as strings. Keep publicWish unchanged.
  return { ...w, expires: w.expires === null ? null : Number(w.expires) };
}
