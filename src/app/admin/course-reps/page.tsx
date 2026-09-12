import { requireSessionWithToken } from "@/lib/guard";
import * as api from "@/lib/api";
import { toggleUserActiveAction } from "@/app/actions/admin";
import { Card, PageHeader, Badge, secondaryButtonClass } from "@/components/ui";
import ResetPasswordButton from "@/components/ResetPasswordButton";
import ResetDeviceButton from "@/components/ResetDeviceButton";
import SetIndexNumberButton from "@/components/SetIndexNumberButton";
import AssignSubjectButton from "@/components/AssignSubjectButton";
import DemoteToStudentButton from "@/components/DemoteToStudentButton";
import PromoteCourseRepPanel from "@/components/PromoteCourseRepPanel";
import LevelBreakdownTable from "@/components/LevelBreakdownTable";
import { levelLabel, parseLevelKey } from "@/lib/levels";

export default async function CourseRepsPage({
  searchParams,
}: {
  searchParams: Promise<{ level?: string }>;
}) {
  const { token } = await requireSessionWithToken(["ADMIN"]);
  const [reps, students, programs, subjects] = await Promise.all([
    api.listUsersByRole(token, "COURSE_REP"),
    api.listUsersByRole(token, "STUDENT"),
    api.listPrograms(token),
    api.listSubjects(token),
  ]);
  // Course reps attend lectures in their own program just like students do
  // (see routes/attendance.js) — so, like students, their phone gets bound
  // as a device on first check-in and can need an admin reset.
  const devices = await Promise.all(reps.map((r) => api.getStudentDevice(token, r.id)));
  const deviceByRep = new Map(reps.map((r, i) => [r.id, devices[i]]));
  const programName = (id: string | null) => programs.find((p) => p.id === id)?.name ?? "—";
  const subjectName = (id: string) => subjects.find((s) => s.id === id)?.name ?? "—";

  // "A level is selected and analysis is shown" — same ?level= link-based
  // filter as the admin dashboard, Students page, and teacher Students page.
  const { level: levelParam } = await searchParams;
  const selectedLevel = levelParam === undefined ? undefined : parseLevelKey(levelParam);
  const filtering = selectedLevel !== undefined;
  const filteredReps = filtering ? reps.filter((r) => r.level === selectedLevel) : reps;

  return (
    <div>
      <PageHeader
        title="Course reps"
        subtitle="Course reps are promoted from existing student accounts and each schedule upcoming lectures for the subject(s) they're responsible for. Like any student, they also check in to attend lectures themselves."
      />

      <Card className="p-5 mb-6">
        <h2 className="font-semibold text-slate-900 mb-3">
          Course reps by level{filtering ? ` — ${levelLabel(selectedLevel!)}` : ""}
        </h2>
        <LevelBreakdownTable
          linkBase="/admin/course-reps"
          selectedLevel={selectedLevel}
          columns={[{ key: "courseReps", label: "Course reps", items: reps }]}
        />
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {filteredReps.map((r) => {
            const device = deviceByRep.get(r.id);
            const repProgramSubjects = subjects.filter((s) => s.program_id === r.program_id);
            return (
              <Card key={r.id} className="p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <h3 className="font-medium text-slate-900">{r.name}</h3>
                    <p className="text-sm text-slate-500">{r.phone}</p>
                    <div className="flex flex-wrap items-center gap-1 mt-2">
                      <Badge tone="blue">{programName(r.program_id)}</Badge>
                      {r.level ? (
                        <Badge tone="slate">Level {r.level}</Badge>
                      ) : (
                        <span className="text-xs text-slate-400" title="No level on file yet.">
                          (no level)
                        </span>
                      )}
                      {r.responsible_subject_ids.length > 0 ? (
                        r.responsible_subject_ids.map((id) => (
                          <Badge key={id} tone="green">
                            {subjectName(id)}
                          </Badge>
                        ))
                      ) : (
                        <Badge tone="amber">No subject assigned yet</Badge>
                      )}
                      {!r.is_active && <Badge tone="red">Deactivated</Badge>}
                      {device?.device_id ? (
                        <Badge tone="green">
                          Device bound{device.reset_count > 0 ? ` (reset ×${device.reset_count})` : ""}
                        </Badge>
                      ) : (
                        <Badge tone="slate">Device not yet bound</Badge>
                      )}
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-xs text-slate-400">Index number:</span>
                      <SetIndexNumberButton
                        userId={r.id}
                        currentValue={r.index_number}
                        path="/admin/course-reps"
                      />
                    </div>
                    <div className="mt-2">
                      <span className="text-xs text-slate-400 block mb-1">Assigned subject(s):</span>
                      <AssignSubjectButton
                        userId={r.id}
                        subjects={repProgramSubjects.map((s) => ({ id: s.id, name: s.name }))}
                        currentSubjectIds={r.responsible_subject_ids}
                        path="/admin/course-reps"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex flex-wrap justify-end gap-2">
                      <ResetPasswordButton userId={r.id} userName={r.name} userPhone={r.phone} path="/admin/course-reps" />
                      {device?.device_id && (
                        <ResetDeviceButton studentId={r.id} studentName={r.name} path="/admin/course-reps" />
                      )}
                      <form action={toggleUserActiveAction.bind(null, r.id, !r.is_active, "/admin/course-reps")}>
                        <button type="submit" className={`${secondaryButtonClass} !py-1.5 !px-3 text-xs`}>
                          {r.is_active ? "Deactivate" : "Reactivate"}
                        </button>
                      </form>
                      <DemoteToStudentButton userId={r.id} userName={r.name} path="/admin/course-reps" />
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
          {filteredReps.length === 0 && (
            <p className="text-sm text-slate-500">
              {filtering ? "No course reps at this level." : "No course reps yet — promote a student below."}
            </p>
          )}
        </div>

        <Card className="p-5 h-fit">
          <h2 className="font-semibold text-slate-900 mb-1">Promote a student to course rep</h2>
          <p className="text-xs text-slate-500 mb-3">
            Course reps aren&apos;t registered directly. Pick an existing student and the subject(s) they&apos;ll be
            responsible for — they keep their existing password and sign in the same way.
          </p>
          <PromoteCourseRepPanel
            students={students.map((s) => ({
              id: s.id,
              name: s.name,
              indexNumber: s.index_number,
              programId: s.program_id,
            }))}
            subjects={subjects.map((s) => ({ id: s.id, name: s.name, programId: s.program_id }))}
          />
        </Card>
      </div>
    </div>
  );
}
