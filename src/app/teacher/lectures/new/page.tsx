import { requireSessionWithToken } from "@/lib/guard";
import * as api from "@/lib/api";
import { createLectureAction } from "@/app/actions/lectures";
import { ActionForm } from "@/components/ActionForm";
import { Card, PageHeader, inputClass } from "@/components/ui";

// A teacher can schedule a lecture for their own subject(s) — same
// capability a course rep has, extended to teachers (and, separately,
// admins — see app/admin/lectures/new/page.tsx) so a lecture doesn't have to
// wait on a course rep. The backend (routes/lectures.js) is the actual
// security boundary — it only accepts a subjectId this teacher teaches — the
// picker below is scoped the same way as a UX convenience.
export default async function NewTeacherLecturePage() {
  const { session, token } = await requireSessionWithToken(["TEACHER"]);
  const [subjects, halls] = await Promise.all([
    api.listSubjects(token, { teacherId: session.sub }),
    api.listHalls(token),
  ]);

  return (
    <div className="max-w-lg">
      <PageHeader
        title="Schedule a lecture"
        subtitle="Students can check in from up to 2 hours before start, and must check out right at the end time."
      />

      <Card className="p-5">
        {subjects.length === 0 ? (
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            You haven&apos;t been assigned to any subjects yet — ask an admin to assign you to one before you can
            schedule lectures.
          </p>
        ) : (
          <ActionForm action={createLectureAction} submitLabel="Schedule lecture">
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
                {subjects.length === 1 ? (
                  <>
                    <input type="hidden" name="subjectId" value={subjects[0].id} />
                    <p className={`${inputClass} bg-slate-50 text-slate-700`}>{subjects[0].name}</p>
                  </>
                ) : (
                  <select name="subjectId" required className={inputClass}>
                    <option value="">Select a subject…</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                )}
                <p className="text-xs text-slate-400 mt-1">You can only schedule lectures for a subject you teach.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Lecture hall</label>
                <select name="lectureHallId" required className={inputClass}>
                  <option value="">Select a hall…</option>
                  {halls.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Title (optional)</label>
                <input name="title" className={inputClass} placeholder="e.g. Chapter 4 — Fractions" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Start time</label>
                  <input name="startTime" type="datetime-local" required className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">End time</label>
                  <input name="endTime" type="datetime-local" required className={inputClass} />
                </div>
              </div>
            </div>
          </ActionForm>
        )}
      </Card>
    </div>
  );
}
