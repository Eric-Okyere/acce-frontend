import type { LectureRow, LecturePhase } from "@/lib/types";

/** Derives the real-time phase of a lecture from its start/end timestamps. Client-safe & pure. */
export function lecturePhase(
  lecture: Pick<LectureRow, "start_time" | "end_time" | "status">,
  now: Date = new Date()
): LecturePhase {
  if (lecture.status === "CANCELLED") return "CANCELLED";
  const start = new Date(lecture.start_time);
  const end = new Date(lecture.end_time);
  if (now < start) return "UPCOMING";
  if (now <= end) return "ONGOING";
  return "ENDED";
}
