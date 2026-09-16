"use client";

import { useActionState, useState } from "react";
import { updateHallLocationAction } from "@/app/actions/admin";
import type { FormState } from "@/components/ActionForm";
import { secondaryButtonClass, buttonClass, inputClass } from "@/components/ui";

// Lets an admin change a hall's geofence radius after it's already been
// created. The 80m default set at creation (HallLocationFields'
// defaultRadius) was previously only ever set once and never editable from
// the UI, even though the backend route for it (api.updateHallLocation /
// updateHallLocationAction) already existed.
//
// Coordinates are intentionally NOT editable here — only the radius is.
// The backend's PATCH "/:id/location" route updates lat/lng and radius
// together, so this form still submits the hall's current lat/lng as
// hidden fields (unchanged) alongside the new radius, satisfying that
// route without exposing coordinate editing in the UI. Moving a hall to a
// different physical location is a rarer, more consequential change than
// tuning its radius, so it's left out of this quick control for now.
//
// Collapsed by default so it doesn't clutter every hall card — most halls
// are set up once and never touched again.
export default function EditHallLocationForm({
  hallId,
  latitude,
  longitude,
  radiusMeters,
}: {
  hallId: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<FormState, FormData>(updateHallLocationAction, {});

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={`${secondaryButtonClass} w-full !py-1.5 text-xs`}>
        Edit radius
      </button>
    );
  }

  return (
    <form action={formAction} className="space-y-3 border border-slate-200 rounded-lg p-3 bg-slate-50">
      <input type="hidden" name="hallId" value={hallId} />
      <input type="hidden" name="latitude" value={latitude} />
      <input type="hidden" name="longitude" value={longitude} />
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Geofence radius (meters)</label>
        <input name="radiusMeters" type="number" min={1} defaultValue={radiusMeters} className={inputClass} />
        <p className="text-xs text-slate-400 mt-1">
          How close a student&apos;s phone GPS must be to this hall to check in. Takes effect immediately on the
          existing printed QR code — no need to reprint it.
        </p>
      </div>
      {state.error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{state.error}</p>
      )}
      {state.success && (
        <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
          {state.success}
        </p>
      )}
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className={`${buttonClass} flex-1 !py-1.5 text-xs`}>
          {pending ? "Saving…" : "Save radius"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className={`${secondaryButtonClass} flex-1 !py-1.5 text-xs`}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
