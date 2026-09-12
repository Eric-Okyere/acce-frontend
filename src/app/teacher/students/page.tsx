import { requireSessionWithToken } from "@/lib/guard";
import * as api from "@/lib/api";
import { Card, PageHeader, Badge } from "@/components/ui";
import ResetDeviceButton from "@/components/ResetDeviceButton";
import ResetPasswordButton from "@/components/ResetPasswordButton";
import LevelBreakdownTable from "@/components/LevelBreakdownTable";
import { levelLabel, parseLevelKey } from "@/lib/levels";
import type { UserRow, DeviceRow } from "@/lib/types";

function toCsv(
  students: UserRow[],
  subjectNamesByStudent: Map<string, string[]>,
  deviceByStudent: Map<string, DeviceRow | null>
): string {
  const header = ["Name", "Index number", "Level", "Offering", "Device status"];
  const escape = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const rows = students.map((s) => [
    s.name,
    s.index_number ?? "",
    levelLabel(s.level),
    (subjectNamesByStudent.get(s.id) ?? []).join("; "),
    deviceByStudent.get(s.id)?.device_id ? "Bound" : "Not yet bound",
  ]);
  return [header, ...rows].map((r) => r.map(escape).join(",")).join("\n");
}

// A teacher's own "Students" page — scoped to only the students (and
// course reps) offering one of the subjects THIS teacher teaches, never
// every student in the school (that broader view stays admin-only, see
// app/admin/students/page.tsx). Lets a teacher reset a student's device
// binding (e.g. a lost/spoiled/replaced phone) or password (a forgotten
// login code, shared straight back to the student's own WhatsApp/SMS number
// via ResetPasswordButton) directly, without routing either through an
// admin first. The backend (routes/devices.js, routes/users.js's
// PATCH /:id/reset-password, routes/subjects.js's "/:id/students") is the
// actual enforcement of this scoping; this page just reads from it.
export default async function TeacherStudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ level?: string }>;
}) {
  const { session, token } = await requireSessionWithToken(["TEACHER"]);
  const subjects = await api.listSubjects(token, { teacherId: session.sub });

  const rosters = await Promise.all(subjects.map((s) => api.listSubjectStudents(token, s.id)));

  // A student can be offering more than one of this teacher's subjects —
  // merge into one row per student, tracking every matching subject name
  // for display, rather than showing them once per subject.
  const studentById = new Map<string, UserRow>();
  const subjectNamesByStudent = new Map<string, string[]>();
  subjects.forEach((subject, i) => {
    for (const student of rosters[i]) {
      studentById.set(student.id, student);
      const names = subjectNamesByStudent.get(student.id) ?? [];
      names.push(subject.name);
      subjectNamesByStudent.set(student.id, names);
    }
  });
  const students = [...studentById.values()].sort((a, b) => a.name.localeCompare(b.name));

  const devices = await Promise.all(students.map((s) => api.getStudentDevice(token, s.id)));
  const deviceByStudent = new Map(students.map((s, i) => [s.id, devices[i]]));

  // "A level is selected and analysis is shown" — same ?level= link-based
  // filter as the admin dashboard (see app/admin/page.tsx), since this is
  // also a plain async Server Component. undefined = "All levels" (today's
  // whole-class view); otherwise the roster table and CSV export below both
  // narrow to just that level. A teacher can teach several levels at once,
  // so this is purely a display filter — it doesn't change who a teacher is
  // allowed to manage devices/passwords for.
  const { level: levelParam } = await searchParams;
  const selectedLevel = levelParam === undefined ? undefined : parseLevelKey(levelParam);
  const filtering = selectedLevel !== undefined;
  const filteredStudents = filtering ? students.filter((s) => s.level === selectedLevel) : students;

  return (
    <div>
      <PageHeader
        title="Students"
        subtitle="Everyone offering one of your courses. Reset a forgotten password (and send the new code straight to their WhatsApp or phone) or, if a phone was lost, damaged, or replaced, reset their device here so they can check in from the new one."
      />

      {subjects.length === 0 ? (
        <Card className="p-5">
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            You haven&apos;t been assigned to any subjects yet — ask an admin to assign you to one.
          </p>
        </Card>
      ) : (
        <>
          {/* A teacher can teach more than one level at once (a combined
              class, or several subjects at different levels) — click a
              level to filter the roster table and CSV export below to just
              that level. */}
          <Card className="p-5 mb-6">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <h2 className="font-semibold text-slate-900">
                Students by level{filtering ? ` — ${levelLabel(selectedLevel!)}` : ""}
              </h2>
              <a
                href={`data:text/csv;charset=utf-8,${encodeURIComponent(
                  toCsv(filteredStudents, subjectNamesByStudent, deviceByStudent)
                )}`}
                download={`students_${filtering ? levelLabel(selectedLevel!).replace(/\s+/g, "_") : "all_levels"}.csv`}
                className="text-sm text-blue-700 font-medium hover:underline"
              >
                Export CSV
              </a>
            </div>
            <LevelBreakdownTable
              linkBase="/teacher/students"
              selectedLevel={selectedLevel}
              columns={[{ key: "students", label: "Students", items: students }]}
            />
          </Card>

        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Student</th>
                <th className="text-left px-4 py-3 font-medium">Level</th>
                <th className="text-left px-4 py-3 font-medium">Offering</th>
                <th className="text-left px-4 py-3 font-medium">Device</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((s) => {
                const device = deviceByStudent.get(s.id) ?? null;
                return (
                  <tr key={s.id} className="border-t border-slate-100">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{s.name}</div>
                      <div className="text-xs text-slate-400">{s.index_number ?? ""}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{levelLabel(s.level)}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {(subjectNamesByStudent.get(s.id) ?? []).join(", ")}
                    </td>
                    <td className="px-4 py-3">
                      {device?.device_id ? (
                        <Badge tone="green">
                          Bound{device.reset_count > 0 ? ` (reset ×${device.reset_count})` : ""}
                        </Badge>
                      ) : (
                        <Badge tone="slate">Not yet bound</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap justify-end gap-2">
                        <ResetPasswordButton
                          userId={s.id}
                          userName={s.name}
                          userPhone={s.phone}
                          path="/teacher/students"
                        />
                        {device?.device_id && (
                          <ResetDeviceButton studentId={s.id} studentName={s.name} path="/teacher/students" />
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredStudents.length === 0 && (
            <p className="text-sm text-slate-500 px-4 py-6">
              {filtering
                ? "No students at this level are offering your course(s)."
                : "No students are offering your course(s) yet."}
            </p>
          )}
        </div>
        </>
      )}
    </div>
  );
}
