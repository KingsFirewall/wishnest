import type { Wish } from "./domain";
export type GiftMood = "anything" | "everyday" | "experience" | "creative";
export function findGifts(wishes: Wish[], budget: number | null, mood: GiftMood, now = Date.now()) {
  return wishes.filter(w => {
    const available = w.state === "available" || (w.state === "reserved" && w.expires !== null && w.expires <= now);
    if (w.paused || !available) return false;
    // Unknown prices cannot honestly be promised to fit a budget.
    if (budget !== null && (w.price === null || w.price > budget)) return false;
    return mood === "anything" || (mood === "experience" ? w.kind === "experience" : mood === "creative" ? ["Books", "Technology"].includes(w.category) : w.kind !== "experience" && ["Home & living", "Style", "Other"].includes(w.category));
  }).sort((a, b) => b.priority - a.priority || (a.price ?? Infinity) - (b.price ?? Infinity));
}
// Owner insights deliberately ignore reservation and purchase states.
export function wishlistBalance(wishes: Wish[], affordableLimit: number) {
  const included = wishes.filter(w => !w.paused);
  const counts = [0, 0, 0];
  let unpriced = 0;
  for (const w of included) {
    if (w.price === null) unpriced++;
    else counts[w.price <= affordableLimit ? 0 : w.price <= affordableLimit * 3 ? 1 : 2]++;
  }
  return { counts, unpriced, total: included.length, experiences: included.filter(w => w.kind === "experience").length };
}
export function suggestedBudget(currency: string) {
  return ({ EGP: 150000, AED: 20000, GBP: 4000, EUR: 5000 } as Record<string, number>)[currency] ?? 5000;
}
