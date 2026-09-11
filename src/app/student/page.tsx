import Link from "next/link";
import { requireSessionWithToken } from "@/lib/guard";
import * as api from "@/lib/api";
import { lecturePhase, sortLecturesForDisplay } from "@/lib/lecturePhase";
import { Card, PageHeader, Badge, buttonClass } from "@/components/ui";

const STATUS_TONE = { PRESENT: "green", INCOMPLETE: "amber", ABSENT: "red" } as const;

export default async function StudentHomePage() {
  const { session, token } = await requireSessionWithToken(["STUDENT"]);
  const [upcomingLectures, history, device, subjects, halls] = await Promise.all([
    api.listUpcomingLecturesForMyProgram(token),
    api.getMyAttendanceHistory(token),
    api.getMyDevice(token),
    api.listSubjects(token),
    api.listHalls(token),
  ]);
  const subjectById = new Map(subjects.map((s) => [s.id, s]));
  const hallById = new Map(halls.map((h) => [h.id, h]));

  // Ongoing lecture(s) always on top — see lib/lecturePhase.ts.
  const upcoming = sortLecturesForDisplay(upcomingLectures, (l) => l).map((l) => ({
    lecture: l,
    phase: lecturePhase(l),
  }));
  const presentCount = history.filter((h) => h.status === "PRESENT").length;
  const rate = history.length > 0 ? Math.round((presentCount / history.length) * 100) : null;

  return (
    <div>
      <PageHeader
        title={`Hi, ${session.name.split(" ")[0]}`}
        subtitle="Your lectures and attendance record."
        action={
          <Link href="/student/scan" className={buttonClass}>
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
          <h2 className="font-semibold text-slate-900 mb-3">
            Your attendance {rate != null && <span className="text-slate-400 font-normal">· {rate}% recent</span>}
          </h2>
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
  );
}
