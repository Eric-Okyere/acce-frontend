import { requireSessionWithToken } from "@/lib/guard";
import * as api from "@/lib/api";
import { createLectureAction } from "@/app/actions/rep";
import { ActionForm } from "@/components/ActionForm";
import { Card, PageHeader, inputClass } from "@/components/ui";

export default async function NewLecturePage() {
  const { token } = await requireSessionWithToken(["COURSE_REP"]);
  const rep = await api.getMe(token);
  // Every course rep is responsible for exactly one subject, assigned by an
  // admin (see routes/users.js's promote-course-rep route) — they can only
  // ever schedule lectures for that subject, so there's no subject picker
  // here, just a read-only display plus a hidden field for the form post.
  // The backend enforces this too (routes/lectures.js), so this is a UX
  // convenience, not the actual security boundary.
  const [subjects, halls] = await Promise.all([
    rep.responsible_subject_id ? api.listSubjects(token) : Promise.resolve([]),
    api.listHalls(token),
  ]);
  const responsibleSubject = rep.responsible_subject_id
    ? subjects.find((s) => s.id === rep.responsible_subject_id) ?? null
    : null;

  return (
    <div className="max-w-lg">
      <PageHeader title="Schedule a lecture" subtitle="Students can check in from up to 2 hours before start, and must check out right at the end time." />

      <Card className="p-5">
        {!rep.responsible_subject_id ? (
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            You haven&apos;t been assigned a subject yet — ask an admin to assign you one before you can schedule
            lectures.
          </p>
        ) : !responsibleSubject ? (
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            Your assigned subject could not be found — ask an admin to check your subject assignment.
          </p>
        ) : (
          <ActionForm action={createLectureAction} submitLabel="Schedule lecture">
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
                <input type="hidden" name="subjectId" value={responsibleSubject.id} />
                <p className={`${inputClass} bg-slate-50 text-slate-700`}>{responsibleSubject.name}</p>
                <p className="text-xs text-slate-400 mt-1">You can only schedule lectures for your assigned subject.</p>
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
