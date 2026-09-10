"use client";

import { useState, useTransition } from "react";
import { setIndexNumberAction } from "@/app/actions/admin";
import { inputClass, secondaryButtonClass, buttonClass } from "@/components/ui";

// Inline "add/fix index number" control — mainly for course reps registered
// before an index number was required for that role (see routes/users.js),
// since without one on file they can never pass the check-in identity check
// in routes/attendance.js. Shown as plain text once a value exists; shown as
// a small form when it's missing.
export default function SetIndexNumberButton({
  userId,
  currentValue,
  path,
}: {
  userId: string;
  currentValue: string | null;
  path: string;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (currentValue && !editing) {
    return <span className="text-xs text-slate-400">{currentValue}</span>;
  }

  if (!editing) {
    return (
      <button
        type="button"
        className={`${secondaryButtonClass} !py-1.5 !px-3 text-xs`}
        onClick={() => setEditing(true)}
      >
        Add index number
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-1 items-end">
      <div className="flex gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="e.g. ECE/24/001"
          className={`${inputClass} !py-1.5 !px-2 text-xs w-36`}
          autoFocus
        />
        <button
          type="button"
          disabled={pending || !value.trim()}
          className={`${buttonClass} !py-1.5 !px-3 text-xs`}
          onClick={() => {
            setError(null);
            startTransition(async () => {
              const res = await setIndexNumberAction(userId, value, path);
              if (res.error) {
                setError(res.error);
              } else {
                setEditing(false);
              }
            });
          }}
        >
          {pending ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          className={`${secondaryButtonClass} !py-1.5 !px-3 text-xs`}
          onClick={() => {
            setEditing(false);
            setError(null);
          }}
        >
          Cancel
        </button>
      </div>
      {error && <p className="text-xs text-red-600 max-w-[16rem] text-right">{error}</p>}
    </div>
  );
}
