import Link from "next/link";
import { requireSessionWithToken } from "@/lib/guard";
import * as api from "@/lib/api";
import { lecturePhase, sortLecturesForDisplay } from "@/lib/lecturePhase";
import { Card, PageHeader, Badge, buttonClass } from "@/components/ui";

const PHASE_TONE = {
  UPCOMING: "blue",
  ONGOING: "green",
  ENDED: "slate",
  CANCELLED: "red",
} as const;

const STATUS_TONE = { PRESENT: "green", INCOMPLETE: "amber", ABSENT: "red" } as const;

export default async function RepDashboardPage() {
  const { token } = await requireSessionWithToken(["COURSE_REP"]);
  const [lectures, subjects, halls, upcomingLectures, history, device] = await Promise.all([
    api.listMyLecturesAsRep(token),
    api.listSubjects(token),
    api.listHalls(token),
    api.listUpcomingLecturesForMyProgram(token),
    api.getMyAttendanceHistory(token),
    api.getMyDevice(token),
  ]);
  const subjectById = new Map(subjects.map((s) => [s.id, s]));
  const hallById = new Map(halls.map((h) => [h.id, h]));
  // Ongoing lecture(s) always on top — see lib/lecturePhase.ts.
  const sortedLectures = sortLecturesForDisplay(lectures, (l) => l);
  const upcoming = sortLecturesForDisplay(upcomingLectures, (l) => l).map((l) => ({
    lecture: l,
    phase: lecturePhase(l),
  }));

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

      <div className="space-y-3 mb-10">
        {sortedLectures.map((lec) => {
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

      {/* Course reps attend lectures in their own program just like any student —
          this is their own check-in/attendance, separate from the lectures they
          organize above. See routes/attendance.js on the backend. */}
      <div className="border-t border-slate-200 pt-8">
        <PageHeader
          title="Your own attendance"
          subtitle="You're also expected in your program's lectures — check in the same way any student does."
          action={
            <Link href="/rep/scan" className={buttonClass}>
              📷 Scan to check in/out
            </Link>
          }
        />

        {!device?.device_id && (
          <Card className="p-4 mb-6 border-blue-200 bg-blue-50">
            <p className="text-sm text-blue-800">
              Your phone isn&apos;t linked to your account yet — it will be automatically the first time
              you check in. From then on, only this phone can check in for you.
            </p>
          </Card>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h2 className="font-semibold text-slate-900 mb-3">Upcoming lectures</h2>
            <div className="space-y-3">
              {upcoming.map(({ lecture, phase }) => {
                const subject = subjectById.get(lecture.subject_id);
                const hall = hallById.get(lecture.lecture_hall_id);
                return (
                  <Card key={lecture.id} className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-slate-900">{subject?.name ?? "Subject"}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {hall?.name} ·{" "}
                          {new Date(lecture.start_time).toLocaleString(undefined, {
                            weekday: "short",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <Badge tone={phase === "ONGOING" ? "green" : "blue"}>{phase}</Badge>
                    </div>
                  </Card>
                );
              })}
              {upcoming.length === 0 && (
                <p className="text-sm text-slate-500">Nothing scheduled right now.</p>
              )}
            </div>
          </div>

          <div>
            <h2 className="font-semibold text-slate-900 mb-3">Your attendance record</h2>
            <div className="space-y-2">
              {history.map((h) => (
                <div
                  key={h.lectureId}
                  className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">{h.subjectName}</p>
                    <p className="text-xs text-slate-400">
                      {new Date(h.startTime).toLocaleDateString(undefined, { month: "short", day: "numeric" })} ·{" "}
                      {h.hallName}
                    </p>
                  </div>
                  <Badge tone={STATUS_TONE[h.status]}>{h.status}</Badge>
                </div>
              ))}
              {history.length === 0 && <p className="text-sm text-slate-500">No past lectures yet.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
