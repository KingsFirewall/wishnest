"use client";
import { useState } from "react";
import { ArrowRight, SlidersHorizontal, Check, PieChart } from "lucide-react";
import { money, type Wish } from "@/lib/domain";
import { findGifts, wishlistBalance, suggestedBudget, type GiftMood } from "@/lib/gift-finder";
import { WishArt } from "./wish-art";

export function GiftFinder({ wishes, currency, onChoose, now, compact = false }: { wishes: Wish[]; currency: string; onChoose: (w: Wish) => void; now?: number; compact?: boolean }) {
  const base = suggestedBudget(currency);
  const [budget, setBudget] = useState<number | null>(base * 2);
  const [mood, setMood] = useState<GiftMood>("anything");
  const matches = findGifts(wishes, budget, mood, now);
  return <section className={`gift-finder ${compact ? "finder-compact" : ""}`} aria-label="Gift finder">
    <div className="finder-controls"><span className="eyebrow"><SlidersHorizontal size={14}/> THE GIFT FINDER</span><h2>Find your <br/>“that’s the one.”</h2><p>A budget. A vibe. A few good choices.</p>
      <fieldset><legend>Your comfort zone</legend><div className="choice-row">{[base, base * 2, null].map(b => <button key={b ?? "any"} aria-pressed={budget === b} onClick={() => setBudget(b)}>{b === null ? "Any budget" : `Up to ${money(b, currency)}`}</button>)}</div></fieldset>
      <label className="finder-label">What feels right?<select value={mood} onChange={e => setMood(e.target.value as GiftMood)}><option value="anything">A bit of everything</option><option value="everyday">Everyday upgrades</option><option value="experience">An experience together</option><option value="creative">Books & technology</option></select></label><span className="finder-footnote">From this wishlist only. No sponsored picks.</span>
    </div>
    <div className="finder-results" aria-live="polite"><div className="finder-results-head"><strong>{matches.length ? `${matches.length} ${matches.length === 1 ? "match" : "matches"} for you` : "Let’s widen the search"}</strong>{matches.length > 0 && <span>Available now</span>}</div>
      {matches.length ? matches.slice(0, compact ? 2 : 3).map(w => <button className="finder-result" key={w.id} onClick={() => onChoose(w)}><WishArt wish={w}/><span className="finder-result-copy"><strong>{w.title}</strong><small>{w.priority ? "High on their wishlist" : w.kind === "experience" ? "Make a memory" : "On their wishlist"}</small><b>{money(w.price, currency)}</b></span><ArrowRight size={19}/></button>) : <div className="finder-empty"><p>No available wishes match both choices. Try a different vibe or a wider budget.</p><button className="button dark" onClick={() => { setBudget(null); setMood("anything"); }}>Reset finder</button></div>}
      {matches.length > (compact ? 2 : 3) && <span className="finder-footnote">Showing {compact ? 2 : 3} of {matches.length}. Browse the full list below.</span>}
    </div>
  </section>;
}
export function ListBalance({ wishes, currency, onAdd }: { wishes: Wish[]; currency: string; onAdd?: () => void }) {
  const [limit, setLimit] = useState(suggestedBudget(currency));
  const stats = wishlistBalance(wishes, limit);
  const labels = [`Up to ${money(limit, currency)}`, `Over ${money(limit, currency)} to ${money(limit * 3, currency)}`, `Above ${money(limit * 3, currency)}`];
  return <section className="list-balance" aria-label="Wishlist balance"><div className="balance-title"><span className="eyebrow"><PieChart size={15}/> WISHLIST BALANCE</span><h3>Make room for every budget.</h3><p>Thoughtfulness doesn’t have a price tag. See how your list stacks up.</p><label>Affordable gift target<select aria-label="Affordable gift target" value={limit} onChange={e => setLimit(Number(e.target.value))}>{[.5, 1, 2, 5].map(n => <option key={n} value={suggestedBudget(currency) * n}>{money(suggestedBudget(currency) * n, currency)}</option>)}</select></label></div><div className="balance-data">{stats.counts.map((n, i) => <div className="balance-row" key={i}><span>{labels[i]}</span><div className="balance-track"><i style={{ width: `${stats.total ? n / stats.total * 100 : 0}%` }}/></div><b>{n}</b></div>)}<p className="balance-advice"><Check size={16}/>{stats.counts[0] === 0 ? "Add an affordable wish so more guests can join in." : stats.experiences === 0 ? "You have affordable options. An experience could add variety." : "You have affordable wishes and experiences to choose from."}</p>{stats.unpriced > 0 && <p className="fine-print">{stats.unpriced} {stats.unpriced === 1 ? "wish needs a price" : "wishes need prices"} to be included in the budget bands.</p>}<span className="finder-footnote">Based on visible wishes, never your guests’ activity.</span>{onAdd && <button className="text-link" onClick={onAdd}>Add another idea <ArrowRight size={15}/></button>}</div></section>;
}
