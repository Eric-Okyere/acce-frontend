"use client";

import { useState, useTransition } from "react";
import { updateMyLevelAction } from "@/app/actions/student";
import { Card, buttonClass, inputClass } from "@/components/ui";

const LEVELS = [100, 200, 300, 400];

// Shown on the student dashboard in place of / alongside the courses prompt
// when the account has no level on file yet (see app/student/page.tsx) — lets
// the student set it right there instead of needing an admin to do it. See
// routes/users.js's PATCH /users/me/level.
export default function LevelSelector() {
  const [level, setLevel] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <Card className="p-5 border-blue-200 bg-blue-50/40">
      <h2 className="font-semibold text-slate-900 mb-1">What level are you?</h2>
      <p className="text-sm text-slate-600 mb-3">This helps your teachers and admin place you correctly.</p>
      <div className="flex items-center gap-2">
        <select value={level} onChange={(e) => setLevel(e.target.value)} className={`${inputClass} w-32`}>
          <option value="" disabled>
            Select…
          </option>
          {LEVELS.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={pending || !level}
          className={buttonClass}
          onClick={() => {
            setError(null);
            startTransition(async () => {
              const res = await updateMyLevelAction(Number(level));
              if (res.error) setError(res.error);
            });
          }}
        >
          {pending ? "Saving…" : "Save level"}
        </button>
      </div>
      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
    </Card>
  );
}
