"use client";

import { useState, useTransition } from "react";
import { resetUserPasswordAction } from "@/app/actions/admin";
import { secondaryButtonClass } from "@/components/ui";

// Shown inline, right on the admin page, and stays on screen (it does not
// auto-dismiss) until the admin closes it or resets another user — this is
// the only place the password is ever visible, since only a bcrypt hash is
// stored server-side. Used on the Course reps, Teachers, and Students admin
// pages wherever an admin needs to hand someone their login credentials.
export default function ResetPasswordButton({
  userId,
  userName,
  path,
}: {
  userId: string;
  userName: string;
  path: string;
}) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ tempPassword?: string; error?: string } | null>(null);

  return (
    <div className="inline-block">
      <button
        type="button"
        disabled={pending}
        className={`${secondaryButtonClass} !py-1.5 !px-3 text-xs`}
        onClick={() => {
          if (
            !confirm(
              `Reset ${userName}'s password? This immediately invalidates their current password — a new temporary one will be shown here for you to share with them.`
            )
          ) {
            return;
          }
          startTransition(async () => {
            const res = await resetUserPasswordAction(userId, path);
            setResult(res);
          });
        }}
      >
        {pending ? "Resetting…" : "Reset password"}
      </button>

      {result?.tempPassword && (
        <div className="mt-2 text-xs bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg px-3 py-2 max-w-xs">
          <p>
            New temporary password for <span className="font-medium">{userName}</span>:{" "}
            <span className="font-mono font-semibold">{result.tempPassword}</span>
          </p>
          <p className="mt-1 text-emerald-700">Share this with them now — it won&apos;t be shown again.</p>
          <button type="button" className="mt-1 underline text-emerald-700" onClick={() => setResult(null)}>
            Dismiss
          </button>
        </div>
      )}
      {result?.error && (
        <div className="mt-2 text-xs bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 max-w-xs">
          {result.error}
          <button type="button" className="ml-2 underline" onClick={() => setResult(null)}>
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
