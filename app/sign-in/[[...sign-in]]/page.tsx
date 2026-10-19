import { Header, Footer } from "@/components/chrome";
import { SignInForm } from "@/components/sign-in-form";
import { supabaseConfigured, safeNext } from "@/lib/supabase/config";

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next, error } = await searchParams;
  return <><Header/><main id="main-content" style={{display:"grid",placeItems:"center",minHeight:"70vh",padding:24}}>
    {supabaseConfigured
      ? <SignInForm next={safeNext(next)} linkError={error === "link"}/>
      : <div className="empty-state"><h1>Sign-in is not configured yet.</h1><p>The site owner needs to connect authentication before accounts are available.</p></div>}
  </main><Footer/></>;
}
