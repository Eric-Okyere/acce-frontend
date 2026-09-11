"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { registerStudentAction, type RegisterState } from "@/app/actions/auth";
import { inputClass, buttonClass } from "@/components/ui";

const initialState: RegisterState = {};

export default function RegisterForm({
  programs,
  subjects,
}: {
  programs: { id: string; name: string }[];
  subjects: { id: string; name: string; programId: string }[];
}) {
  const [state, formAction, pending] = useActionState(registerStudentAction, initialState);
  const router = useRouter();

  // Controlled so the course checklist below can filter to only the
  // selected program's subjects — a student can only offer courses within
  // their own program.
  const [programId, setProgramId] = useState("");
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const programSubjects = subjects.filter((s) => s.programId === programId);

  function toggleSubject(id: string) {
    setSelectedSubjectIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  // Same pattern as LoginForm — see the comment on LoginState.redirectTo in
  // app/actions/auth.ts for why this doesn't call redirect() in the action.
  useEffect(() => {
    if (state.redirectTo) {
      router.push(state.redirectTo);
    }
  }, [state.redirectTo, router]);

  const redirecting = Boolean(state.redirectTo);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">
          Full name
        </label>
        <input id="name" name="name" required className={inputClass} />
      </div>
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1">
          Phone number
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          required
          placeholder="024 000 0000"
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="programId" className="block text-sm font-medium text-slate-700 mb-1">
          Program
        </label>
        <select
          id="programId"
          name="programId"
          required
          className={inputClass}
          value={programId}
          onChange={(e) => {
            setProgramId(e.target.value);
            setSelectedSubjectIds([]); // last program's courses no longer apply
          }}
        >
          <option value="" disabled>
            Choose your program
          </option>
          {programs.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <span className="block text-sm font-medium text-slate-700 mb-1">Courses you&apos;re offering</span>
        {!programId ? (
          <p className="text-xs text-slate-400">Choose your program above first.</p>
        ) : programSubjects.length === 0 ? (
          <p className="text-xs text-slate-400">No courses are set up for this program yet — ask your admin.</p>
        ) : (
          <div className="border border-slate-200 rounded-lg px-3 py-2 max-h-40 overflow-y-auto space-y-1.5">
            {programSubjects.map((s) => (
              <label key={s.id} className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  name="subjectIds"
                  value={s.id}
                  checked={selectedSubjectIds.includes(s.id)}
                  onChange={() => toggleSubject(s.id)}
                  className="rounded border-slate-300"
                />
                {s.name}
              </label>
            ))}
          </div>
        )}
        <p className="text-xs text-slate-400 mt-1">
          This is what makes your name appear to your teachers for each course, so they can track your attendance.
        </p>
      </div>
      <div>
        <label htmlFor="indexNumber" className="block text-sm font-medium text-slate-700 mb-1">
          Index number
        </label>
        <input
          id="indexNumber"
          name="indexNumber"
          required
          placeholder="e.g. ECE/24/001"
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className={inputClass}
        />
        <p className="text-xs text-slate-400 mt-1">At least 8 characters.</p>
      </div>
      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-1">
          Confirm password
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className={inputClass}
        />
      </div>

      {state.error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || redirecting || selectedSubjectIds.length === 0}
        className={`${buttonClass} w-full !py-2.5`}
      >
        {redirecting ? "Account created — signing you in…" : pending ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}
