import { requireSessionWithToken } from "@/lib/guard";
import * as api from "@/lib/api";
import { createSubjectAction } from "@/app/actions/admin";
import { ActionForm } from "@/components/ActionForm";
import { Card, PageHeader, inputClass, Badge } from "@/components/ui";
import AssignTeacherForm from "./AssignTeacherForm";
import SetLevelForm from "./SetLevelForm";
import LevelBreakdownTable from "@/components/LevelBreakdownTable";
import { groupByLevel, levelLabel, parseLevelKey } from "@/lib/levels";

export default async function SubjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ level?: string }>;
}) {
  const { token } = await requireSessionWithToken(["ADMIN"]);
  const [programs, subjects, teachers] = await Promise.all([
    api.listPrograms(token),
    api.listSubjects(token),
    api.listUsersByRole(token, "TEACHER"),
  ]);
  const teacherName = (id: string | null) => teachers.find((t) => t.id === id)?.name ?? null;

  // "A level is selected and analysis is shown" — same ?level= link-based
  // filter as the admin dashboard, Students, Course reps, and teacher
  // Students pages, but scoped to the COURSE's own level (Subject.level, set
  // per course below) rather than any student's level (User.level) — these
  // two level fields are never conflated (see lib/levels.ts).
  const { level: levelParam } = await searchParams;
  const selectedLevel = levelParam === undefined ? undefined : parseLevelKey(levelParam);
  const filtering = selectedLevel !== undefined;
  const filteredSubjects = filtering ? subjects.filter((s) => s.level === selectedLevel) : subjects;

  return (
    <div>
      <PageHeader
        title="Courses"
        subtitle="Each course belongs to one program and is taught by one teacher."
      />

      <Card className="p-5 mb-6">
        <h2 className="font-semibold text-slate-900 mb-3">
          Courses by level{filtering ? ` — ${levelLabel(selectedLevel!)}` : ""}
        </h2>
        <LevelBreakdownTable
          linkBase="/admin/subjects"
          selectedLevel={selectedLevel}
          columns={[{ key: "courses", label: "Courses", items: subjects }]}
        />
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {programs.map((p) => {
            const inProgram = filteredSubjects.filter((s) => s.program_id === p.id);
            if (inProgram.length === 0) return null;
            // "Show all courses under each program according to levels" — one
            // sub-section per level (100 → 400, then "not set"), same fixed
            // order and grouping helper groupByLevel() uses everywhere else
            // in the app, nested under the program heading.
            const levelGroups = groupByLevel(inProgram);
            return (
              <div key={p.id}>
                <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">{p.name}</h3>
                <div className="space-y-5">
                  {levelGroups.map((group) => (
                    <div key={group.label}>
                      <h4 className="text-xs font-medium text-slate-500 mb-2 pl-2 border-l-2 border-slate-200">
                        {group.label} · {group.items.length} course{group.items.length === 1 ? "" : "s"}
                      </h4>
                      <div className="space-y-3">
                        {group.items.map((s) => (
                          <Card key={s.id} className="p-4">
                            <div className="flex items-start justify-between gap-3 flex-wrap">
                              <div>
                                <h5 className="font-medium text-slate-900">
                                  {s.name} {s.code && <span className="text-slate-400 font-normal">· {s.code}</span>}
                                </h5>
                                <div className="mt-2 flex items-center gap-2 flex-wrap">
                                  {s.level ? (
                                    <Badge tone="slate">Level {s.level}</Badge>
                                  ) : (
                                    <Badge tone="amber">No level set</Badge>
                                  )}
                                  {teacherName(s.teacher_id) ? (
                                    <Badge tone="blue">Taught by {teacherName(s.teacher_id)}</Badge>
                                  ) : (
                                    <Badge tone="amber">No teacher assigned</Badge>
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                <AssignTeacherForm subjectId={s.id} teachers={teachers} currentTeacherId={s.teacher_id} />
                                <SetLevelForm subjectId={s.id} currentLevel={s.level} />
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {filteredSubjects.length === 0 && (
            <p className="text-sm text-slate-500">{filtering ? "No courses at this level." : "No courses yet."}</p>
          )}
        </div>

        <Card className="p-5 h-fit">
          <h2 className="font-semibold text-slate-900 mb-3">Add a course</h2>
          <ActionForm action={createSubjectAction} submitLabel="Create course">
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
                <label className="block text-sm font-medium text-slate-700 mb-1">Course name</label>
                <input name="name" required className={inputClass} placeholder="e.g. Mathematics Education" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Level</label>
                <select name="level" required defaultValue="" className={inputClass}>
                  <option value="" disabled>
                    Select a level…
                  </option>
                  <option value="100">100</option>
                  <option value="200">200</option>
                  <option value="300">300</option>
                  <option value="400">400</option>
                </select>
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
