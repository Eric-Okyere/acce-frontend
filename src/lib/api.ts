// Typed fetch client for the Express/MongoDB backend. Every function takes the
// caller's raw Bearer token (from lib/auth.ts's getRawToken()) as its first
// argument and forwards it as `Authorization: Bearer <token>` — the backend
// is the only thing that ever talks to MongoDB; this frontend is purely an
// API consumer now.
import type {
  ProgramRow,
  SubjectRow,
  UserRow,
  LectureHallRow,
  DeviceRow,
  LectureRow,
  AuditLogRow,
  RosterEntry,
  StudentHistoryEntry,
  ScanCandidate,
  SubjectReport,
  Role,
} from "@/lib/types";

const API_BASE = (process.env.BACKEND_API_URL ?? "http://localhost:4000/api").replace(/\/$/, "");

export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

async function request<T>(
  path: string,
  opts: { method?: string; token?: string | null; body?: unknown } = {}
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: opts.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}),
    },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    cache: "no-store",
  });

  const json = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(res.status, json?.error ?? `Request to ${path} failed (${res.status}).`, json?.code);
  }
  return json as T;
}

// ---- Auth ----
export function login(phone: string, password: string) {
  return request<{ token: string; user: UserRow }>("/auth/login", { method: "POST", body: { phone, password } });
}
export function getMe(token: string) {
  return request<UserRow>("/auth/me", { token });
}
export function changePassword(
  token: string,
  input: { currentPassword: string; newPassword: string; confirmPassword: string }
) {
  return request<{ success: true }>("/auth/change-password", { method: "POST", token, body: input });
}
// Public student self-registration — no token, since the person doesn't have
// an account yet. Returns a token immediately (same shape as login) so the
// caller can sign them straight in without a separate login step.
export function registerStudent(input: {
  name: string;
  phone: string;
  password: string;
  confirmPassword: string;
  programId: string;
  indexNumber: string;
}) {
  return request<{ token: string; user: UserRow }>("/auth/register-student", { method: "POST", body: input });
}

// ---- Programs ----
// Public, unauthenticated — used by the student self-registration page, which
// runs before the person has any token. Deliberately minimal (id + name).
export function listProgramsPublic() {
  return request<{ id: string; name: string }[]>("/programs/public");
}
export function listPrograms(token: string) {
  return request<ProgramRow[]>("/programs", { token });
}
export function createProgram(token: string, input: { name: string; key: string; description?: string | null }) {
  return request<ProgramRow>("/programs", { method: "POST", token, body: input });
}

// ---- Subjects ----
export function listSubjects(token: string, opts?: { programId?: string; teacherId?: string }) {
  const params = new URLSearchParams();
  if (opts?.programId) params.set("programId", opts.programId);
  if (opts?.teacherId) params.set("teacherId", opts.teacherId);
  const qs = params.toString();
  return request<SubjectRow[]>(`/subjects${qs ? `?${qs}` : ""}`, { token });
}
export function createSubject(
  token: string,
  input: { programId: string; name: string; code?: string | null; teacherId?: string | null }
) {
  return request<SubjectRow>("/subjects", { method: "POST", token, body: input });
}
export function assignTeacher(token: string, subjectId: string, teacherId: string | null) {
  return request<SubjectRow>(`/subjects/${subjectId}/teacher`, { method: "PATCH", token, body: { teacherId } });
}
export function setSubjectActive(token: string, subjectId: string, isActive: boolean) {
  return request<SubjectRow>(`/subjects/${subjectId}/active`, { method: "PATCH", token, body: { isActive } });
}

// ---- Users ----
export function listUsersByRole(token: string, role: Role, opts?: { programId?: string }) {
  const params = new URLSearchParams({ role });
  if (opts?.programId) params.set("programId", opts.programId);
  return request<UserRow[]>(`/users?${params.toString()}`, { token });
}
export function createUser(
  token: string,
  input: { role: Role; name: string; phone: string; programId?: string; indexNumber?: string }
) {
  return request<{ user: UserRow; tempPassword: string }>("/users", { method: "POST", token, body: input });
}
export function setUserActive(token: string, userId: string, isActive: boolean) {
  return request<UserRow>(`/users/${userId}/active`, { method: "PATCH", token, body: { isActive } });
}
export function resetUserPassword(token: string, userId: string) {
  return request<{ user: UserRow; tempPassword: string }>(`/users/${userId}/reset-password`, {
    method: "PATCH",
    token,
  });
}
export function setUserIndexNumber(token: string, userId: string, indexNumber: string) {
  return request<{ user: UserRow }>(`/users/${userId}/index-number`, {
    method: "PATCH",
    token,
    body: { indexNumber },
  });
}

// ---- Lecture halls ----
export function listHalls(token: string) {
  return request<LectureHallRow[]>("/halls", { token });
}
export function createHall(
  token: string,
  input: { name: string; latitude: number; longitude: number; radiusMeters?: number }
) {
  return request<LectureHallRow>("/halls", { method: "POST", token, body: input });
}
export function updateHallLocation(
  token: string,
  hallId: string,
  input: { latitude: number; longitude: number; radiusMeters?: number }
) {
  return request<LectureHallRow>(`/halls/${hallId}/location`, { method: "PATCH", token, body: input });
}
export function setHallActive(token: string, hallId: string, isActive: boolean) {
  return request<LectureHallRow>(`/halls/${hallId}/active`, { method: "PATCH", token, body: { isActive } });
}
export function getHallQr(token: string, hallId: string) {
  return request<{ dataUrl: string; hallName: string }>(`/halls/${hallId}/qr`, { token });
}

// ---- Devices ----
export function getMyDevice(token: string) {
  return request<DeviceRow | null>("/devices/me", { token });
}
export function getStudentDevice(token: string, studentId: string) {
  return request<DeviceRow | null>(`/devices/${studentId}`, { token });
}
export function resetDevice(token: string, studentId: string) {
  return request<{ success: true }>(`/devices/${studentId}/reset`, { method: "POST", token });
}

// ---- Lectures ----
export function listMyLecturesAsRep(token: string) {
  return request<LectureRow[]>("/lectures/mine", { token });
}
export function listUpcomingLecturesForMyProgram(token: string) {
  return request<LectureRow[]>("/lectures/for-program/upcoming", { token });
}
export function getLecture(token: string, lectureId: string) {
  return request<LectureRow>(`/lectures/${lectureId}`, { token });
}
export function getLectureRoster(token: string, lectureId: string) {
  return request<RosterEntry[]>(`/lectures/${lectureId}/roster`, { token });
}
export function createLecture(
  token: string,
  input: { subjectId: string; lectureHallId: string; title?: string; startTime: string; endTime: string }
) {
  return request<LectureRow>("/lectures", { method: "POST", token, body: input });
}
export function cancelLecture(token: string, lectureId: string) {
  return request<LectureRow>(`/lectures/${lectureId}/cancel`, { method: "PATCH", token });
}

// ---- Attendance ----
export interface ScanInput {
  lectureId: string;
  qrToken: string;
  deviceId: string;
  // Required by the backend on check-in only (ignored on check-out) — the
  // student re-types their own index number as an extra "prove it's you"
  // step. See routes/attendance.js on the backend.
  indexNumber: string;
  lat: number;
  lng: number;
  accuracy: number | null;
}
export function checkIn(token: string, input: ScanInput) {
  return request<{ success: string }>("/attendance/check-in", { method: "POST", token, body: input });
}
export function checkOut(token: string, input: ScanInput) {
  return request<{ success: string }>("/attendance/check-out", { method: "POST", token, body: input });
}
export function resolveScan(token: string, qrToken: string) {
  return request<{ error?: string; hallName?: string; candidates?: ScanCandidate[] }>("/attendance/resolve-scan", {
    method: "POST",
    token,
    body: { qrToken },
  });
}
export function getMyAttendanceHistory(token: string) {
  return request<StudentHistoryEntry[]>("/attendance/history/me", { token });
}

// ---- Reports ----
export function getSubjectReport(token: string, subjectId: string) {
  return request<SubjectReport>(`/reports/subjects/${subjectId}`, { token });
}

// ---- Audit ----
export function listRecentAudit(token: string, limit = 100) {
  return request<AuditLogRow[]>(`/audit?limit=${limit}`, { token });
}
