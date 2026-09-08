import { requireSessionWithToken } from "@/lib/guard";
import * as api from "@/lib/api";
import { createCourseRepAction, toggleUserActiveAction } from "@/app/actions/admin";
import { ActionForm } from "@/components/ActionForm";
import { Card, PageHeader, inputClass, Badge, secondaryButtonClass } from "@/components/ui";

export default async function CourseRepsPage() {
  const { token } = await requireSessionWithToken(["ADMIN"]);
  const [reps, programs] = await Promise.all([
    api.listUsersByRole(token, "COURSE_REP"),
    api.listPrograms(token),
  ]);
  const programName = (id: string | null) => programs.find((p) => p.id === id)?.name ?? "—";

  return (
    <div>
      <PageHeader
        title="Course reps"
        subtitle="Course reps schedule upcoming lectures (subject, hall, start/end time) for their program."
      />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {reps.map((r) => (
            <Card key={r.id} className="p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <h3 className="font-medium text-slate-900">{r.name}</h3>
                  <p className="text-sm text-slate-500">{r.phone}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    <Badge tone="blue">{programName(r.program_id)}</Badge>
                    {!r.is_active && <Badge tone="red">Deactivated</Badge>}
                  </div>
                </div>
                <form action={toggleUserActiveAction.bind(null, r.id, !r.is_active, "/admin/course-reps")}>
                  <button type="submit" className={`${secondaryButtonClass} !py-1.5 !px-3 text-xs`}>
                    {r.is_active ? "Deactivate" : "Reactivate"}
                  </button>
                </form>
              </div>
            </Card>
          ))}
          {reps.length === 0 && <p className="text-sm text-slate-500">No course reps registered yet.</p>}
        </div>

        <Card className="p-5 h-fit">
          <h2 className="font-semibold text-slate-900 mb-3">Register a course rep</h2>
          <ActionForm action={createCourseRepAction} submitLabel="Register course rep">
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
            </div>
          </ActionForm>
        </Card>
      </div>
    </div>
  );
}
