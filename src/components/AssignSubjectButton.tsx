"use client";

import { useState, useTransition } from "react";
import { reassignCourseRepSubjectsAction } from "@/app/actions/admin";
import { buttonClass } from "@/components/ui";

// Inline "which subject(s) is this course rep responsible for" control — a
// course rep can be assigned one or more courses, so this is a checkbox list
// (scoped to their own program) plus a Save button, rather than a single
// select. Used both to assign subjects the first time and to change them
// later — always sends the full replacement list to the backend.
export default function AssignSubjectButton({
  userId,
  subjects,
  currentSubjectIds,
  path,
}: {
  userId: string;
  subjects: { id: string; name: string }[];
  currentSubjectIds: string[];
  path: string;
}) {
  const [selected, setSelected] = useState<string[]>(currentSubjectIds);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const sortedCurrent = [...currentSubjectIds].sort();
  const sortedSelected = [...selected].sort();
  const changed = JSON.stringify(sortedCurrent) !== JSON.stringify(sortedSelected);

  function toggle(subjectId: string) {
    setSelected((prev) =>
      prev.includes(subjectId) ? prev.filter((id) => id !== subjectId) : [...prev, subjectId]
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {subjects.length === 0 ? (
        <p className="text-xs text-slate-400">No courses in this program yet.</p>
      ) : (
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {subjects.map((s) => (
            <label key={s.id} className="flex items-center gap-1.5 text-xs text-slate-700">
              <input
                type="checkbox"
                checked={selected.includes(s.id)}
                onChange={() => toggle(s.id)}
                className="rounded border-slate-300"
              />
              {s.name}
            </label>
          ))}
        </div>
      )}
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={pending || !changed || selected.length === 0}
          className={`${buttonClass} !py-1.5 !px-3 text-xs`}
          onClick={() => {
            setError(null);
            startTransition(async () => {
              const res = await reassignCourseRepSubjectsAction(userId, selected, path);
              if (res.error) setError(res.error);
            });
          }}
        >
          {pending ? "Saving…" : "Save"}
        </button>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    </div>
  );
}
