import { requireSession } from "@/lib/guard";
import { changePasswordAction } from "@/app/actions/account";
import { ActionForm } from "@/components/ActionForm";
import { Card, PageHeader, inputClass } from "@/components/ui";
import Nav from "@/components/Nav";

const NAV_BY_ROLE: Record<string, { href: string; label: string }[]> = {
  ADMIN: [{ href: "/admin", label: "Dashboard" }],
  TEACHER: [{ href: "/teacher", label: "Overview" }],
  COURSE_REP: [{ href: "/rep", label: "Lectures" }],
  STUDENT: [{ href: "/student", label: "My attendance" }],
};

export default async function ChangePasswordPage() {
  const session = await requireSession(["ADMIN", "TEACHER", "COURSE_REP", "STUDENT"]);

  return (
    <div className="min-h-screen">
      <Nav items={NAV_BY_ROLE[session.role] ?? []} name={session.name} roleLabel={session.role} />
      <main className="max-w-sm mx-auto px-4 py-8">
        <PageHeader title="Change password" />
        <Card className="p-5">
          <ActionForm action={changePasswordAction} submitLabel="Update password">
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Current password</label>
                <input name="currentPassword" type="password" required className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">New password</label>
                <input name="newPassword" type="password" required minLength={8} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Confirm new password</label>
                <input name="confirmPassword" type="password" required minLength={8} className={inputClass} />
              </div>
            </div>
          </ActionForm>
        </Card>
      </main>
    </div>
  );
}
