import { requireSessionWithToken } from "@/lib/guard";
import * as api from "@/lib/api";
import { Card, PageHeader, Badge } from "@/components/ui";
import ResetDeviceButton from "@/components/ResetDeviceButton";
import ResetPasswordButton from "@/components/ResetPasswordButton";
import type { UserRow } from "@/lib/types";

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
export default async function TeacherStudentsPage() {
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

  return (
    <div>
      <PageHeader
        title="Students"
        subtitle="Everyone offering one of your subjects. Reset a forgotten password (and send the new code straight to their WhatsApp or phone) or, if a phone was lost, damaged, or replaced, reset their device here so they can check in from the new one."
      />

      {subjects.length === 0 ? (
        <Card className="p-5">
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            You haven&apos;t been assigned to any subjects yet — ask an admin to assign you to one.
          </p>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Student</th>
                <th className="text-left px-4 py-3 font-medium">Offering</th>
                <th className="text-left px-4 py-3 font-medium">Device</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => {
                const device = deviceByStudent.get(s.id) ?? null;
                return (
                  <tr key={s.id} className="border-t border-slate-100">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{s.name}</div>
                      <div className="text-xs text-slate-400">{s.index_number ?? ""}</div>
                    </td>
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
          {students.length === 0 && (
            <p className="text-sm text-slate-500 px-4 py-6">
              No students are offering your subject(s) yet.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
