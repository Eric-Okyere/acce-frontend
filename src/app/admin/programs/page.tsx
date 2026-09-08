import { requireSessionWithToken } from "@/lib/guard";
import * as api from "@/lib/api";
import { createProgramAction } from "@/app/actions/admin";
import { ActionForm } from "@/components/ActionForm";
import { Card, PageHeader, inputClass } from "@/components/ui";

export default async function ProgramsPage() {
  const { token } = await requireSessionWithToken(["ADMIN"]);
  const programs = await api.listPrograms(token);

  return (
    <div>
      <PageHeader
        title="Programs"
        subtitle="Every student and course rep belongs to one of these. The three ACCE programs are pre-loaded."
      />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {programs.map((p) => (
            <Card key={p.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-medium text-slate-900">{p.name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{p.key}</p>
                  {p.description && <p className="text-sm text-slate-600 mt-2">{p.description}</p>}
                  {p.source_url && (
                    <a
                      href={p.source_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-blue-700 mt-2 inline-block"
                    >
                      {p.source_url}
                    </a>
                  )}
                </div>
              </div>
            </Card>
          ))}
          {programs.length === 0 && <p className="text-sm text-slate-500">No programs yet.</p>}
        </div>

        <Card className="p-5 h-fit">
          <h2 className="font-semibold text-slate-900 mb-3">Add a program</h2>
          <ActionForm action={createProgramAction} submitLabel="Create program">
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Program name</label>
                <input name="name" required className={inputClass} placeholder="e.g. Special Education" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Short key</label>
                <input
                  name="key"
                  required
                  className={inputClass}
                  placeholder="e.g. SPECIAL_EDUCATION"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description (optional)</label>
                <textarea name="description" className={inputClass} rows={3} />
              </div>
            </div>
          </ActionForm>
        </Card>
      </div>
    </div>
  );
}
