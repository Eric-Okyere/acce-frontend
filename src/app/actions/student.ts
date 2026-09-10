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

export async function checkOutAction(input: {
  lectureId: string;
  qrToken: string;
  deviceId: string;
  // Not required/checked for check-out — kept in the shape only because
  // ScanInput is shared with check-in. Always pass "" here.
  indexNumber: string;
  lat: number;
  lng: number;
  accuracy: number | null;
}): Promise<ScanActionResult> {
  // STUDENT and COURSE_REP both check in to lectures the same way — see
  // routes/attendance.js on the backend, which accepts both roles here too.
  const { token } = await requireSessionWithToken(["STUDENT", "COURSE_REP"]);
  try {
    const result = await api.checkOut(token, input);
    revalidatePath("/student");
    revalidatePath("/rep");
    return { success: result.success };
  } catch (e) {
    return { error: e instanceof ApiError ? e.message : "Something went wrong recording your check-out." };
  }
}
