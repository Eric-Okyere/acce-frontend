import { requireSessionWithToken } from "@/lib/guard";
import * as api from "@/lib/api";
import { createStudentAction } from "@/app/actions/admin";
import { ActionForm } from "@/components/ActionForm";
import { Card, PageHeader, inputClass } from "@/components/ui";
import StudentRow from "@/components/StudentRow";

export default async function StudentsPage() {
  const { token } = await requireSessionWithToken(["ADMIN"]);
  const [students, programs, subjects] = await Promise.all([
    api.listUsersByRole(token, "STUDENT"),
    api.listPrograms(token),
    api.listSubjects(token),
  ]);
  const devices = await Promise.all(students.map((s) => api.getStudentDevice(token, s.id)));
  const deviceByStudent = new Map(students.map((s, i) => [s.id, devices[i]]));

  return (
    <div>
      <PageHeader
        title="Students"
        subtitle="Every student is registered under a program and the course(s) they picked at sign-up. If a student's phone is lost or replaced, reset their device here so they can check in from the new one."
      />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Student</th>
                  <th className="text-left px-4 py-3 font-medium">Program / courses</th>
                  <th className="text-left px-4 py-3 font-medium">Device</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-right px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <StudentRow
                    key={s.id}
                    student={s}
                    programs={programs}
                    subjects={subjects}
                    device={deviceByStudent.get(s.id) ?? null}
                    path="/admin/students"
                  />
                ))}
              </tbody>
            </table>
            {students.length === 0 && (
              <p className="text-sm text-slate-500 px-4 py-6">No students registered yet.</p>
            )}
          </div>
        </div>

        <Card className="p-5 h-fit">
          <h2 className="font-semibold text-slate-900 mb-3">Register a student</h2>
          <ActionForm action={createStudentAction} submitLabel="Register student">
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full name</label>
                <input name="name" required className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone number</label>
                <input name="phone" required type="tel" className={inputClass} placeholder="024 000 0000" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Index number (optional)</label>
                <input name="indexNumber" className={inputClass} placeholder="ACCE/JHS/24/001" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Program</label>
                <select name="programId" required className={inputClass}>
                  <option value="">Select a program…</option>
                  {programs.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Level (optional)</label>
                <select name="level" defaultValue="" className={inputClass}>
                  <option value="">Not set</option>
                  <option value="100">100</option>
                  <option value="200">200</option>
                  <option value="300">300</option>
                  <option value="400">400</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Courses offered (optional)
                </label>
                <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-lg px-3 py-2 space-y-2">
                  {subjects.length === 0 ? (
                    <p className="text-xs text-slate-400">No courses set up yet.</p>
                  ) : (
                    programs.map((p) => {
                      const inProgram = subjects.filter((s) => s.program_id === p.id);
                      if (inProgram.length === 0) return null;
                      return (
                        <div key={p.id}>
                          <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">{p.name}</p>
                          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-0.5">
                            {inProgram.map((s) => (
                              <label key={s.id} className="flex items-center gap-1.5 text-xs text-slate-700">
                                <input
                                  type="checkbox"
                                  name="subjectIds"
                                  value={s.id}
                                  className="rounded border-slate-300"
                                />
                                {s.name}
                              </label>
                            ))}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Only tick courses from the program you selected above. Leaving none checked counts this student as
                  offering every course in their program.
                </p>
              </div>
            </div>
          </ActionForm>
        </Card>
      </div>
    </div>
  );
}
