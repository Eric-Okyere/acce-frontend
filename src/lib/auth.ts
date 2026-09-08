import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { Role } from "@/lib/types";

// The backend (Express) issues and signs this token at login — the frontend
// never signs a session token itself. It just stores the backend's raw JWT
// in an httpOnly cookie, verifies it locally with `jose` (using the SAME
// JWT_SECRET as the backend) to avoid a network round-trip on every page
// load, and forwards the very same token as `Authorization: Bearer <token>`
// on every backend API call (see lib/api.ts).
const COOKIE_NAME = "acce_session";
const SESSION_DAYS = 7;

function getSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set. Add it to .env — see .env.example. It must match the backend's JWT_SECRET exactly.");
  }
  return new TextEncoder().encode(secret);
}

export interface SessionPayload {
  sub: string; // user id
  role: Role;
  name: string;
}

export async function setSessionCookie(token: string): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

/** The raw backend-issued JWT, for forwarding as a Bearer token — see lib/api.ts. */
export async function getRawToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(COOKIE_NAME)?.value ?? null;
}

export async function getSession(): Promise<SessionPayload | null> {
  const token = await getRawToken();
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (!payload.sub || !payload.role) return null;
    return {
      sub: payload.sub as string,
      role: payload.role as Role,
      name: (payload.name as string) ?? "",
    };
  } catch {
    return null;
  }
}
