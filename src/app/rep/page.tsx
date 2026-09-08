import Link from "next/link";
import { requireSessionWithToken } from "@/lib/guard";
import * as api from "@/lib/api";
import { lecturePhase } from "@/lib/lecturePhase";
import { Card, PageHeader, Badge, buttonClass } from "@/components/ui";

const PHASE_TONE = {
  UPCOMING: "blue",
  ONGOING: "green",
  ENDED: "slate",
  CANCELLED: "red",
} as const;

export default async function RepDashboardPage() {
  const { token } = await requireSessionWithToken(["COURSE_REP"]);
  const [lectures, subjects, halls] = await Promise.all([
    api.listMyLecturesAsRep(token),
    api.listSubjects(token),
    api.listHalls(token),
  ]);
  const subjectById = new Map(subjects.map((s) => [s.id, s]));
  const hallById = new Map(halls.map((h) => [h.id, h]));

  return (
    <div>
      <PageHeader
        title="Your lectures"
        subtitle="Schedule lectures for your program and keep an eye on how they're going."
        action={
          <Link href="/rep/lectures/new" className={buttonClass}>
            + Schedule lecture
          </Link>
        }
      />

      <div className="space-y-3">
        {lectures.map((lec) => {
          const subject = subjectById.get(lec.subject_id);
          const hall = hallById.get(lec.lecture_hall_id);
          const phase = lecturePhase(lec);
          return (
            <Link key={lec.id} href={`/rep/lectures/${lec.id}`}>
              <Card className="p-4 hover:border-blue-300 transition">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <h3 className="font-medium text-slate-900">{subject?.name ?? "Unknown subject"}</h3>
                    <p className="text-sm text-slate-500">
                      {hall?.name ?? "Unknown hall"} ·{" "}
                      {new Date(lec.start_time).toLocaleString(undefined, {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                      {" – "}
                      {new Date(lec.end_time).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                    </p>
                  </div>
                  <Badge tone={PHASE_TONE[phase]}>{phase}</Badge>
                </div>
              </Card>
            </Link>
          );
        })}
        {lectures.length === 0 && (
          <p className="text-sm text-slate-500">No lectures scheduled yet — create your first one.</p>
        )}
      </div>
    </div>
  );
}
