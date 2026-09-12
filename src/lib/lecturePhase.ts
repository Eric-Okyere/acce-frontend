import type { LectureRow, LecturePhase } from "@/lib/types";

/** Derives the real-time phase of a lecture from its start/end timestamps. Client-safe & pure. */
export function lecturePhase(
  lecture: Pick<LectureRow, "start_time" | "end_time" | "status">,
  now: Date = new Date()
): LecturePhase {
  if (lecture.status === "CANCELLED") return "CANCELLED";
  // A lecture manually ended early (routes/lectures.js's PATCH /:id/end —
  // admin, teacher, or course rep) is ENDED from that moment on, regardless
  // of its originally scheduled end_time, which is left untouched as a
  // historical record of what was planned. Mirrors backend/src/lib/lecturePhase.js
  // exactly — this check was missing here (v3.44 fix): the backend correctly
  // set status to COMPLETED when "End" was clicked, but this frontend copy
  // never looked at status for anything but CANCELLED, so it kept showing
  // ONGOING (purely time-based) until the original end_time actually passed.
  if (lecture.status === "COMPLETED") return "ENDED";
  const start = new Date(lecture.start_time);
  const end = new Date(lecture.end_time);
  if (now < start) return "UPCOMING";
  if (now <= end) return "ONGOING";
  return "ENDED";
}

const PHASE_PRIORITY: Record<LecturePhase, number> = {
  ONGOING: 0,
  UPCOMING: 1,
  ENDED: 2,
  CANCELLED: 3,
};

/**
 * Orders lectures so whatever's ONGOING right now is always first — per
 * Eric's explicit request, a lecture already in progress should never be
 * buried below a lecture that's merely scheduled for later. After that:
 * UPCOMING soonest-first (what's coming up next), then ENDED/CANCELLED
 * most-recent-first (matches how a history list is normally read). Takes a
 * getter so it works whether the list is raw LectureRows or objects wrapping
 * one (e.g. `{ lecture, phase }`), and re-derives phase from `now` at sort
 * time rather than trusting a precomputed value, since a page can be open
 * long enough for a phase to change.
 */
export function sortLecturesForDisplay<T>(
  items: T[],
  getLecture: (item: T) => Pick<LectureRow, "start_time" | "end_time" | "status">,
  now: Date = new Date()
): T[] {
  return [...items].sort((a, b) => {
    const la = getLecture(a);
    const lb = getLecture(b);
    const pa = lecturePhase(la, now);
    const pb = lecturePhase(lb, now);
    if (PHASE_PRIORITY[pa] !== PHASE_PRIORITY[pb]) return PHASE_PRIORITY[pa] - PHASE_PRIORITY[pb];
    const ta = new Date(la.start_time).getTime();
    const tb = new Date(lb.start_time).getTime();
    // Nothing's happened yet (ONGOING/UPCOMING) — soonest start first.
    // Already over (ENDED/CANCELLED) — most recently started first.
    return pa === "ENDED" || pa === "CANCELLED" ? tb - ta : ta - tb;
  });
}
