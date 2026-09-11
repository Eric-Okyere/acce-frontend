"use client";

import { useState, useTransition } from "react";
import { updateMySubjectsAction } from "@/app/actions/student";
import { Card, buttonClass } from "@/components/ui";

// Shown on the student dashboard in place of the "Your courses" list when
// the account has no explicit course selection yet (see
// app/student/page.tsx) — lets the student pick them right there instead of
// needing an admin to do it. See routes/users.js's PATCH /users/me/subjects.
export default function CourseSelector({ subjects }: { subjects: { id: string; name: string }[] }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  return (
    <Card className="p-5 border-blue-200 bg-blue-50/40">
      <h2 className="font-semibold text-slate-900 mb-1">Choose the courses you&apos;re offering</h2>
      <p className="text-sm text-slate-600 mb-3">
        This is what makes your name appear to your teachers for each course, so they can track your
        attendance.
      </p>
      {subjects.length === 0 ? (
        <p className="text-sm text-slate-500">No courses are set up for your program yet — ask your admin.</p>
      ) : (
        <div className="space-y-1.5 mb-4 max-h-48 overflow-y-auto">
          {subjects.map((s) => (
            <label key={s.id} className="flex items-center gap-2 text-sm text-slate-700">
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
      <button
        type="button"
        disabled={pending || selected.length === 0}
        className={buttonClass}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const res = await updateMySubjectsAction(selected);
            if (res.error) setError(res.error);
          });
        }}
      >
        {pending ? "Saving…" : "Save courses"}
      </button>
      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
    </Card>
  );
}
