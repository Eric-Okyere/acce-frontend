"use client";

import { useState, useTransition } from "react";
import { reassignCourseRepSubjectAction } from "@/app/actions/admin";
import { inputClass, buttonClass } from "@/components/ui";

// Inline "which subject is this course rep responsible for" control — a
// select scoped to their own program plus an Assign button. Used both to
// assign a subject the first time it's missing and to reassign it later.
export default function AssignSubjectButton({
  userId,
  subjects,
  currentSubjectId,
  path,
}: {
  userId: string;
  subjects: { id: string; name: string }[];
  currentSubjectId: string | null;
  path: string;
}) {
  const [subjectId, setSubjectId] = useState(currentSubjectId ?? "");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <select
        value={subjectId}
        onChange={(e) => setSubjectId(e.target.value)}
        className={`${inputClass} !py-1.5 !text-xs w-auto`}
      >
        <option value="">Select subject…</option>
        {subjects.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
      <button
        type="button"
        disabled={pending || !subjectId || subjectId === currentSubjectId}
        className={`${buttonClass} !py-1.5 !px-3 text-xs`}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const res = await reassignCourseRepSubjectAction(userId, subjectId, path);
            if (res.error) setError(res.error);
          });
        }}
      >
        {pending ? "Saving…" : currentSubjectId ? "Reassign" : "Assign"}
      </button>
      {error && <p className="text-xs text-red-600 w-full">{error}</p>}
    </div>
  );
}
