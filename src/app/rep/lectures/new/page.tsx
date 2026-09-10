import { requireSessionWithToken } from "@/lib/guard";
import * as api from "@/lib/api";
import { createLectureAction } from "@/app/actions/rep";
import { ActionForm } from "@/components/ActionForm";
import { Card, PageHeader, inputClass } from "@/components/ui";

export default async function NewLecturePage() {
  const { token } = await requireSessionWithToken(["COURSE_REP"]);
  const rep = await api.getMe(token);
  // A course rep is responsible for one or more subjects, assigned by an
  // admin (see routes/users.js's promote-course-rep route) — they can only
  // ever schedule lectures for one of those, so the picker below (when there
  // is more than one) is restricted to just their own assigned subjects,
  // never every subject in their program. The backend enforces this too
  // (routes/lectures.js), so this is a UX convenience, not the actual
  // security boundary.
  const [allSubjects, halls] = await Promise.all([
    rep.responsible_subject_ids.length > 0 ? api.listSubjects(token) : Promise.resolve([]),
    api.listHalls(token),
  ]);
  const responsibleSubjects = allSubjects.filter((s) => rep.responsible_subject_ids.includes(s.id));

  return (
    <div className="max-w-lg">
      <PageHeader title="Schedule a lecture" subtitle="Students can check in from up to 2 hours before start, and must check out right at the end time." />

      <Card className="p-5">
        {rep.responsible_subject_ids.length === 0 ? (
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            You haven&apos;t been assigned a subject yet — ask an admin to assign you one before you can schedule
            lectures.
          </p>
        ) : responsibleSubjects.length === 0 ? (
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            Your assigned subject(s) could not be found — ask an admin to check your subject assignment.
          </p>
        ) : (
          <ActionForm action={createLectureAction} submitLabel="Schedule lecture">
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
                {responsibleSubjects.length === 1 ? (
                  <>
                    <input type="hidden" name="subjectId" value={responsibleSubjects[0].id} />
                    <p className={`${inputClass} bg-slate-50 text-slate-700`}>{responsibleSubjects[0].name}</p>
                  </>
                ) : (
                  <select name="subjectId" required className={inputClass}>
                    <option value="">Select a subject…</option>
                    {responsibleSubjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                )}
                <p className="text-xs text-slate-400 mt-1">You can only schedule lectures for a subject you&apos;re responsible for.</p>
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
