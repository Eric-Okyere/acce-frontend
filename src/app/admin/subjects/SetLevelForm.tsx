"use client";

import { useActionState } from "react";
import { setSubjectLevelAction } from "@/app/actions/admin";
import type { FormState } from "@/components/ActionForm";
import { inputClass, secondaryButtonClass } from "@/components/ui";

const LEVELS = [100, 200, 300, 400];

export default function SetLevelForm({ subjectId, currentLevel }: { subjectId: string; currentLevel: number | null }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(setSubjectLevelAction, {});

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="subjectId" value={subjectId} />
      <select name="level" defaultValue={currentLevel ?? ""} className={`${inputClass} !py-1.5 text-xs w-24`}>
        <option value="" disabled>
          Level
        </option>
        {LEVELS.map((l) => (
          <option key={l} value={l}>
            {l}
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
