"use client";

import { useState, useTransition } from "react";
import { cancelLectureAction, endLectureAction } from "@/app/actions/lectures";
import { secondaryButtonClass } from "@/components/ui";

// End/Cancel for a lecture, as a client component so a genuine failure is
// actually shown instead of silently doing nothing. History: these used to
// be plain <form action={...}> submits to a Server Action that (a) didn't
// revalidate the list pages that render them (v3.42 fix) and (b) swallowed
// every error from the API call (v3.43 fix, this component) — together, a
// real rejection (already ended, already cancelled, no longer yours) looked
// exactly like the v3.42 bug: click the button, nothing visibly happens.
export function LectureActionButtons({
  lectureId,
  endable,
  cancellable,
  size = "compact",
}: {
  lectureId: string;
  endable: boolean;
  cancellable: boolean;
  size?: "compact" | "full";
}) {
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState<"end" | "cancel" | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!endable && !cancellable) return null;

  const sizeClass = size === "compact" ? "!py-1.5 !px-3 text-xs" : "";

  function run(action: (id: string) => Promise<{ error?: string }>, which: "end" | "cancel") {
    setError(null);
    setBusy(which);
    startTransition(async () => {
      const res = await action(lectureId);
      setBusy(null);
      if (res.error) setError(res.error);
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        {endable && (
          <button
            type="button"
            disabled={pending}
            onClick={() => run(endLectureAction, "end")}
            className={`${secondaryButtonClass} ${sizeClass} !text-green-700 !border-green-200 hover:!bg-green-50`}
          >
            {busy === "end" ? "Ending…" : size === "full" ? "End lecture" : "End"}
          </button>
        )}
        {cancellable && (
          <button
            type="button"
            disabled={pending}
            onClick={() => run(cancelLectureAction, "cancel")}
            className={`${secondaryButtonClass} ${sizeClass} !text-red-600 !border-red-200 hover:!bg-red-50`}
          >
            {busy === "cancel" ? "Cancelling…" : size === "full" ? "Cancel lecture" : "Cancel"}
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-600 max-w-[220px] text-right">{error}</p>}
    </div>
  );
}
