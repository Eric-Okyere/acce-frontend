"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loginAction, type LoginState } from "@/app/actions/auth";

const initialState: LoginState = {};

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);
  const router = useRouter();

  // loginAction returns { redirectTo } on success instead of redirecting
  // itself — see the comment on LoginState. Navigate here, as a plain
  // client-side push, once that's set.
  useEffect(() => {
    if (state.redirectTo) {
      router.push(state.redirectTo);
    }
  }, [state.redirectTo, router]);

  const redirecting = Boolean(state.redirectTo);

  return (
    <form action={formAction} className="space-y-4">
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
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-base focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
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
          autoComplete="current-password"
          required
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-base focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
      </div>

      {state.error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || redirecting}
        className="w-full rounded-lg bg-blue-700 text-white font-medium py-2.5 hover:bg-blue-800 disabled:opacity-60 transition"
      >
        {redirecting ? "Signed in — redirecting…" : pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
