"use client";

import { useState, useTransition } from "react";
import { resetUserPasswordAction } from "@/app/actions/admin";
import { secondaryButtonClass, buttonClass } from "@/components/ui";

// Shown inline, right on the admin page, and stays on screen (it does not
// auto-dismiss) until the admin closes it or resets another user — this is
// the only place the password is ever visible, since only a bcrypt hash is
// stored server-side (there's no "always show it" option — a stored
// password would mean every account is exposed in plain text the moment the
// database ever leaks, not just this one credential). Used on the Course
// reps, Teachers, and Students admin pages, and now the teacher Students
// page too (routes/users.js's PATCH /:id/reset-password accepts TEACHER as
// well as ADMIN, scoped to their own students), wherever someone needs to
// hand a person their login code — Copy, "Text it," and WhatsApp below make
// that a single tap once it's generated, so a student who forgot their
// password can be sent a fresh one immediately.
function toWhatsAppDigits(phone: string): string {
  // Ghana-specific, mirrors backend/src/lib/phone.js's normalizePhone in
  // reverse: stored numbers are local ("0XXXXXXXXX"); wa.me needs the full
  // international number with no leading 0 ("233XXXXXXXXX").
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("233")) return digits;
  if (digits.startsWith("0")) return `233${digits.slice(1)}`;
  return digits;
}

export default function ResetPasswordButton({
  userId,
  userName,
  userPhone,
  path,
}: {
  userId: string;
  userName: string;
  userPhone: string;
  path: string;
}) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ tempPassword?: string; error?: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const message = result?.tempPassword
    ? `ACCE Attendance login for ${userName} — Phone: ${userPhone} · Temporary password: ${result.tempPassword}`
    : "";

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
            setCopied(false);
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
          <div className="flex flex-wrap gap-2 mt-2">
            <button
              type="button"
              className={`${buttonClass} !py-1 !px-2 !text-xs`}
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(message);
                  setCopied(true);
                } catch {
                  // clipboard unavailable — admin can still select the text above manually
                }
              }}
            >
              {copied ? "Copied ✓" : "Copy"}
            </button>
            <a
              href={`sms:${userPhone}?body=${encodeURIComponent(message)}`}
              className={`${secondaryButtonClass} !py-1 !px-2 !text-xs no-underline`}
            >
              Text it
            </a>
            <a
              href={`https://wa.me/${toWhatsAppDigits(userPhone)}?text=${encodeURIComponent(message)}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`${secondaryButtonClass} !py-1 !px-2 !text-xs no-underline !text-emerald-700 !border-emerald-300`}
            >
              WhatsApp
            </a>
            <button type="button" className="underline text-emerald-700" onClick={() => setResult(null)}>
              Dismiss
            </button>
          </div>
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
