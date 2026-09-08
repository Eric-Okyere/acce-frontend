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

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const phone = String(formData.get("phone") || "").trim();
  const password = String(formData.get("password") || "");

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
  return { redirectTo: roleHome(role) };
}

export async function logoutAction(): Promise<void> {
  await clearSessionCookie();
  redirect("/login");
}
