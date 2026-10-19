import { SignIn } from "@clerk/nextjs";
import { Header, Footer } from "@/components/chrome";
export default function SignInPage() {
  return <><Header/><main id="main-content" style={{display:"grid",placeItems:"center",minHeight:"70vh",padding:24}}>
    {process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY
      ? <SignIn fallbackRedirectUrl="/dashboard"/>
      : <div className="empty-state"><h1>Sign-in is not configured yet.</h1><p>The site owner needs to connect authentication before accounts are available.</p></div>}
  </main><Footer/></>;
}
