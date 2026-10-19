"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, CalendarDays, Check, Clock3, Copy, ExternalLink, Gift, Heart, ImagePlus, LayoutGrid, Link2, LockKeyhole, Plus, Search, Settings2, ShieldCheck, Sparkles, X, Eye, Pause, RotateCcw } from "lucide-react";
import { Header, Footer } from "./chrome";
import { WishArt } from "./wish-art";
import { GiftFinder, ListBalance } from "./gift-tools";
import { categories, occasions, money, visibleState, type Celebration, type Wish } from "@/lib/domain";
import { sampleCelebration, sampleWishes } from "@/lib/sample";
type Mode = "owner" | "guest" | "demo";
type Modal = {
    kind: "celebration";
    edit?: boolean;
} | {
    kind: "wish";
    wish?: Wish;
} | {
    kind: "detail";
    id: string;
} | {
    kind: "share";
} | null;
type ApiPayload = {
    error?: string;
    celebrations: Celebration[];
    celebration: Celebration;
    wishes: Wish[];
    owner: boolean;
    id: string;
};
async function api(path: string, body?: unknown, method = "POST") { const r = await fetch(`/api/${path}`, body === undefined ? { cache: "no-store" } : { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); const data = await r.json() as ApiPayload; if (!r.ok)
    throw new Error(data.error || "Something went wrong. Please try again."); return data; }
function dateLabel(date: string) { return date ? new Intl.DateTimeFormat("en", { month: "long", day: "numeric", year: "numeric" }).format(new Date(date + "T12:00:00")) : "A date to look forward to"; }
function Dialog({ title, onClose, children, wide = false }: {
    title: string;
    onClose: () => void;
    children: ReactNode;
    wide?: boolean;
}) {
    const ref = useRef<HTMLDialogElement>(null);
    useEffect(() => { const el = ref.current; const previous = document.activeElement as HTMLElement; el?.showModal(); const before = document.body.style.overflow; document.body.style.overflow = "hidden"; return () => { el?.close(); document.body.style.overflow = before; previous?.focus(); }; }, []);
    return <dialog ref={ref} className={`dialog ${wide ? "wide" : ""}`} aria-label={title} onCancel={e => { e.preventDefault(); onClose(); }} onClick={e => { if (e.target === ref.current)
        onClose(); }}><div className="dialog-inner"><button className="icon-button close" onClick={onClose} aria-label="Close dialog"><X size={20}/></button>{children}</div></dialog>;
}
function Badge({ wish, owner = false }: {
    wish: Wish;
    owner?: boolean;
}) { const state = visibleState(wish.state, wish.expires); return <span className={`badge ${state === "available" ? "green" : "warm"}`}>{wish.paused ? <><Pause size={12}/> Hidden</> : state === "available" ? "Available" : state === "received" ? <><Check size={12}/> Received</> : wish.mine ? <><Clock3 size={12}/>{state === "reserved" ? "Reserved by you" : "You marked purchased"}</> : owner ? "Being taken care of" : <><Heart size={12}/> Gift in progress</>}</span>; }
export function WishnestApp({ mode, slug }: {
    mode: Mode;
    slug?: string;
}) {
    const [lists, setLists] = useState<Celebration[]>([]);
    const [celebration, setCelebration] = useState<Celebration | null>(mode === "demo" ? sampleCelebration : null);
    const [wishes, setWishes] = useState<Wish[]>(mode === "demo" ? sampleWishes : []);
    const [loading, setLoading] = useState(mode !== "demo");
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);
    const [modal, setModal] = useState<Modal>(null);
    const [toast, setToast] = useState("");
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [available, setAvailable] = useState(false);
    const [category, setCategory] = useState("All wishes");
    const [budget, setBudget] = useState("");
    const [search, setSearch] = useState("");
    const [sort, setSort] = useState("recommended");
    const [isOwner, setIsOwner] = useState(mode === "owner");
    const [now, setNow] = useState(() => Date.now());
    // Synchronize the sample dialog with the browser URL only after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    useEffect(() => { if (mode === "demo") { const id = new URLSearchParams(window.location.search).get("wish"); if (id && sampleWishes.some(w => w.id === id)) setModal({ kind: "detail", id }); } }, [mode]);
    const owner = mode === "owner";
    const notify = useCallback((message: string) => { setToast(message); if (timer.current)
        clearTimeout(timer.current); timer.current = setTimeout(() => setToast(""), 4500); }, []);
    const loadLists = useCallback(async () => { const d = await api("celebrations"); setLists(d.celebrations); return d.celebrations as Celebration[]; }, []);
    const loadCelebration = useCallback(async (id: string) => { const d = await api(owner ? `celebrations/${id}` : `lists/${id}`); setCelebration(d.celebration); setWishes(d.wishes); setIsOwner(d.owner); }, [owner]);
    useEffect(() => { if (mode === "demo")
        return; let cancelled = false; (async () => { try {
        if (owner) {
            await loadLists();
        }
        else if (slug) {
            await loadCelebration(slug);
        }
    }
    catch (e) {
        if (!cancelled)
            setError((e as Error).message);
    }
    finally {
        if (!cancelled)
            setLoading(false);
    } })(); return () => { cancelled = true; }; }, [mode, owner, slug, loadLists, loadCelebration]);
    useEffect(() => { const t = setInterval(() => setNow(Date.now()), 15000); return () => { clearInterval(t); if (timer.current)
        clearTimeout(timer.current); }; }, []);
    const selectedId = celebration?.id;
    const selectedSlug = celebration?.slug;
    useEffect(() => { if (mode === "demo" || !selectedId || !selectedSlug)
        return; const id = owner ? selectedId : selectedSlug; const update = () => { if (document.visibilityState === "visible")
        loadCelebration(id).catch(() => { }); }; const t = setInterval(update, 30000); window.addEventListener("focus", update); return () => { clearInterval(t); window.removeEventListener("focus", update); }; }, [mode, owner, selectedId, selectedSlug, loadCelebration]);
    async function openList(id: string) { setLoading(true); setError(""); try {
        await loadCelebration(id);
    }
    catch (e) {
        setError((e as Error).message);
    }
    finally {
        setLoading(false);
    } }
    async function refresh() { if (mode !== "demo" && celebration) {
        await loadCelebration(owner ? celebration.id : celebration.slug);
        if (owner)
            await loadLists();
    } }
    async function action(w: Wish, verb: string) { setBusy(true); setError(""); try {
        if (mode === "demo") {
            setWishes(current => current.map(item => item.id !== w.id ? item : { ...item, state: verb === "reserve" ? "reserved" : verb === "purchase" ? "purchased" : verb === "release" ? "available" : item.state, mine: verb !== "release", expires: verb === "reserve" ? Date.now() + 86400000 : verb === "extend" ? (item.expires || Date.now()) + 86400000 : verb === "release" || verb === "purchase" ? null : item.expires, extended: verb === "extend" ? 1 : item.extended }));
        }
        else {
            await api(`wishes/${w.id}/${verb}`, {});
            await refresh();
        }
        notify(verb === "reserve" ? "Reserved for 24 hours. The surprise is safe." : verb === "purchase" ? "Marked as purchased. This is your confirmation, not a verified purchase." : verb === "release" ? "Released — another guest can choose this gift." : "Saved.");
    }
    catch (e) {
        setError((e as Error).message);
        await refresh().catch(() => { });
    }
    finally {
        setBusy(false);
    } }
    async function copyLink() { try {
        await navigator.clipboard.writeText(`${window.location.origin}/w/${celebration?.slug}`);
        notify("Celebration link copied.");
    }
    catch {
        notify("Select and copy the link below.");
    } }
    const currentWish = modal?.kind === "detail" ? wishes.find(w => w.id === modal.id) : undefined;
    const display = wishes.filter(w => (!available || visibleState(w.state, w.expires, now) === "available") && (category === "All wishes" || w.category === category) && (!budget || (w.price !== null && w.price <= Number(budget) * 100)) && (!search || (w.title + " " + w.note).toLowerCase().includes(search.toLowerCase()))).sort((a, b) => sort === "low" ? (a.price ?? Infinity) - (b.price ?? Infinity) : sort === "high" ? (b.price ?? -1) - (a.price ?? -1) : Number(visibleState(b.state, b.expires, now) === "available") - Number(visibleState(a.state, a.expires, now) === "available") || b.priority - a.priority);
    return <><Header /><main id="main-content" className={owner ? "app-shell" : "guest-shell"}>
 {owner && <aside className="sidebar"><span className="eyebrow">YOUR WISHNEST</span><button className={!celebration ? "side-link selected" : "side-link"} onClick={() => { setCelebration(null); setError(""); }}><LayoutGrid size={18}/> My celebrations</button><div className="sidebar-heading">Your lists <button aria-label="New celebration" className="icon-button" onClick={() => setModal({ kind: "celebration" })}><Plus size={17}/></button></div>{lists.map(c => <button className={`side-list ${celebration?.id === c.id ? "active" : ""}`} key={c.id} onClick={() => openList(c.id)}><span className={`mini-avatar ${c.theme}`}>{c.title[0]}</span><span>{c.title}<small>{c.occasion}</small></span></button>)}<div className="sidebar-note"><ShieldCheck size={22}/><h3>Let it be a surprise.</h3><p>Who’s giving what stays between us and your guests.</p></div></aside>}
 <div className={owner ? "workspace" : ""}>
 {error && <div role="alert" className="error-banner">{error}<button onClick={() => setError("")} aria-label="Dismiss error"><X size={17}/></button></div>}
 {loading ? <div className="loading" role="status"><span className="loading-dot"/>Gathering the good things…</div> : !celebration && owner ? <><div className="workspace-head"><div><span className="eyebrow">YOUR NEXT BIG THING STARTS HERE</span><h1>Your celebrations</h1><p>All your milestones. One place for the good stuff.</p></div><button className="button primary" onClick={() => setModal({ kind: "celebration" })}><Plus size={18}/> New celebration</button></div>{lists.length ? <div className="celebration-grid">{lists.map(c => <button key={c.id} className={`celebration-card ${c.theme}`} onClick={() => openList(c.id)}><span className="occasion-symbol">{c.occasion === "Wedding" ? "♡" : c.occasion === "Birthday" ? "✳" : "✦"}</span><span className="micro">{c.occasion}</span><h2>{c.title}</h2><p><CalendarDays size={14}/>{dateLabel(c.date)}</p><div><span>{c.count || 0} wishes</span><ArrowRight size={20}/></div></button>)}</div> : <div className="empty-state"><span className="empty-gift"><Gift size={42} strokeWidth={1.3}/></span><h2>Something to look forward to.</h2><p>A birthday, a new beginning, or just because.<br />Your first Wishnest starts right here.</p><button className="button primary" onClick={() => setModal({ kind: "celebration" })}>Create a celebration <ArrowRight size={17}/></button><a href="/demo" className="text-link">Explore a sample first</a></div>}<div className="build-note"><Sparkles size={17}/><span>Early access · Lists, photos, and gift reservations are ready to try. Group payments and purchase verification are coming later.</span></div></> : celebration ? <>
 {mode === "demo" && <div className="demo-banner"><Sparkles size={15}/><span>You’re exploring a sample. Try reserving a wish — no real gifts or payments are involved.</span><a href="/dashboard">Make your own <ArrowRight size={14}/></a></div>}
 {owner ? <div className="workspace-head list-heading"><div><button className="back-link" onClick={() => setCelebration(null)}><ArrowLeft size={14}/> All celebrations</button><span className="eyebrow">{celebration.occasion} · {celebration.visibility === "private" ? "PRIVATE" : "UNLISTED"}</span><h1>{celebration.title}</h1><p><CalendarDays size={15}/> {dateLabel(celebration.date)}</p></div><div className="row-actions"><button className="button outlined" onClick={() => setModal({ kind: "celebration", edit: true })}><Settings2 size={16}/> Settings</button><button className="button primary" onClick={() => setModal({ kind: "share" })}><Link2 size={17}/> Share list</button></div></div> : <section className={`celebration-hero ${celebration.theme}`}><div className="event-meta"><span className="eyebrow">{celebration.occasion.toUpperCase()} / YOU’RE INVITED</span><span className="date-chip"><CalendarDays size={15}/>{dateLabel(celebration.date)}</span></div><div className="event-title"><h1>{celebration.title}</h1><span className="event-monogram" aria-hidden="true">{celebration.title[0]}<i>↗</i></span></div><div className="event-bottom"><p>{celebration.message || "A few things I would love. Thank you for being part of my celebration."}</p><span><strong>{wishes.length}</strong> GOOD IDEAS<br/>ONE GREAT CELEBRATION</span></div></section>}
 {owner && <><ListBalance key={celebration.id + celebration.currency} wishes={wishes} currency={celebration.currency} onAdd={() => setModal({ kind: "wish" })}/><a href={`/w/${celebration.slug}`} className="owner-preview-link text-link"><Eye size={15}/> Preview as a guest <ArrowRight size={15}/></a></>}
 {!owner && isOwner && <div className="owner-preview-note"><Eye size={16}/> You’re viewing your own list. Reservations are available to guests.</div>}
 {!owner && <div className="guest-finder-wrap"><GiftFinder key={celebration.id + celebration.currency} wishes={wishes} currency={celebration.currency} now={now} onChoose={w => { setError(""); setModal({ kind: "detail", id: w.id }); }}/></div>}
 <section className={owner ? "wishlist-section" : "wishlist-section guest-list"}>
 <div className="wishes-heading"><div><span className="eyebrow">{owner ? "CURATED BY YOU" : "THE FULL LINEUP"}</span><h2>{owner ? "Your wishes" : "Good things, picked by me."} <span>{wishes.length}</span></h2></div>{owner ? <button className="button dark" onClick={() => setModal({ kind: "wish" })}><Plus size={17}/> Add a wish</button> : <span className="reassurance"><ShieldCheck size={17}/> The surprise stays safe</span>}</div>
 <div className="filter-bar"><div className="category-tabs" aria-label="Wish categories">{["All wishes", ...categories.filter(c => wishes.some(w => w.category === c))].map(c => <button className={category === c ? "active" : ""} key={c} onClick={() => setCategory(c)}>{c}</button>)}</div><div className="filter-controls"><label className="check-control"><input type="checkbox" checked={available} onChange={e => setAvailable(e.target.checked)}/> Available only</label><select aria-label="Filter by budget" value={budget} onChange={e => setBudget(e.target.value)}><option value="">Any budget</option>{[50, 100, 200, 500].map(n => <option value={n} key={n}>Under {money(n * 100, celebration.currency)}</option>)}</select><select aria-label="Sort wishes" value={sort} onChange={e => setSort(e.target.value)}><option value="recommended">Suggested order</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option></select>{wishes.length >= 12 && <label className="search"><Search size={16}/><input aria-label="Search wishes" placeholder="Find a wish" value={search} onChange={e => setSearch(e.target.value)}/></label>}</div></div>
 {display.length ? <div className="wish-grid">{display.map(w => <article className={`wish-card ${w.paused ? "paused" : ""}`} key={w.id}><button className="card-open" onClick={() => { setError(""); setModal({ kind: "detail", id: w.id }); }} aria-label={`View ${w.title}`}><div className="card-visual"><WishArt wish={w}/>{w.priority === 1 && <span className="top-pick"><Heart size={12} fill="currentColor"/> Would really love</span>}<Badge wish={w} owner={owner || isOwner}/></div><div className="card-copy"><span className="micro">{w.category}</span><h3>{w.title}</h3><p>{w.note || "A little something to make the day special."}</p><div className="card-bottom"><strong>{money(w.price, celebration.currency)}</strong><span>{w.mine ? "Your gift" : owner ? "View wish" : "Take a look"}<ArrowRight size={15}/></span></div></div></button></article>)}</div> : <div className="empty-state compact"><Gift size={32} strokeWidth={1.4}/><h2>{wishes.length ? "No wishes match just yet." : "Room for a little possibility."}</h2><p>{wishes.length ? "Try another category or a wider budget." : owner ? "Add your first wish — a product, an experience, or something entirely your own." : "A few thoughtful ideas will appear here soon."}</p>{owner && !wishes.length && <button className="button primary" onClick={() => setModal({ kind: "wish" })}><Plus size={17}/> Add the first wish</button>}{wishes.length > 0 && <button className="button outlined" onClick={() => { setCategory("All wishes"); setBudget(""); setAvailable(false); setSearch(""); }}>Clear filters</button>}</div>}
 </section>{!owner && <div className="guest-bottom"><Heart size={18}/><p>You bring the thought. We help with the details.</p><a className="text-link" href="/dashboard">Make a Wishnest of your own <ArrowRight size={15}/></a></div>}
 </> : !loading && <div className="empty-state"><LockKeyhole size={34}/><h2>This list isn’t available.</h2><p>Ask the person who shared it for a current link.</p><Link className="button outlined" href="/">Back to Wishnest</Link></div>}
 </div></main>{!owner && <Footer />}

 {modal?.kind === "celebration" && <Dialog title={modal.edit ? "Celebration settings" : "Create a celebration"} onClose={() => { setModal(null); setError(""); }}><CelebrationForm initial={modal.edit ? celebration : null} busy={busy} error={error} onSave={async (value) => { setBusy(true); setError(""); try {
        if (modal.edit && celebration) {
            await api(`celebrations/${celebration.id}`, value, "PATCH");
            await refresh();
        }
        else {
            const d = await api("celebrations", value);
            await loadLists();
            await loadCelebration(d.id);
        }
        setModal(null);
        notify("Your celebration is saved.");
    }
    catch (e) {
        setError((e as Error).message);
    }
    finally {
        setBusy(false);
    } }}/></Dialog>}
 {modal?.kind === "wish" && celebration && <Dialog title={modal.wish ? "Edit your wish" : "Add a wish"} onClose={() => { setModal(null); setError(""); }}><WishForm initial={modal.wish} currency={celebration.currency} busy={busy} error={error} onSave={async (value) => { setBusy(true); setError(""); try {
        if (modal.wish)
            await api(`wishes/${modal.wish.id}`, value, "PATCH");
        else
            await api(`celebrations/${celebration.id}/wishes`, value);
        await refresh();
        setModal(null);
        notify("A little wish, saved.");
    }
    catch (e) {
        setError((e as Error).message);
    }
    finally {
        setBusy(false);
    } }}/></Dialog>}
 {modal?.kind === "share" && celebration && <Dialog title="Share your Wishnest" onClose={() => setModal(null)}><span className="dialog-symbol"><Link2 size={25}/></span><h2>Good things are better shared.</h2><p className="dialog-intro">Send your celebration link to your favourite people.</p>{celebration.visibility === "private" ? <div className="notice"><LockKeyhole size={20}/><p>This list is private. Change visibility to Unlisted in Settings before sharing.</p></div> : <><label className="field">Your celebration link<input readOnly value={typeof window !== "undefined" ? `${window.location.origin}/w/${celebration.slug}` : ""} onFocus={e => e.target.select()}/></label><button className="button primary full" onClick={copyLink}><Copy size={17}/> Copy link</button><p className="fine-print">Early access is currently limited by this site’s private access settings. Sharing a link does not grant access to the private site.</p></>}<button className="text-link standalone" onClick={() => setModal({ kind: "celebration", edit: true })}>Manage list privacy <ArrowRight size={14}/></button></Dialog>}
 {currentWish && celebration && <Dialog title={currentWish.title} onClose={() => { setModal(null); setError(""); }} wide><div className="detail-layout"><div className="detail-art"><WishArt wish={currentWish}/></div><div className="detail-copy"><span className="micro">{currentWish.category}</span><h2>{currentWish.title}</h2><p className="detail-note">{currentWish.note || "A little something to make the day special."}</p><div className="detail-price"><strong>{money(currentWish.price, celebration.currency)}</strong><Badge wish={currentWish} owner={owner || isOwner}/></div>{currentWish.url && <a className="retailer-link" href={currentWish.url} target="_blank" rel="noopener noreferrer">View at {new URL(currentWish.url).hostname.replace(/^www\./, "")} <ExternalLink size={14}/></a>}
 {error && <p className="form-error" role="alert">{error}</p>}
 {owner ? <div className="detail-actions">{visibleState(currentWish.state, currentWish.expires, now) === "available" ? <><button className="button primary full" onClick={() => { setError(""); setModal({ kind: "wish", wish: currentWish }); }}>Edit wish <Settings2 size={16}/></button><button className="button outlined full" disabled={busy} onClick={() => action(currentWish, currentWish.paused ? "resume" : "pause")}>{currentWish.paused ? "Show on my list" : "Hide from guests"}</button></> : <><div className="notice"><ShieldCheck size={20}/><p>{currentWish.state === "received" ? "Marked as received. We hope it brought a little joy." : "Someone is taking care of this. Details are locked while a guest is choosing your gift."}</p></div>{currentWish.state !== "received" && <button className="button outlined full" disabled={busy} onClick={() => action(currentWish, "received")}>I received this <Check size={16}/></button>}{celebration.date && Date.parse(celebration.date + "T23:59:59Z") < now && <button className="text-link" disabled={busy} onClick={() => { if (window.confirm("Reopen this wish? A guest may still be arranging the gift."))
            action(currentWish, "reopen"); }}>Reopen missing gift <RotateCcw size={14}/></button>}</>}</div> : isOwner ? <div className="notice"><Eye size={18}/><p>This is your list. Guests will be able to reserve available gifts.</p></div> : currentWish.mine ? <div className="detail-actions">{visibleState(currentWish.state, currentWish.expires, now) === "reserved" ? <><div className="reservation-info"><Clock3 size={19}/><div><strong>Reserved just for you</strong><span>Until {new Date(currentWish.expires!).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span></div></div>{currentWish.url && <a className="button primary full" href={currentWish.url} target="_blank" rel="noopener noreferrer">Continue to shop <ExternalLink size={16}/></a>}<button className="button dark full" disabled={busy} onClick={() => action(currentWish, "purchase")}>I bought it <Check size={16}/></button>{!currentWish.extended && <button className="text-link" disabled={busy} onClick={() => action(currentWish, "extend")}>Need another day? Extend once</button>}</> : visibleState(currentWish.state, currentWish.expires, now) === "purchased" ? <div className="notice"><Check size={19}/><p>You marked this gift as purchased. This is self-confirmed; purchase verification is not available yet.</p></div> : <p className="notice">This reservation has expired. Reserve again if it’s still available.</p>}<button className="text-link" disabled={busy} onClick={() => action(currentWish, "release")}>Release this gift</button><p className="fine-print">Manage this reservation in this browser. Email reminders and cross-device recovery are not available yet.</p></div> : visibleState(currentWish.state, currentWish.expires, now) === "available" ? <div className="detail-actions"><button className="button primary full" disabled={busy} onClick={() => action(currentWish, "reserve")}>{busy ? "Reserving…" : "Reserve this gift"}<ArrowRight size={17}/></button><p className="fine-print"><LockKeyhole size={13}/> A private 24-hour hold. Purchase at the shop, then come back to confirm. Unconfirmed holds return to the list.</p></div> : <div className="notice"><Heart size={19}/><p>Someone is already taking care of this wish. There are other lovely ideas to choose from.</p></div>}
 </div></div></Dialog>}
 {toast && <div className="toast" role="status"><Check size={17}/>{toast}</div>}
 </>;
}
function CelebrationForm({ initial, busy, error, onSave }: {
    initial: Celebration | null;
    busy: boolean;
    error: string;
    onSave: (v: Record<string, unknown>) => void;
}) {
    const [occasion, setOccasion] = useState(initial?.occasion || "Birthday");
    const [theme, setTheme] = useState(initial?.theme || "peach");
    function submit(e: FormEvent<HTMLFormElement>) { e.preventDefault(); const d = new FormData(e.currentTarget); onSave({ title: d.get("title"), occasion, date: d.get("date"), message: d.get("message"), currency: d.get("currency"), visibility: d.get("visibility"), theme }); }
    return <><span className="eyebrow">SOMETHING TO LOOK FORWARD TO</span><h2>{initial ? "Make it feel like you." : "What are we celebrating?"}</h2><p className="dialog-intro">Every big day and little milestone deserves a Wishnest.</p><form onSubmit={submit} className="edit-form"><div className="occasion-options">{occasions.map(o => <button type="button" aria-pressed={occasion === o} className={occasion === o ? "selected" : ""} key={o} onClick={() => setOccasion(o)}>{o}</button>)}</div><label className="field">Give it a name<input autoFocus name="title" required maxLength={90} placeholder="e.g. Maya’s 30th birthday" defaultValue={initial?.title}/></label><div className="form-row"><label className="field">Date <span>(optional)</span><input type="date" name="date" defaultValue={initial?.date}/></label><label className="field">Currency<select name="currency" defaultValue={initial?.currency || "USD"}>{["USD", "EUR", "GBP", "EGP", "AED"].map(c => <option key={c}>{c}</option>)}</select></label></div><label className="field">A little note to your guests<textarea name="message" rows={3} maxLength={1000} defaultValue={initial?.message} placeholder="Your company is the best gift. If you’d like to bring a little something…"/></label><div className="form-row"><label className="field">Who can see your list?<select name="visibility" defaultValue={initial?.visibility || "unlisted"}><option value="unlisted">Unlisted — anyone with the link</option><option value="private">Private — only you</option></select></label><fieldset className="theme-picker"><legend>Choose a mood</legend>{["peach", "sage", "lavender"].map(t => <button type="button" key={t} className={`${t} ${theme === t ? "selected" : ""}`} onClick={() => setTheme(t)} aria-label={`${({peach: "Electric blue", sage: "Acid lime", lavender: "Ultraviolet"} as Record<string,string>)[t]} theme`} aria-pressed={theme === t}>{theme === t && <Check size={16}/>}</button>)}</fieldset></div>{error && <p role="alert" className="form-error">{error}</p>}<button className="button primary full" disabled={busy}>{busy ? "Saving…" : initial ? "Save changes" : "Create my celebration"}<ArrowRight size={17}/></button></form></>;
}
function WishForm({ initial, currency, busy, error, onSave }: {
    initial?: Wish;
    currency: string;
    busy: boolean;
    error: string;
    onSave: (v: Record<string, unknown>) => void;
}) {
    const [image, setImage] = useState(initial?.image || "");
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState("");
    const [kind, setKind] = useState(initial?.kind || "product");
    async function upload(file: File) { setUploading(true); setUploadError(""); try {
        if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 12000000)
            throw new Error("Choose a JPG, PNG, or WebP photo smaller than 12 MB.");
        const bitmap = await createImageBitmap(file);
        const canvas = document.createElement("canvas");
        const ratio = Math.min(1, 1200 / Math.max(bitmap.width, bitmap.height));
        canvas.width = Math.round(bitmap.width * ratio);
        canvas.height = Math.round(bitmap.height * ratio);
        canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        bitmap.close();
        const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(b => b ? resolve(b) : reject(new Error("Could not read this photo.")), "image/jpeg", .85));
        const r = await fetch("/api/images", { method: "POST", body: blob, headers: { "Content-Type": "image/jpeg" } });
        const d = await r.json() as {
            error?: string;
            url: string;
        };
        if (!r.ok)
            throw new Error(d.error);
        setImage(d.url);
    }
    catch (e) {
        setUploadError((e as Error).message);
    }
    finally {
        setUploading(false);
    } }
    function submit(e: FormEvent<HTMLFormElement>) { e.preventDefault(); const d = new FormData(e.currentTarget); onSave({ title: d.get("title"), note: d.get("note"), url: d.get("url") || "", kind, category: d.get("category"), price: d.get("price") === "" ? null : Math.round(Number(d.get("price")) * 100), priority: d.get("priority") ? 1 : 0, art: d.get("art"), image }); }
    return <><span className="eyebrow">A LITTLE HINT OF HAPPINESS</span><h2>{initial ? "Fine-tune your wish." : "What’s on your wishlist?"}</h2><p className="dialog-intro">A favourite thing, a new experience, or a thoughtful idea.</p><form onSubmit={submit} className="edit-form"><div className="occasion-options">{[["product", "A product"], ["experience", "An experience"], ["custom", "An idea"]].map(([k, label]) => <button type="button" key={k} aria-pressed={kind === k} className={kind === k ? "selected" : ""} onClick={() => setKind(k)}>{label}</button>)}</div><label className="field">Link to the item <span>(optional)</span><input type="url" name="url" defaultValue={initial?.url} placeholder="https://your-favourite-store.com/item" pattern="https://.*" maxLength={2048}/></label><p className="field-hint">Add a link from any store, then fill in the details below.</p><label className="field">What would you love?<input name="title" autoFocus required maxLength={120} defaultValue={initial?.title} placeholder="e.g. A slower morning, a better coffee"/></label><div className="form-row"><label className="field">Approximate price ({currency})<input name="price" type="number" min={0} max={1000000} step="0.01" defaultValue={initial?.price != null ? initial.price / 100 : ""} placeholder="Any budget"/></label><label className="field">Category<select name="category" defaultValue={initial?.category || "Home & living"}>{categories.map(c => <option key={c}>{c}</option>)}</select></label></div><label className="field">The little details<textarea name="note" rows={3} maxLength={1000} defaultValue={initial?.note} placeholder="Colours, sizes, why you love it — anything that helps."/></label><div className="photo-upload">{image ? <img src={image} alt="Your uploaded wish photo"/> : <ImagePlus size={24}/>}<div><label className="upload-label">{uploading ? "Adding photo…" : image ? "Change photo" : "Add your own photo"}<input disabled={uploading || busy} type="file" accept="image/jpeg,image/png,image/webp" onChange={e => { const file = e.target.files?.[0]; if (file)
        upload(file); }}/></label><span>JPG, PNG, or WebP · up to 12 MB</span></div>{image && <button type="button" className="icon-button" aria-label="Remove photo" onClick={() => setImage("")}><X size={16}/></button>}</div><label className="field">Illustration when there’s no photo<select name="art" defaultValue={initial?.art || "gift"}>{[["gift", "A thoughtful gift"], ["coffee", "Coffee"], ["camera", "Camera"], ["vase", "Ceramics"], ["book", "Books"], ["headphones", "Music"], ["trip", "Experiences"]].map(([v, l]) => <option value={v} key={v}>{l}</option>)}</select></label><label className="check-control"><input type="checkbox" name="priority" defaultChecked={initial?.priority === 1}/><Heart size={15}/> I’d really love this one</label>{(error || uploadError) && <p className="form-error" role="alert">{error || uploadError}</p>}<button className="button primary full" disabled={busy || uploading}>{busy ? "Saving…" : initial ? "Save my wish" : "Add to my Wishnest"}<ArrowRight size={17}/></button></form></>;
}
