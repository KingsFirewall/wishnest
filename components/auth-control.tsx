"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export function AuthControl() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetch("/api/me", { cache: "no-store" }).then(r => r.json()).then(d => { if (!cancelled) setSignedIn(!!d.user); }).catch(() => { if (!cancelled) setSignedIn(false); });
    return () => { cancelled = true; };
  }, []);
  if (!signedIn) return <Link className="button button-small dark" href="/sign-in">Sign in <ArrowUpRight size={16}/></Link>;
  return <div style={{display:"flex",alignItems:"center",gap:12}}>
    <Link className="button button-small dark" href="/dashboard">My Wishnest <ArrowUpRight size={16}/></Link>
    <form action="/auth/sign-out" method="post"><button className="text-link" type="submit">Sign out</button></form>
  </div>;
}
