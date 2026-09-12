import { notFound } from "next/navigation";
import { requireSessionWithToken } from "@/lib/guard";
import * as api from "@/lib/api";
import { ApiError } from "@/lib/api";
import { lecturePhase } from "@/lib/lecturePhase";
import { LectureActionButtons } from "@/components/LectureActionButtons";
import { Card, PageHeader, Badge } from "@/components/ui";
import { groupByLevel } from "@/lib/levels";

const STATUS_TONE = { PRESENT: "green", INCOMPLETE: "amber", ABSENT: "red" } as const;

export default async function RepLectureDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { session, token } = await requireSessionWithToken(["COURSE_REP"]);
  const { id } = await params;

  let lecture;
  try {
    lecture = await api.getLecture(token, id);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }
  if (lecture.course_rep_id !== session.sub) notFound();

  const [subjects, halls, roster] = await Promise.all([
    api.listSubjects(token),
    api.listHalls(token),
    api.getLectureRoster(token, id),
  ]);
  const subject = subjects.find((s) => s.id === lecture.subject_id);
  const hall = halls.find((h) => h.id === lecture.lecture_hall_id);
  const phase = lecturePhase(lecture);
  const present = roster.filter((r) => r.status === "PRESENT").length;
  // The roster for a single subject can span several levels at once (a
  // combined class) — group it the same way the subject-wide dashboard does.
  const levelGroups = groupByLevel(roster);

  return (
    <div>
      <PageHeader
        title={subject?.name ?? "Lecture"}
        subtitle={`${hall?.name ?? "Unknown hall"} · ${new Date(lecture.start_time).toLocaleString()} – ${new Date(
          lecture.end_time
        ).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`}
        action={
          phase !== "ENDED" && phase !== "CANCELLED" ? (
            <LectureActionButtons lectureId={id} endable={phase === "ONGOING"} cancellable size="full" />
          ) : undefined
        }
      />

      <div className="flex items-center gap-2 mb-4">
        <Badge tone={phase === "CANCELLED" ? "red" : phase === "ONGOING" ? "green" : "blue"}>{phase}</Badge>
        <span className="text-sm text-slate-500">
          {present} / {roster.length} present so far
        </span>
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Student</th>
              <th className="text-left px-4 py-3 font-medium">Check-in</th>
              <th className="text-left px-4 py-3 font-medium">Check-out</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          {levelGroups.map((group) => (
            <tbody key={group.label}>
              <tr className="border-t border-slate-200 bg-slate-50">
                <td colSpan={4} className="px-4 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  {group.label} · {group.items.length} student{group.items.length === 1 ? "" : "s"} ·{" "}
                  {group.items.filter((r) => r.status === "PRESENT").length} present
                </td>
              </tr>
              {group.items.map((r) => (
                <tr key={r.studentId} className="border-t border-slate-100">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{r.studentName}</div>
                    <div className="text-xs text-slate-400">{r.indexNumber ?? ""}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {r.checkInAt ? new Date(r.checkInAt).toLocaleTimeString() : "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {r.checkOutAt ? new Date(r.checkOutAt).toLocaleTimeString() : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={STATUS_TONE[r.status]}>{r.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          ))}
        </table>
      </Card>
    </div>
  );
}
