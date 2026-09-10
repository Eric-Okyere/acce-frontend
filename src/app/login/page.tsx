import Image from "next/image";
import LoginForm from "./LoginForm";

export default function LoginPage() {
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
            Accra College of Education — sign in with your registered phone number
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
          <LoginForm />
        </div>
        <p className="text-xs text-slate-400 text-center mt-6">
          Lost access to your account, or new phone as a student? Ask your admin.
        </p>
      </div>
    </main>
  );
}
