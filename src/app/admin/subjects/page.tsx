import { requireSessionWithToken } from "@/lib/guard";
import * as api from "@/lib/api";
import { createSubjectAction } from "@/app/actions/admin";
import { ActionForm } from "@/components/ActionForm";
import { Card, PageHeader, inputClass, Badge } from "@/components/ui";
import AssignTeacherForm from "./AssignTeacherForm";

export default async function SubjectsPage() {
  const { token } = await requireSessionWithToken(["ADMIN"]);
  const [programs, subjects, teachers] = await Promise.all([
    api.listPrograms(token),
    api.listSubjects(token),
    api.listUsersByRole(token, "TEACHER"),
  ]);
  const programName = (id: string) => programs.find((p) => p.id === id)?.name ?? "—";
  const teacherName = (id: string | null) => teachers.find((t) => t.id === id)?.name ?? null;

  return (
    <div>
      <PageHeader
        title="Subjects"
        subtitle="Each subject belongs to one program and is taught by one teacher."
      />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {subjects.map((s) => (
            <Card key={s.id} className="p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <h3 className="font-medium text-slate-900">
                    {s.name} {s.code && <span className="text-slate-400 font-normal">· {s.code}</span>}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">{programName(s.program_id)}</p>
                  <div className="mt-2">
                    {teacherName(s.teacher_id) ? (
                      <Badge tone="blue">Taught by {teacherName(s.teacher_id)}</Badge>
                    ) : (
                      <Badge tone="amber">No teacher assigned</Badge>
                    )}
                  </div>
                </div>
                <AssignTeacherForm subjectId={s.id} teachers={teachers} currentTeacherId={s.teacher_id} />
              </div>
            </Card>
          ))}
          {subjects.length === 0 && <p className="text-sm text-slate-500">No subjects yet.</p>}
        </div>

        <Card className="p-5 h-fit">
          <h2 className="font-semibold text-slate-900 mb-3">Add a subject</h2>
          <ActionForm action={createSubjectAction} submitLabel="Create subject">
            <div className="space-y-3">
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
                <label className="block text-sm font-medium text-slate-700 mb-1">Subject name</label>
                <input name="name" required className={inputClass} placeholder="e.g. Mathematics Education" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Code (optional)</label>
                <input name="code" className={inputClass} placeholder="e.g. JHS-MATH-201" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Teacher (optional — can assign later)</label>
                <select name="teacherId" className={inputClass}>
                  <option value="">Unassigned</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} — {t.phone}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </ActionForm>
        </Card>
      </div>
    </div>
  );
}
