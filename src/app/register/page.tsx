import Link from "next/link";
import Image from "next/image";
import * as api from "@/lib/api";
import RegisterForm from "./RegisterForm";

// Public page — no session required. Fetches the program list with the
// unauthenticated api.listProgramsPublic() (see lib/api.ts), since a brand
// new student has no token yet to call the normal /programs endpoint with.
export default async function RegisterPage() {
  let programs: { id: string; name: string }[] = [];
  let subjects: { id: string; name: string; programId: string }[] = [];
  let loadError: string | null = null;
  try {
    [programs, subjects] = await Promise.all([api.listProgramsPublic(), api.listSubjectsPublic()]);
  } catch {
    loadError = "Couldn't load the list of programs. Refresh the page, or ask your admin to register you instead.";
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Image
            src="/brand/acce-crest-v3.png"
            alt="Accra College of Education crest"
            width={96}
            height={96}
            className="mx-auto h-24 w-24 rounded-2xl shadow-sm"
            priority
          />
          <h1 className="mt-4 text-xl font-semibold text-slate-900">Student sign-up</h1>
          <p className="text-sm text-slate-500 mt-1">
            Accra College of Education — create your own student account
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
          {loadError ? (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{loadError}</p>
          ) : (
            <RegisterForm programs={programs} subjects={subjects} />
          )}
        </div>
        <p className="text-xs text-slate-400 text-center mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-blue-700 hover:underline">
            Sign in
          </Link>
        </p>
        <p className="text-xs text-slate-400 text-center mt-2">
          Teacher or course rep? Ask your admin to register you.
        </p>
      </div>
    </main>
  );
}
