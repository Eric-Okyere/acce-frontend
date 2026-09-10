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

// Course reps are no longer registered directly (see routes/users.js) —
// instead an admin promotes an existing student, assigning them one or more
// subjects they'll be responsible for. Handles both the first promotion and
// changing an already-promoted rep's subjects (same backend route either
// way — it always replaces the full list, not an add/remove diff).
export async function promoteCourseRepAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const { token } = await requireSessionWithToken(["ADMIN"]);
  const studentId = str(fd, "studentId");
  const subjectIds = fd.getAll("subjectIds").map(String).filter(Boolean);
  if (!studentId || subjectIds.length === 0) {
    return { error: "Pick the student and at least one subject they'll be responsible for." };
  }

  try {
    const { user: rep } = await api.promoteToCourseRep(token, studentId, subjectIds);
    revalidatePath("/admin/course-reps");
    revalidatePath("/admin/students");
    return {
      success: `${rep.name} is now a course rep — they can sign in with their existing password and schedule lectures for their assigned subject${subjectIds.length > 1 ? "s" : ""}.`,
    };
  } catch (e) {
    return { error: e instanceof ApiError ? e.message : "Could not promote this student to course rep." };
  }
}

// Same backend route as above, used by the inline "assigned subjects" control
// on an existing course rep's card rather than the full promotion form.
export async function reassignCourseRepSubjectsAction(
  userId: string,
  subjectIds: string[],
  path: string
): Promise<{ error?: string; success?: boolean }> {
  const { token } = await requireSessionWithToken(["ADMIN"]);
  if (subjectIds.length === 0) return { error: "Pick at least one subject." };
  try {
    await api.promoteToCourseRep(token, userId, subjectIds);
    revalidatePath(path);
    return { success: true };
  } catch (e) {
    return { error: e instanceof ApiError ? e.message : "Could not update this course rep's assigned subjects." };
  }
}

export async function demoteCourseRepAction(userId: string, path: string): Promise<{ error?: string }> {
  const { token } = await requireSessionWithToken(["ADMIN"]);
  try {
    await api.demoteToStudent(token, userId);
    revalidatePath(path);
    revalidatePath("/admin/students");
    return {};
  } catch (e) {
    return { error: e instanceof ApiError ? e.message : "Could not revert this course rep to a student." };
  }
}

// Backfills/corrects the index number on an already-registered user — mainly
// for course reps that existed before index numbers were required for that
// role, so they can be brought up to the point where they can check in
// without re-creating their account.
export async function setIndexNumberAction(
  userId: string,
  indexNumber: string,
  path: string
): Promise<{ error?: string; success?: boolean }> {
  const { token } = await requireSessionWithToken(["ADMIN"]);
  const trimmed = indexNumber.trim();
  if (!trimmed) return { error: "Enter an index number." };
  try {
    await api.setUserIndexNumber(token, userId, trimmed);
    revalidatePath(path);
    return { success: true };
  } catch (e) {
    return { error: e instanceof ApiError ? e.message : "Could not save the index number." };
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

// path defaults to /admin/students for backwards compatibility with existing
// callers; the course-reps admin page (whose reps now also have a device
// binding, since they check in the same way a student does) passes its own.
export async function resetDeviceAction(studentId: string, path: string = "/admin/students"): Promise<void> {
  const { token } = await requireSessionWithToken(["ADMIN"]);
  await api.resetDevice(token, studentId);
  revalidatePath(path);
}

// Issues a fresh temporary password for a teacher / course rep / student and
// hands it straight back to the admin UI to display — see the comment on the
// backend route (routes/users.js, PATCH /:id/reset-password) for why this
// always issues a new one rather than revealing the original.
export async function resetUserPasswordAction(
  userId: string,
  path: string
): Promise<{ tempPassword?: string; error?: string }> {
  const { token } = await requireSessionWithToken(["ADMIN"]);
  try {
    const { tempPassword } = await api.resetUserPassword(token, userId);
    revalidatePath(path);
    return { tempPassword };
  } catch (e) {
    return { error: e instanceof ApiError ? e.message : "Could not reset the password." };
  }
}
