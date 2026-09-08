"use server";

import { revalidatePath } from "next/cache";
import { requireSessionWithToken } from "@/lib/guard";
import type { FormState } from "@/components/ActionForm";
import * as api from "@/lib/api";
import { ApiError } from "@/lib/api";

function str(fd: FormData, key: string): string {
  return String(fd.get(key) ?? "").trim();
}

export async function createLectureAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const { token } = await requireSessionWithToken(["COURSE_REP"]);

  const subjectId = str(fd, "subjectId");
  const lectureHallId = str(fd, "lectureHallId");
  const title = str(fd, "title");
  const startTime = str(fd, "startTime");
  const endTime = str(fd, "endTime");

  if (!subjectId || !lectureHallId || !startTime || !endTime) {
    return { error: "Subject, hall, start time, and end time are all required." };
  }

  try {
    await api.createLecture(token, {
      subjectId,
      lectureHallId,
      title: title || undefined,
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
    });
    revalidatePath("/rep");
    return { success: "Lecture scheduled. Students can check in up to 2 hours before it starts." };
  } catch (e) {
    return { error: e instanceof ApiError ? e.message : "Could not schedule the lecture." };
  }
}

export async function cancelLectureAction(lectureId: string): Promise<void> {
  const { token } = await requireSessionWithToken(["COURSE_REP"]);
  try {
    await api.cancelLecture(token, lectureId);
  } catch {
    // Ownership is enforced server-side (404 if this isn't the rep's own lecture) — nothing to surface here.
  }
  revalidatePath("/rep");
  revalidatePath(`/rep/lectures/${lectureId}`);
}
