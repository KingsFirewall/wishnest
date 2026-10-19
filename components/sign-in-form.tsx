"use client";
import { useState, type FormEvent } from "react";
import { ArrowRight, Check } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

// One passwordless flow covers both sign-in and sign-up.
export function SignInForm({ next, linkError }: { next: string; linkError: boolean }) {
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(linkError ? "That sign-in link has expired or was already used. Request a new one." : "");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get("email") || "").trim();
    setBusy(true); setError("");
    const redirect = new URL("/auth/confirm", window.location.origin);
    redirect.searchParams.set("next", next);
    const { error } = await createSupabaseBrowserClient().auth.signInWithOtp({ email, options: { emailRedirectTo: redirect.toString() } });
    setBusy(false);
    if (error) setError(error.status === 429 ? "Too many attempts. Please wait a few minutes and try again." : "We couldn’t send the link. Check the address and try again.");
    else setSent(true);
  }
  if (sent) return <div className="empty-state"><Check size={30}/><h1>Check your inbox.</h1><p>We sent you a sign-in link. Open it in this browser to continue.</p></div>;
  return <form onSubmit={submit} className="edit-form" style={{width:"100%",maxWidth:420}}>
    <span className="eyebrow">WELCOME TO WISHNEST</span>
    <h1>Sign in or create your account.</h1>
    <p className="dialog-intro">We’ll email you a secure link. No password needed.</p>
    <label className="field">Email address<input name="email" type="email" required autoComplete="email" maxLength={254} placeholder="you@example.com"/></label>
    {error && <p className="form-error" role="alert">{error}</p>}
    <button className="button primary full" disabled={busy}>{busy ? "Sending…" : "Email me a link"} <ArrowRight size={16}/></button>
  </form>;
}
