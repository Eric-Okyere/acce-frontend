"use server";

import { revalidatePath } from "next/cache";
import { requireSessionWithToken } from "@/lib/guard";
import type { FormState } from "@/components/ActionForm";
import * as api from "@/lib/api";
import { ApiError } from "@/lib/api";

function str(fd: FormData, key: string): string {
  return String(fd.get(key) ?? "").trim();
}

// Shared by every role allowed to schedule a lecture — course reps (the
// original use case), teachers (their own subjects), and admins (any
// subject). See routes/lectures.js's POST "/" for the per-role subject
// ownership check this defers to; this action itself doesn't need to know
// the caller's role beyond passing it through requireSessionWithToken.
// Revalidates all three dashboards rather than branching on which page the
// caller came from, since that's cheap and keeps one action reusable from
// rep, teacher, and admin pages alike.
export async function createLectureAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const { token } = await requireSessionWithToken(["COURSE_REP", "TEACHER", "ADMIN"]);

  const subjectId = str(fd, "subjectId");
  const lectureHallId = str(fd, "lectureHallId");
  const title = str(fd, "title");
  const startTime = str(fd, "startTime");
  const endTime = str(fd, "endTime");

  if (!subjectId || !lectureHallId || !startTime || !endTime) {
    return { error: "Course, hall, start time, and end time are all required." };
  }
  const start = new Date(startTime);
  const end = new Date(endTime);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return { error: "Start time and end time must both be valid." };
  }
  if (end.getTime() <= start.getTime()) {
    return { error: "End time must be after the start time." };
  }

  try {
    await api.createLecture(token, {
      subjectId,
      lectureHallId,
      title: title || undefined,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
    });
    revalidatePath("/rep");
    revalidatePath("/teacher");
    revalidatePath("/admin");
    return { success: "Lecture scheduled. Students can check in up to 2 hours before it starts." };
  } catch (e) {
    return { error: e instanceof ApiError ? e.message : "Could not schedule the lecture." };
  }
}

// Same sharing reasoning as createLectureAction above. Ownership (or, for an
// admin, the lack of any ownership restriction) is enforced server-side —
// see routes/lectures.js's PATCH "/:id/cancel" — so a 404 here just means
// this wasn't the caller's own lecture (or, for a non-admin, someone else's).
export async function cancelLectureAction(lectureId: string): Promise<void> {
  const { token } = await requireSessionWithToken(["COURSE_REP", "TEACHER", "ADMIN"]);
  try {
    await api.cancelLecture(token, lectureId);
  } catch {
    // Nothing to surface here — see the comment above.
  }
  revalidatePath("/rep");
  revalidatePath(`/rep/lectures/${lectureId}`);
  revalidatePath("/teacher");
  revalidatePath("/admin");
  revalidatePath(`/admin/lectures/${lectureId}`);
}

// Ends an ongoing lecture early. Same sharing/ownership reasoning as
// cancelLectureAction above — see routes/lectures.js's PATCH "/:id/end".
export async function endLectureAction(lectureId: string): Promise<void> {
  const { token } = await requireSessionWithToken(["COURSE_REP", "TEACHER", "ADMIN"]);
  try {
    await api.endLecture(token, lectureId);
  } catch {
    // Nothing to surface here — see the comment above.
  }
  revalidatePath("/rep");
  revalidatePath(`/rep/lectures/${lectureId}`);
  revalidatePath("/teacher");
  revalidatePath("/admin");
  revalidatePath(`/admin/lectures/${lectureId}`);
}
