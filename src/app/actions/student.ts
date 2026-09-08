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
  const { token } = await requireSessionWithToken(["STUDENT"]);
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
  lat: number;
  lng: number;
  accuracy: number | null;
}): Promise<ScanActionResult> {
  const { token } = await requireSessionWithToken(["STUDENT"]);
  try {
    const result = await api.checkIn(token, input);
    revalidatePath("/student");
    return { success: result.success };
  } catch (e) {
    return { error: e instanceof ApiError ? e.message : "Something went wrong recording your check-in." };
  }
}

export async function checkOutAction(input: {
  lectureId: string;
  qrToken: string;
  deviceId: string;
  lat: number;
  lng: number;
  accuracy: number | null;
}): Promise<ScanActionResult> {
  const { token } = await requireSessionWithToken(["STUDENT"]);
  try {
    const result = await api.checkOut(token, input);
    revalidatePath("/student");
    return { success: result.success };
  } catch (e) {
    return { error: e instanceof ApiError ? e.message : "Something went wrong recording your check-out." };
  }
}
