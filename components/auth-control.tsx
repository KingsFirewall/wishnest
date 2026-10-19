"use client";
import Link from "next/link";
import { Show, UserButton } from "@clerk/nextjs";
import { ArrowUpRight } from "lucide-react";

export function AuthControl() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) return <Link className="button button-small dark" href="/sign-in">Sign in <ArrowUpRight size={16}/></Link>;
  return <ConfiguredAuthControl/>;
}
function ConfiguredAuthControl() {
  return <div style={{display:"flex",alignItems:"center",gap:12}}>
    <Show when="signed-out"><Link className="button button-small dark" href="/sign-in">Sign in <ArrowUpRight size={16}/></Link></Show>
    <Show when="signed-in"><Link className="button button-small dark" href="/dashboard">My Wishnest <ArrowUpRight size={16}/></Link><UserButton/></Show>
  </div>;
}
