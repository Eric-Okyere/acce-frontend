import { notFound } from "next/navigation";
import { requireSessionWithToken } from "@/lib/guard";
import * as api from "@/lib/api";
import { ApiError } from "@/lib/api";
import { PageHeader } from "@/components/ui";
import SubjectReportView from "@/components/SubjectReportView";

export default async function TeacherSubjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { token } = await requireSessionWithToken(["TEACHER"]);
  const { id } = await params;

  // Ownership (this teacher's own subject only) is enforced server-side by
  // the backend — a 403 there means notFound() here, not just hidden nav.
  let report;
  try {
    report = await api.getSubjectReport(token, id);
  } catch (e) {
    if (e instanceof ApiError && (e.status === 403 || e.status === 404)) notFound();
    throw e;
  }

  return (
    <div>
      <PageHeader title={report.subjectName} subtitle="Attendance dashboard for your course only." />
      <SubjectReportView report={report} />
    </div>
  );
}
