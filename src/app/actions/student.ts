"use server";

import { revalidatePath } from "next/cache";
import { requireSessionWithToken } from "@/lib/guard";
import * as api from "@/lib/api";
import { ApiError } from "@/lib/api";
import type { ScanCandidate } from "@/lib/types";

export type { ScanCandidate };

export interface ResolveScanResult {
  error?: string;
  hallName?: string;
  candidates?: ScanCandidate[];
}

export async function resolveScanAction(qrToken: string): Promise<ResolveScanResult> {
  // STUDENT and COURSE_REP both check in to lectures the same way — see
  // routes/attendance.js on the backend, which accepts both roles here too.
  const { token } = await requireSessionWithToken(["STUDENT", "COURSE_REP"]);
  try {
    const result = await api.resolveScan(token, qrToken);
    return result;
  } catch (e) {
    return { error: e instanceof ApiError ? e.message : "Couldn't reach the server. Please try again." };
  }
}

export interface ScanActionResult {
  error?: string;
  success?: string;
}

export async function checkInAction(input: {
  lectureId: string;
  qrToken: string;
  deviceId: string;
  indexNumber: string;
  lat: number;
  lng: number;
  accuracy: number | null;
}): Promise<ScanActionResult> {
  // STUDENT and COURSE_REP both check in to lectures the same way — see
  // routes/attendance.js on the backend, which accepts both roles here too.
  const { token } = await requireSessionWithToken(["STUDENT", "COURSE_REP"]);
  try {
    const result = await api.checkIn(token, input);
    // A course rep checking in also has their own /rep dashboard to refresh.
    revalidatePath("/student");
    revalidatePath("/rep");
    return { success: result.success };
  } catch (e) {
    return { error: e instanceof ApiError ? e.message : "Something went wrong recording your check-in." };
  }
}

export interface UpdateMySubjectsResult {
  error?: string;
  success?: boolean;
}

// Self-service course selection — for an account that hasn't picked which
// courses it's offering yet (or wants to change its picks) without going
// through an admin. See routes/users.js's PATCH /users/me/subjects.
export async function updateMySubjectsAction(subjectIds: string[]): Promise<UpdateMySubjectsResult> {
  const { token } = await requireSessionWithToken(["STUDENT", "COURSE_REP"]);
  if (subjectIds.length === 0) return { error: "Choose at least one course you're offering." };
  try {
    await api.updateMySubjects(token, subjectIds);
    revalidatePath("/student");
    revalidatePath("/rep");
    return { success: true };
  } catch (e) {
    return { error: e instanceof ApiError ? e.message : "Could not save your courses." };
  }
}

export interface UpdateMyLevelResult {
  error?: string;
  success?: boolean;
}

// Self-service level selection — for an account that hasn't set its level
// yet (or wants to change it) without going through an admin. See
// routes/users.js's PATCH /users/me/level.
export async function updateMyLevelAction(level: number): Promise<UpdateMyLevelResult> {
  const { token } = await requireSessionWithToken(["STUDENT", "COURSE_REP"]);
  if (![100, 200, 300, 400].includes(level)) return { error: "Choose your level — 100, 200, 300 or 400." };
  try {
    await api.updateMyLevel(token, level);
    revalidatePath("/student");
    revalidatePath("/rep");
    return { success: true };
  } catch (e) {
    return { error: e instanceof ApiError ? e.message : "Could not save your level." };
  }
}

// checkOutAction was removed — students must not check out (they need to
// head straight to their next lecture), and check-in already marks them
// present immediately. See routes/attendance.js's POST /check-out and
// lib/api.ts for the backend/client side of this.
