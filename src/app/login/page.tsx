import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { roleHome } from "@/lib/guard";
import LoginForm from "./LoginForm";

// Always render fresh, per request — this page must never be served from
// the browser's back/forward cache, or someone who's already signed in
// could land back on the login form via the Back button without the
// already-signed-in check below ever running. See the redirect just below.
export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  // "Prevent navigation to login page except logout" — if there's already a
  // valid session (e.g. someone hits the Back button after signing in, or
  // the /login URL directly while still logged in), bounce them straight to
  // their own dashboard instead of showing the form again. This is the ONLY
  // gate needed: the sole other way to legitimately reach /login while
  // logged in is via Sign out (Nav.tsx's logoutAction, which clears the
  // session cookie first — see lib/auth.ts's clearSessionCookie), so by the
  // time that lands here there's no session left to redirect away from.
  const session = await getSession();
  if (session) redirect(roleHome(session.role));

  // Set by app/scan/page.tsx when someone reaches a hall's QR link without
  // an existing session — LoginForm carries this through as a hidden field
  // so loginAction can send them straight back to the check-in form instead
  // of just their role's home page. See actions/auth.ts's safeNextPath for
  // why only a same-site relative path is ever honored here.
  const { next } = await searchParams;

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          {/* Versioned filename (…-v3) — guarantees this URL was never served
              by an old build, so no cache anywhere can show a stale logo. */}
          <Image
            src="/brand/acce-crest-v3.png"
            alt="Accra College of Education crest"
            width={96}
            height={96}
            className="mx-auto h-24 w-24 rounded-2xl shadow-sm"
            priority
          />
          <h1 className="mt-4 text-xl font-semibold text-slate-900">ACCE Attendance</h1>
          <p className="text-sm text-slate-500 mt-1">
            {next?.startsWith("/scan")
              ? "Sign in to check in — you'll be taken straight back to the scan you just made."
              : "Accra College of Education — sign in with your registered phone number"}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
          <LoginForm next={next} />
        </div>
        <p className="text-xs text-slate-400 text-center mt-6">
          New student?{" "}
          <Link href="/register" className="text-blue-700 hover:underline">
            Create an account
          </Link>
        </p>
        <p className="text-xs text-slate-400 text-center mt-2">
          Lost access to your account, or new phone as a student? Ask your admin.
        </p>
      </div>
    </main>
  );
}
