"use server";

import { requireSessionWithToken } from "@/lib/guard";
import type { FormState } from "@/components/ActionForm";
import * as api from "@/lib/api";
import { ApiError } from "@/lib/api";

export async function changePasswordAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const { token } = await requireSessionWithToken(["ADMIN", "TEACHER", "COURSE_REP", "STUDENT"]);
  const currentPassword = String(fd.get("currentPassword") ?? "");
  const newPassword = String(fd.get("newPassword") ?? "");
  const confirmPassword = String(fd.get("confirmPassword") ?? "");

  if (newPassword.length < 8) return { error: "New password must be at least 8 characters." };
  if (newPassword !== confirmPassword) return { error: "New passwords don't match." };

  try {
    await api.changePassword(token, { currentPassword, newPassword, confirmPassword });
    return { success: "Password updated." };
  } catch (e) {
    if (e instanceof ApiError) return { error: e.message };
    return { error: "Couldn't reach the server. Please try again." };
  }
}
