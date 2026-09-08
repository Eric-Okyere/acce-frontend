"use server";

import { revalidatePath } from "next/cache";
import { requireSessionWithToken } from "@/lib/guard";
import type { FormState } from "@/components/ActionForm";
import * as api from "@/lib/api";
import { ApiError } from "@/lib/api";
import { DEFAULT_GEOFENCE_RADIUS_METERS } from "@/lib/constants";

function str(fd: FormData, key: string): string {
  return String(fd.get(key) ?? "").trim();
}

export async function createProgramAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const { token } = await requireSessionWithToken(["ADMIN"]);
  const name = str(fd, "name");
  const key = str(fd, "key").toUpperCase().replace(/[^A-Z0-9_]/g, "_");
  const description = str(fd, "description");
  if (!name || !key) return { error: "Name and key are required." };

  try {
    const program = await api.createProgram(token, { name, key, description: description || null });
    revalidatePath("/admin/programs");
    return { success: `Program "${program.name}" created.` };
  } catch (e) {
    return { error: e instanceof ApiError ? e.message : "Could not create program (is the key unique?)." };
  }
}

export async function createSubjectAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const { token } = await requireSessionWithToken(["ADMIN"]);
  const programId = str(fd, "programId");
  const name = str(fd, "name");
  const code = str(fd, "code");
  const teacherId = str(fd, "teacherId");
  if (!programId || !name) return { error: "Program and subject name are required." };

  try {
    const subject = await api.createSubject(token, { programId, name, code: code || null, teacherId: teacherId || null });
    revalidatePath("/admin/subjects");
    return { success: `Subject "${subject.name}" created.` };
  } catch (e) {
    return {
      error:
        e instanceof ApiError
          ? e.message
          : "Could not create subject (a subject with this name may already exist in the program).",
    };
  }
}

export async function assignTeacherAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const { token } = await requireSessionWithToken(["ADMIN"]);
  const subjectId = str(fd, "subjectId");
  const teacherId = str(fd, "teacherId");
  if (!subjectId) return { error: "Missing subject." };

  try {
    await api.assignTeacher(token, subjectId, teacherId || null);
    revalidatePath("/admin/subjects");
    return { success: "Teacher assignment updated." };
  } catch (e) {
    return { error: e instanceof ApiError ? e.message : "Could not update the teacher assignment." };
  }
}

export async function createTeacherAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const { token } = await requireSessionWithToken(["ADMIN"]);
  const name = str(fd, "name");
  const phone = str(fd, "phone");
  if (!name || !phone) return { error: "Name and phone number are required." };

  try {
    const { user: teacher, tempPassword } = await api.createUser(token, { role: "TEACHER", name, phone });
    revalidatePath("/admin/teachers");
    return {
      success: `Teacher "${teacher.name}" registered. Login phone: ${teacher.phone} · Temporary password: ${tempPassword} — share this with them; they can change it after signing in.`,
    };
  } catch (e) {
    return { error: e instanceof ApiError ? e.message : "Could not register teacher." };
  }
}

export async function createCourseRepAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const { token } = await requireSessionWithToken(["ADMIN"]);
  const name = str(fd, "name");
  const phone = str(fd, "phone");
  const programId = str(fd, "programId");
  if (!name || !phone || !programId) return { error: "Name, phone number, and program are required." };

  try {
    const { user: rep, tempPassword } = await api.createUser(token, { role: "COURSE_REP", name, phone, programId });
    revalidatePath("/admin/course-reps");
    return {
      success: `Course rep "${rep.name}" registered. Login phone: ${rep.phone} · Temporary password: ${tempPassword}`,
    };
  } catch (e) {
    return { error: e instanceof ApiError ? e.message : "Could not register course rep." };
  }
}

export async function createStudentAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const { token } = await requireSessionWithToken(["ADMIN"]);
  const name = str(fd, "name");
  const phone = str(fd, "phone");
  const indexNumber = str(fd, "indexNumber");
  const programId = str(fd, "programId");
  if (!name || !phone || !programId) return { error: "Name, phone number, and program are required." };

  try {
    const { user: student, tempPassword } = await api.createUser(token, {
      role: "STUDENT",
      name,
      phone,
      programId,
      indexNumber: indexNumber || undefined,
    });
    revalidatePath("/admin/students");
    return {
      success: `Student "${student.name}" registered. Login phone: ${student.phone} · Temporary password: ${tempPassword}`,
    };
  } catch (e) {
    return {
      error: e instanceof ApiError ? e.message : "Could not register student (index number may already be in use).",
    };
  }
}

export async function createHallAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const { token } = await requireSessionWithToken(["ADMIN"]);
  const name = str(fd, "name");
  const lat = Number(str(fd, "latitude"));
  const lng = Number(str(fd, "longitude"));
  const radius = Number(str(fd, "radiusMeters")) || DEFAULT_GEOFENCE_RADIUS_METERS;

  if (!name) return { error: "Hall name is required." };

  try {
    const hall = await api.createHall(token, { name, latitude: lat, longitude: lng, radiusMeters: radius });
    revalidatePath("/admin/halls");
    return { success: `Lecture hall "${hall.name}" created. Its QR code is ready to download/print below.` };
  } catch (e) {
    return { error: e instanceof ApiError ? e.message : "Could not create hall (name may already be in use)." };
  }
}

export async function updateHallLocationAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const { token } = await requireSessionWithToken(["ADMIN"]);
  const hallId = str(fd, "hallId");
  const lat = Number(str(fd, "latitude"));
  const lng = Number(str(fd, "longitude"));
  const radius = Number(str(fd, "radiusMeters"));
  if (!hallId) return { error: "Missing hall." };

  try {
    await api.updateHallLocation(token, hallId, {
      latitude: lat,
      longitude: lng,
      radiusMeters: Number.isFinite(radius) && radius > 0 ? radius : undefined,
    });
    revalidatePath("/admin/halls");
    return { success: "Hall location updated. Its QR code has been re-signed — reprint and replace the old one." };
  } catch (e) {
    return { error: e instanceof ApiError ? e.message : "Enter a valid latitude/longitude." };
  }
}

export async function toggleHallActiveAction(hallId: string, isActive: boolean): Promise<void> {
  const { token } = await requireSessionWithToken(["ADMIN"]);
  await api.setHallActive(token, hallId, isActive);
  revalidatePath("/admin/halls");
}

export async function toggleSubjectActiveAction(subjectId: string, isActive: boolean): Promise<void> {
  const { token } = await requireSessionWithToken(["ADMIN"]);
  await api.setSubjectActive(token, subjectId, isActive);
  revalidatePath("/admin/subjects");
}

export async function toggleUserActiveAction(userId: string, isActive: boolean, path: string): Promise<void> {
  const { token } = await requireSessionWithToken(["ADMIN"]);
  await api.setUserActive(token, userId, isActive);
  revalidatePath(path);
}

export async function resetDeviceAction(studentId: string): Promise<void> {
  const { token } = await requireSessionWithToken(["ADMIN"]);
  await api.resetDevice(token, studentId);
  revalidatePath("/admin/students");
}
