export type Celebration = { id: string; slug: string; title: string; occasion: string; date: string; message: string; currency: string; theme: string; visibility: string; count?: number };
export type Wish = { id: string; title: string; note: string; kind: string; category: string; price: number | null; url: string; image: string; priority: number; art: string; paused: number; state: string; mine: boolean; expires: number | null; extended: number };
export const occasions = ["Birthday", "Wedding", "Graduation", "Anniversary", "Housewarming", "Baby celebration", "Holiday", "Something else"];
export const categories = ["Home & living", "Style", "Books", "Technology", "Experiences", "Other"];
export function money(value: number | null, currency = "USD") { return value === null ? "Any budget" : new Intl.NumberFormat("en", { style: "currency", currency, maximumFractionDigits: 0 }).format(value / 100); }
export function visibleState(state: string, expires: number | null, now = Date.now()) { return state === "reserved" && expires !== null && expires <= now ? "available" : state; }
export function publicWish(w: Record<string, unknown>, token: string | null, owner: boolean, now = Date.now()): Wish {
  const raw = visibleState(String(w.state), w.expires as number | null, now);
  const mine = !owner && !!token && token === w.token && raw !== "available";
  return { id: String(w.id), title: String(w.title), note: String(w.note), kind: String(w.kind), category: String(w.category), price: w.price as number | null, url: String(w.url), image: String(w.image), priority: Number(w.priority), art: String(w.art), paused: Number(w.paused), state: owner && ["reserved", "purchased"].includes(raw) ? "handled" : raw, mine, expires: mine ? w.expires as number | null : null, extended: mine ? Number(w.extended) : 0 };
}
export const reservationSql = {
  reserve: "UPDATE wishes SET state='reserved',token=?,expires=?,extended=0 WHERE id=? AND paused=0 AND (state='available' OR (state='reserved' AND expires<=?))",
  extend: "UPDATE wishes SET expires=expires+86400000,extended=1 WHERE id=? AND token=? AND state='reserved' AND expires>? AND extended=0",
  purchase: "UPDATE wishes SET state='purchased',expires=NULL WHERE id=? AND token=? AND state='reserved' AND expires>?",
  release: "UPDATE wishes SET state='available',token=NULL,expires=NULL,extended=0 WHERE id=? AND token=? AND state IN ('reserved','purchased')",
};
