"use client";

import { useActionState, useEffect, useRef } from "react";
import { buttonClass } from "@/components/ui";

export interface FormState {
  error?: string;
  success?: string;
}

export function ActionForm({
  action,
  children,
  submitLabel = "Save",
  pendingLabel,
  className = "",
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  children: React.ReactNode;
  submitLabel?: string;
  pendingLabel?: string;
  className?: string;
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state.success]);

  return (
    <form ref={formRef} action={formAction} className={className}>
      {children}
      {state.error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mt-3">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 mt-3">
          {state.success}
        </p>
      )}
      <button type="submit" disabled={pending} className={`${buttonClass} mt-3`}>
        {pending ? pendingLabel ?? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
