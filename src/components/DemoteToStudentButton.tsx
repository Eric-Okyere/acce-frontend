"use client";

import { useState, useTransition } from "react";
import { demoteCourseRepAction } from "@/app/actions/admin";
import { secondaryButtonClass } from "@/components/ui";

// Reverts a course rep back to a plain student — clears their assigned
// subject and role server-side (see routes/users.js's demote-to-student
// route). Used when someone stops being a course rep but should keep
// their existing account, password, and attendance history as a student.
export default function DemoteToStudentButton({
  userId,
  userName,
  path,
}: {
  userId: string;
  userName: string;
  path: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <button
        type="button"
        disabled={pending}
        className={`${secondaryButtonClass} !py-1.5 !px-3 text-xs`}
        onClick={() => {
          if (
            !confirm(
              `Revert ${userName} to a plain student? They'll keep their account and password but will no longer be able to schedule lectures.`
            )
          ) {
            return;
          }
          setError(null);
          startTransition(async () => {
            const res = await demoteCourseRepAction(userId, path);
            if (res.error) setError(res.error);
          });
        }}
      >
        {pending ? "Reverting…" : "Revert to student"}
      </button>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}
