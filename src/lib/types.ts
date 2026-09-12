// Shapes returned by the Express/MongoDB backend's JSON API. Field names are
// deliberately snake_case (program_id, is_active, check_in_at, ...) to match
// the backend's Mongoose models — see backend/src/models/shared.ts for why.
// Every date field arrives as an ISO-8601 string (fetch's res.json() never
// produces a Date instance) already carrying its own "Z" — do NOT append one
// when parsing, unlike the old SQLite build.

export type Role = "ADMIN" | "TEACHER" | "COURSE_REP" | "STUDENT";

export interface ProgramRow {
  id: string;
  key: string;
  name: string;
  description: string | null;
  source_url: string | null;
  created_at: string;
}

export interface SubjectRow {
  id: string;
  program_id: string;
  name: string;
  code: string | null;
  // Year/level this course belongs to — 100 through 400. Null only for
  // subjects created before this field existed; every new subject requires
  // one (see routes/subjects.js).
  level: number | null;
  teacher_id: string | null;
  is_active: boolean;
  created_at: string;
}

export interface UserRow {
  id: string;
  role: Role;
  name: string;
  phone: string;
  index_number: string | null;
  program_id: string | null;
  // The student's own year/level — 100 through 400. Distinct from a
  // subject's own `level` (SubjectRow.level) — this is which year the
  // student is in. Null only for accounts that predate this field.
  level: number | null;
  // Only meaningful for role COURSE_REP — the subject(s) they're responsible
  // for scheduling lectures in. Set by an admin promoting a student (see
  // api.promoteToCourseRep); a course rep can be assigned one or more
  // subjects. Empty for every other role and for a course rep not yet
  // assigned any.
  responsible_subject_ids: string[];
  // The course(s) this STUDENT (or promoted course rep) is offering — chosen
  // at registration (see app/register/RegisterForm.tsx) or edited later by
  // an admin from the Students page. This is what scopes a teacher's
  // roster/report to only the students actually taking their subject. Empty
  // means the account predates this feature (or an admin cleared it) — the
  // backend then falls back to treating them as offering every subject in
  // their program, same as before this feature existed.
  enrolled_subject_ids: string[];
  is_active: boolean;
  must_reset_password: boolean;
  created_at: string;
  updated_at: string;
}

export interface LectureHallRow {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
  qr_token: string;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
}

export interface DeviceRow {
  id: string;
  student_id: string;
  device_id: string;
  user_agent: string | null;
  registered_at: string;
  reset_count: number;
  last_reset_at: string | null;
  last_reset_by: string | null;
}

export type LectureStatus = "SCHEDULED" | "ONGOING" | "COMPLETED" | "CANCELLED";
export type LecturePhase = "CANCELLED" | "UPCOMING" | "ONGOING" | "ENDED";

export interface LectureRow {
  id: string;
  subject_id: string;
  lecture_hall_id: string;
  course_rep_id: string;
  title: string | null;
  start_time: string;
  end_time: string;
  checkout_grace_minutes: number;
  status: LectureStatus;
  created_at: string;
}

export interface AttendanceRecordRow {
  id: string;
  lecture_id: string;
  student_id: string;
  check_in_at: string | null;
  check_out_at: string | null;
  status: "PRESENT" | "INCOMPLETE" | "ABSENT";
}

export interface AuditLogRow {
  id: string;
  actor_id: string | null;
  actor_name: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  metadata: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

export interface RosterEntry {
  studentId: string;
  studentName: string;
  indexNumber: string | null;
  // The student's own level (100–400, or null) — lets a lecture's roster be
  // grouped by level, since one subject can have students across several
  // levels at once.
  level: number | null;
  status: "PRESENT" | "INCOMPLETE" | "ABSENT";
  checkInAt: string | null;
  checkOutAt: string | null;
}

export interface StudentHistoryEntry {
  lectureId: string;
  subjectName: string;
  hallName: string;
  startTime: string;
  endTime: string;
  status: "PRESENT" | "INCOMPLETE" | "ABSENT";
  checkInAt: string | null;
  checkOutAt: string | null;
}

export interface ScanCandidate {
  lectureId: string;
  subjectName: string;
  startTime: string;
  endTime: string;
  phase: LecturePhase;
  checkedIn: boolean;
  checkedOut: boolean;
}

export interface LectureStat {
  lectureId: string;
  title: string | null;
  startTime: string;
  endTime: string;
  hallName: string;
  present: number;
  incomplete: number;
  absent: number;
  total: number;
  rate: number;
}

export interface StudentStat {
  studentId: string;
  name: string;
  indexNumber: string | null;
  // The student's own level (100–400, or null) — lets the subject's
  // attendance table be grouped by level (see SubjectReportView.tsx).
  level: number | null;
  present: number;
  incomplete: number;
  absent: number;
  totalLectures: number;
  rate: number;
}

// A student's own attendance for one course they offer — "present X out of Y
// lectures held so far". See GET /reports/me/courses.
export interface MyCourseStat {
  subjectId: string;
  subjectName: string;
  present: number;
  total: number;
  rate: number;
}

export interface SubjectReport {
  subjectId: string;
  subjectName: string;
  programId: string;
  lectureStats: LectureStat[];
  studentStats: StudentStat[];
  overallRate: number;
  totalLecturesHeld: number;
  rosterSize: number;
}
