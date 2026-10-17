"use client";
import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { sampleWishes } from "@/lib/sample";
import { GiftFinder, ListBalance } from "./gift-tools";
export function HomePlayground() {
  const [view, setView] = useState("guest");
  return <div className="home-playground"><div className="playground-toolbar"><div className="view-switch" aria-label="Preview perspective"><button aria-pressed={view === "guest"} onClick={() => setView("guest")}>I’m choosing a gift</button><button aria-pressed={view === "owner"} onClick={() => setView("owner")}>I’m making a list</button></div><span>LIVE SAMPLE · MAYA’S 30TH</span></div>{view === "guest" ? <GiftFinder wishes={sampleWishes} currency="USD" compact onChoose={w => { window.location.href = `/demo?wish=${encodeURIComponent(w.id)}`; }}/> : <ListBalance wishes={sampleWishes} currency="USD"/>}<a className="playground-link" href="/demo">Explore the full sample celebration <ArrowUpRight size={16}/></a></div>;
}
