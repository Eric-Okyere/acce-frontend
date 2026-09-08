import { requireSessionWithToken } from "@/lib/guard";
import * as api from "@/lib/api";
import { PageHeader, Card } from "@/components/ui";

export default async function AuditPage() {
  const { token } = await requireSessionWithToken(["ADMIN"]);
  const logs = await api.listRecentAudit(token, 300);

  return (
    <div>
      <PageHeader
        title="Audit log"
        subtitle="Every login, check-in/out, and admin action — including the GPS distance recorded for each scan."
      />
      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-4 py-3 font-medium">When</th>
              <th className="text-left px-4 py-3 font-medium">Actor</th>
              <th className="text-left px-4 py-3 font-medium">Action</th>
              <th className="text-left px-4 py-3 font-medium">Details</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-t border-slate-100">
                <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                  {new Date(log.created_at).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-slate-700">{log.actor_name ?? "—"}</td>
                <td className="px-4 py-3 font-medium text-slate-900">
                  {log.action.replaceAll("_", " ").toLowerCase()}
                </td>
                <td className="px-4 py-3 text-slate-500">
                  {log.metadata?.distance != null ? `${Math.round(Number(log.metadata.distance))}m from hall` : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {logs.length === 0 && <p className="text-sm text-slate-500 px-4 py-6">No activity yet.</p>}
      </Card>
    </div>
  );
}
