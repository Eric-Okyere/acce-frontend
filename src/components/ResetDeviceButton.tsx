"use client";

import { useTransition } from "react";
import { resetDeviceAction } from "@/app/actions/admin";
import { secondaryButtonClass } from "@/components/ui";

// Shared between the Students and Course reps admin pages — a course rep's
// device binds and can need resetting the exact same way a student's does,
// since they check in the same way (see routes/attendance.js).
export default function ResetDeviceButton({
  studentId,
  studentName,
  path = "/admin/students",
}: {
  studentId: string;
  studentName: string;
  path?: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      className={`${secondaryButtonClass} !py-1.5 !px-3 text-xs`}
      onClick={() => {
        if (
          !confirm(
            `Reset ${studentName}'s device? They'll be able to check in from a new phone next time — do this only if their old device was lost, damaged, or replaced.`
          )
        ) {
          return;
        }
        startTransition(() => resetDeviceAction(studentId, path));
      }}
    >
      {pending ? "Resetting…" : "Reset device"}
    </button>
  );
}
