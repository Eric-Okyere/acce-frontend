import { redirect } from "next/navigation";
import { getSession, getRawToken, type SessionPayload } from "@/lib/auth";
import type { Role } from "@/lib/types";

export function roleHome(role: Role): string {
  switch (role) {
    case "ADMIN":
      return "/admin";
    case "TEACHER":
      return "/teacher";
    case "COURSE_REP":
      return "/rep";
    case "STUDENT":
      return "/student";
  }
}

/** Redirects to /login if unauthenticated, or to the user's own home if their role isn't allowed. */
export async function requireSession(allowed: Role[]): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!allowed.includes(session.role)) redirect(roleHome(session.role));
  return session;
}

/** Same as requireSession, but also returns the raw Bearer token for API calls. */
export async function requireSessionWithToken(
  allowed: Role[]
): Promise<{ session: SessionPayload; token: string }> {
  const session = await requireSession(allowed);
  const token = await getRawToken();
  if (!token) redirect("/login"); // shouldn't happen if getSession() succeeded, but keeps TS happy
  return { session, token };
}
