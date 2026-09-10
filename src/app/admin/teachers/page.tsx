import { requireSessionWithToken } from "@/lib/guard";
import * as api from "@/lib/api";
import { createTeacherAction, toggleUserActiveAction } from "@/app/actions/admin";
import { ActionForm } from "@/components/ActionForm";
import { Card, PageHeader, inputClass, Badge, secondaryButtonClass } from "@/components/ui";
import ResetPasswordButton from "@/components/ResetPasswordButton";

export default async function TeachersPage() {
  const { token } = await requireSessionWithToken(["ADMIN"]);
  const [teachers, subjects] = await Promise.all([
    api.listUsersByRole(token, "TEACHER"),
    api.listSubjects(token),
  ]);

  return (
    <div>
      <PageHeader
        title="Teachers"
        subtitle="Register a teacher with their name and phone number, then assign them to subjects."
      />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {teachers.map((t) => {
            const subs = subjects.filter((s) => s.teacher_id === t.id);
            return (
              <Card key={t.id} className="p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <h3 className="font-medium text-slate-900">{t.name}</h3>
                    <p className="text-sm text-slate-500">{t.phone}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {subs.length > 0 ? (
                        subs.map((s) => <Badge key={s.id}>{s.name}</Badge>)
                      ) : (
                        <span className="text-xs text-slate-400">No subjects assigned yet</span>
                      )}
                      {!t.is_active && <Badge tone="red">Deactivated</Badge>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <ResetPasswordButton userId={t.id} userName={t.name} path="/admin/teachers" />
                    <form action={toggleUserActiveAction.bind(null, t.id, !t.is_active, "/admin/teachers")}>
                      <button type="submit" className={`${secondaryButtonClass} !py-1.5 !px-3 text-xs`}>
                        {t.is_active ? "Deactivate" : "Reactivate"}
                      </button>
                    </form>
                  </div>
                </div>
              </Card>
            );
          })}
          {teachers.length === 0 && <p className="text-sm text-slate-500">No teachers registered yet.</p>}
        </div>

        <Card className="p-5 h-fit">
          <h2 className="font-semibold text-slate-900 mb-3">Register a teacher</h2>
          <ActionForm action={createTeacherAction} submitLabel="Register teacher">
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full name</label>
                <input name="name" required className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone number</label>
                <input name="phone" required type="tel" className={inputClass} placeholder="024 000 0000" />
              </div>
            </div>
          </ActionForm>
          <p className="text-xs text-slate-400 mt-3">
            A temporary password is generated automatically — you&apos;ll see it once after registering, to
            share with the teacher.
          </p>
        </Card>
      </div>
    </div>
  );
}
