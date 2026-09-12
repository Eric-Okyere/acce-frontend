import Link from "next/link";
import { requireSessionWithToken } from "@/lib/guard";
import * as api from "@/lib/api";
import { lecturePhase, sortLecturesForDisplay } from "@/lib/lecturePhase";
import { cancelLectureAction, endLectureAction } from "@/app/actions/lectures";
import { Card, PageHeader, Badge, buttonClass, secondaryButtonClass } from "@/components/ui";

const PHASE_TONE = {
  UPCOMING: "blue",
  ONGOING: "green",
  ENDED: "slate",
  CANCELLED: "red",
} as const;

// Lectures THIS teacher scheduled themselves (routes/lectures.js's GET
// /mine, extended in this release to teachers and admins as well as course
// reps) — a subject's full lecture history (including ones a course rep
// scheduled for it) is still on that subject's own dashboard
// (app/teacher/subjects/[id]/page.tsx), which this doesn't replace.
export default async function TeacherLecturesPage() {
  const { token } = await requireSessionWithToken(["TEACHER"]);
  const [lectures, subjects, halls] = await Promise.all([
    api.listMyLecturesAsRep(token),
    api.listSubjects(token),
    api.listHalls(token),
  ]);
  const subjectById = new Map(subjects.map((s) => [s.id, s]));
  const hallById = new Map(halls.map((h) => [h.id, h]));
  // Ongoing lecture(s) always on top — see lib/lecturePhase.ts.
  const sortedLectures = sortLecturesForDisplay(lectures, (l) => l);

  return (
    <div>
      <PageHeader
        title="Your lectures"
        subtitle="Lectures you've scheduled yourself for a course you teach."
        action={
          <Link href="/teacher/lectures/new" className={buttonClass}>
            + Schedule lecture
          </Link>
        }
      />

      <div className="space-y-3">
        {sortedLectures.map((lec) => {
          const subject = subjectById.get(lec.subject_id);
          const hall = hallById.get(lec.lecture_hall_id);
          const phase = lecturePhase(lec);
          const cancellable = phase !== "ENDED" && phase !== "CANCELLED";
          const endable = phase === "ONGOING";
          return (
            <Card key={lec.id} className="p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <h3 className="font-medium text-slate-900">{subject?.name ?? "Unknown course"}</h3>
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
                <div className="flex items-center gap-2">
                  <Badge tone={PHASE_TONE[phase]}>{phase}</Badge>
                  {endable && (
                    <form action={endLectureAction.bind(null, lec.id)}>
                      <button
                        type="submit"
                        className={`${secondaryButtonClass} !py-1.5 !px-3 text-xs !text-green-700 !border-green-200 hover:!bg-green-50`}
                      >
                        End
                      </button>
                    </form>
                  )}
                  {cancellable && (
                    <form action={cancelLectureAction.bind(null, lec.id)}>
                      <button
                        type="submit"
                        className={`${secondaryButtonClass} !py-1.5 !px-3 text-xs !text-red-600 !border-red-200 hover:!bg-red-50`}
                      >
                        Cancel
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
        {lectures.length === 0 && (
          <p className="text-sm text-slate-500">No lectures scheduled yet — create your first one.</p>
        )}
      </div>
    </div>
  );
}
