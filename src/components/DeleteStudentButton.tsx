"use client";

import { useState, useTransition } from "react";
import { deleteUserAction } from "@/app/actions/admin";
import { secondaryButtonClass } from "@/components/ui";

// Deletes a student's account outright — also removes their device binding
// and attendance history server-side (see routes/users.js's DELETE /:id for
// why). There's no undo, so this asks twice: once with a plain confirm(),
// then again by requiring the admin to re-type the student's name — the same
// friction pattern as most "delete account" flows, since this one action
// can't be walked back the way deactivating a student can.
//
// Deleting a student is gated to level 400 (completed their program) —
// enforced server-side (routes/users.js's DELETE /:id is the source of
// truth), but reflected here too so the admin sees why up front instead of
// clicking through the confirm flow only to hit an error.
export default function DeleteStudentButton({
  userId,
  userName,
  level,
  path,
}: {
  userId: string;
  userName: string;
  level: number | null;
  path: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [typed, setTyped] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const completed = level === 400;

  if (!confirming) {
    return (
      <button
        type="button"
        disabled={!completed}
        title={
          completed
            ? undefined
            : `${userName} hasn't completed their program yet (${level ? `currently level ${level}` : "no level on file"}) — only students at level 400 can be deleted. Deactivate them instead if needed now.`
        }
        className={`${secondaryButtonClass} !py-1.5 !px-3 text-xs !text-red-600 !border-red-200 hover:!bg-red-50 disabled:!text-slate-400 disabled:!border-slate-200 disabled:hover:!bg-transparent`}
        onClick={() => setConfirming(true)}
      >
        Delete
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-1.5 items-end">
      <p className="text-xs text-red-700 max-w-[16rem] text-right">
        This permanently deletes {userName}&apos;s account, device binding, and attendance history. Type their name
        to confirm.
      </p>
      <input
        value={typed}
        onChange={(e) => setTyped(e.target.value)}
        placeholder={userName}
        className="rounded-lg border border-red-300 px-2 py-1 text-xs w-40 text-right focus:outline-none focus:ring-2 focus:ring-red-100"
        autoFocus
      />
      <div className="flex gap-2">
        <button
          type="button"
          disabled={pending || typed.trim() !== userName.trim()}
          className="inline-flex items-center justify-center rounded-lg bg-red-600 text-white text-xs font-medium px-3 py-1.5 hover:bg-red-700 disabled:opacity-50 transition"
          onClick={() => {
            setError(null);
            startTransition(async () => {
              const res = await deleteUserAction(userId, path);
              if (res.error) setError(res.error);
            });
          }}
        >
          {pending ? "Deleting…" : "Confirm delete"}
        </button>
        <button
          type="button"
          className={`${secondaryButtonClass} !py-1.5 !px-3 text-xs`}
          onClick={() => {
            setConfirming(false);
            setTyped("");
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
