import Link from "next/link";
import { requireSessionWithToken } from "@/lib/guard";
import * as api from "@/lib/api";
import { PageHeader } from "@/components/ui";
import SubjectReportView from "@/components/SubjectReportView";

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ subject?: string }>;
}) {
  const { token } = await requireSessionWithToken(["ADMIN"]);
  const { subject: subjectId } = await searchParams;
  const subjects = await api.listSubjects(token);
  const activeId = subjectId || subjects[0]?.id;
  const report = activeId ? await api.getSubjectReport(token, activeId) : null;

  return (
    <div>
      <PageHeader title="Reports" subtitle="Attendance analytics across every subject." />

      {subjects.length === 0 ? (
        <p className="text-sm text-slate-500">No subjects yet — create one first.</p>
      ) : (
        <>
          <div className="flex flex-wrap gap-2 mb-6">
            {subjects.map((s) => (
              <Link
                key={s.id}
                href={`/admin/reports?subject=${s.id}`}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${
                  s.id === activeId
                    ? "bg-blue-700 text-white border-blue-700"
                    : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
                }`}
              >
                {s.name}
              </Link>
            ))}
          </div>
          {report && <SubjectReportView report={report} />}
        </>
      )}
    </div>
  );
}
