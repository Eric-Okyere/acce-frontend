import { requireSessionWithToken } from "@/lib/guard";
import * as api from "@/lib/api";
import { createStudentAction, toggleUserActiveAction } from "@/app/actions/admin";
import { ActionForm } from "@/components/ActionForm";
import { Card, PageHeader, inputClass, Badge, secondaryButtonClass } from "@/components/ui";
import ResetDeviceButton from "./ResetDeviceButton";

export default async function StudentsPage() {
  const { token } = await requireSessionWithToken(["ADMIN"]);
  const [students, programs] = await Promise.all([
    api.listUsersByRole(token, "STUDENT"),
    api.listPrograms(token),
  ]);
  const devices = await Promise.all(students.map((s) => api.getStudentDevice(token, s.id)));
  const deviceByStudent = new Map(students.map((s, i) => [s.id, devices[i]]));
  const programName = (id: string | null) => programs.find((p) => p.id === id)?.name ?? "—";

  return (
    <div>
      <PageHeader
        title="Students"
        subtitle="Every student is registered under a program. If a student's phone is lost or replaced, reset their device here so they can check in from the new one."
      />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Student</th>
                  <th className="text-left px-4 py-3 font-medium">Program</th>
                  <th className="text-left px-4 py-3 font-medium">Device</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-right px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => {
                  const device = deviceByStudent.get(s.id);
                  return (
                    <tr key={s.id} className="border-t border-slate-100">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{s.name}</div>
                        <div className="text-xs text-slate-400">
                          {s.index_number ?? "no index #"} · {s.phone}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{programName(s.program_id)}</td>
                      <td className="px-4 py-3">
                        {device?.device_id ? (
                          <Badge tone="green">Bound{device.reset_count > 0 ? ` (reset ×${device.reset_count})` : ""}</Badge>
                        ) : (
                          <Badge tone="slate">Not yet bound</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {s.is_active ? <Badge tone="green">Active</Badge> : <Badge tone="red">Deactivated</Badge>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          {device?.device_id && <ResetDeviceButton studentId={s.id} studentName={s.name} />}
                          <form action={toggleUserActiveAction.bind(null, s.id, !s.is_active, "/admin/students")}>
                            <button type="submit" className={`${secondaryButtonClass} !py-1.5 !px-3 text-xs`}>
                              {s.is_active ? "Deactivate" : "Reactivate"}
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  );
                })}
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
            </div>
          </ActionForm>
        </Card>
      </div>
    </div>
  );
}
