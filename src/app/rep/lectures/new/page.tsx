import { requireSessionWithToken } from "@/lib/guard";
import * as api from "@/lib/api";
import { createLectureAction } from "@/app/actions/rep";
import { ActionForm } from "@/components/ActionForm";
import { Card, PageHeader, inputClass } from "@/components/ui";

export default async function NewLecturePage() {
  const { token } = await requireSessionWithToken(["COURSE_REP"]);
  const rep = await api.getMe(token);
  const [subjects, halls] = await Promise.all([
    rep.program_id ? api.listSubjects(token, { programId: rep.program_id }) : Promise.resolve([]),
    api.listHalls(token),
  ]);

  return (
    <div className="max-w-lg">
      <PageHeader title="Schedule a lecture" subtitle="Students can check in from up to 2 hours before start, and must check out right at the end time." />

      <Card className="p-5">
        {subjects.length === 0 ? (
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            No subjects exist for your program yet — ask an admin to create one first.
          </p>
        ) : (
          <ActionForm action={createLectureAction} submitLabel="Schedule lecture">
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
                <select name="subjectId" required className={inputClass}>
                  <option value="">Select a subject…</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
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
