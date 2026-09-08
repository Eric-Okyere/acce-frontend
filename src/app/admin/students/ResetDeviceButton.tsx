"use client";

import { useTransition } from "react";
import { resetDeviceAction } from "@/app/actions/admin";
import { secondaryButtonClass } from "@/components/ui";

export default function ResetDeviceButton({ studentId, studentName }: { studentId: string; studentName: string }) {
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
        startTransition(() => resetDeviceAction(studentId));
      }}
    >
      {pending ? "Resetting…" : "Reset device"}
    </button>
  );
}
