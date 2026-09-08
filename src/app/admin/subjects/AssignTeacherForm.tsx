"use client";

import { useActionState } from "react";
import { assignTeacherAction } from "@/app/actions/admin";
import type { FormState } from "@/components/ActionForm";
import { inputClass, secondaryButtonClass } from "@/components/ui";
import type { UserRow } from "@/lib/types";

export default function AssignTeacherForm({
  subjectId,
  teachers,
  currentTeacherId,
}: {
  subjectId: string;
  teachers: UserRow[];
  currentTeacherId: string | null;
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(assignTeacherAction, {});

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="subjectId" value={subjectId} />
      <select
        name="teacherId"
        defaultValue={currentTeacherId ?? ""}
        className={`${inputClass} !py-1.5 text-xs w-44`}
      >
        <option value="">Unassigned</option>
        {teachers.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
      <button type="submit" disabled={pending} className={`${secondaryButtonClass} !py-1.5 !px-3 text-xs`}>
        {pending ? "Saving…" : "Save"}
      </button>
      {state.error && <span className="text-xs text-red-600">{state.error}</span>}
    </form>
  );
}
