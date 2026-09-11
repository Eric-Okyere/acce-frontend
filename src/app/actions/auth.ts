"use server";

import { redirect } from "next/navigation";
import * as api from "@/lib/api";
import { ApiError } from "@/lib/api";
import { setSessionCookie, clearSessionCookie } from "@/lib/auth";
import { roleHome } from "@/lib/guard";

export interface LoginState {
  error?: string;
  // Set on success instead of calling redirect() here. redirect() thrown
  // inside a Server Action relies on the client picking up a special
  // redirect signal in the action's fetch response — in practice that can
  // silently fail to navigate (browser extensions intercepting fetch, a
  // stale dev Server Action id after a hot-reload, etc.), leaving the user
  // stuck on /login with no error shown. Returning the destination and
  // letting the client component call router.push() itself is a plain,
  // ordinary client-side navigation that doesn't depend on that mechanism.
  redirectTo?: string;
}

// Only ever follow a `next` destination that's a same-site relative path
// (starts with a single "/", never "//" or "/\" which browsers can treat as
// protocol-relative and send the person off-site) — this is untrusted input
// straight from the URL, so an open-redirect check here is what keeps a
// crafted /login?next=https://evil.example link from being useful.
function safeNextPath(next: string | null): string | null {
  if (!next) return null;
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return null;
  return next;
}

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const phone = String(formData.get("phone") || "").trim();
  const password = String(formData.get("password") || "");
  // Set by LoginForm from the page's own `next` search param — see
  // app/scan/page.tsx, which sends someone here as /login?next=/scan?token=…
  // when they land on a hall's QR link without an existing session.
  const next = safeNextPath(String(formData.get("next") || "").trim() || null);

  if (!phone || !password) {
    return { error: "Enter your phone number and password." };
  }

  let token: string;
  let role;
  try {
    const result = await api.login(phone, password);
    token = result.token;
    role = result.user.role;
  } catch (e) {
    if (e instanceof ApiError) return { error: e.message };
    return { error: "Couldn't reach the server. Please try again." };
  }

  // The backend already signed this token and recorded the LOGIN audit entry —
  // the frontend just stores it, it never signs its own session token.
  await setSessionCookie(token);
  return { redirectTo: next ?? roleHome(role) };
}

export async function logoutAction(): Promise<void> {
  await clearSessionCookie();
  redirect("/login");
}

export interface RegisterState {
  error?: string;
  // Same reasoning as LoginState.redirectTo above — see the comment there.
  redirectTo?: string;
}

export async function registerStudentAction(_prev: RegisterState, formData: FormData): Promise<RegisterState> {
  const name = String(formData.get("name") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const password = String(formData.get("password") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");
  const programId = String(formData.get("programId") || "").trim();
  const indexNumber = String(formData.get("indexNumber") || "").trim();
  const subjectIds = formData.getAll("subjectIds").map(String).filter(Boolean);

  if (!name || !phone || !password || !programId || !indexNumber) {
    return { error: "Fill in your name, phone number, password, program, and index number." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  if (password !== confirmPassword) {
    return { error: "Passwords don't match." };
  }
  if (subjectIds.length === 0) {
    return { error: "Choose at least one course you're offering." };
  }

  let token: string;
  let role;
  try {
    const result = await api.registerStudent({
      name,
      phone,
      password,
      confirmPassword,
      programId,
      indexNumber,
      subjectIds,
    });
    token = result.token;
    role = result.user.role;
  } catch (e) {
    if (e instanceof ApiError) return { error: e.message };
    return { error: "Couldn't reach the server. Please try again." };
  }

  await setSessionCookie(token);
  return { redirectTo: roleHome(role) };
}
