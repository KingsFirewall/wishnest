import Link from "next/link";
import { AuthControl } from "./auth-control";
export function Brand(){return <Link href="/" className="brand" aria-label="Wishnest home"><svg className="brand-mark" viewBox="0 0 36 36" width="34" height="34" aria-hidden="true"><path d="M4 9l7 20 7-13 7 13 7-20M18 2v6m-4-3h8" fill="none" stroke="currentColor" strokeWidth="4" strokeLinejoin="round"/></svg>wishnest<span className="brand-dot">✳</span></Link>;}
export function Header(){return <header className="site-header"><Brand/><nav aria-label="Main navigation"><Link href="/#try-it">Find your gift</Link><Link href="/#how-it-works">How it works</Link><Link href="/demo">Explore a list</Link></nav><AuthControl/></header>;}
export function Footer(){return <footer className="footer"><Brand/><p>Less guessing. More you.</p><span>Wishnest · Early access · 2026</span></footer>;}
