import Image from "next/image";
import Link from "next/link";
import LoginForm from "./LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
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
