import Link from "next/link";
import { requireSessionWithToken } from "@/lib/guard";
import * as api from "@/lib/api";
import { createHallAction, toggleHallActiveAction } from "@/app/actions/admin";
import { ActionForm } from "@/components/ActionForm";
import { Card, PageHeader, inputClass, Badge, secondaryButtonClass } from "@/components/ui";
import HallLocationFields from "./HallLocationFields";

export default async function HallsPage() {
  const { token } = await requireSessionWithToken(["ADMIN"]);
  const halls = await api.listHalls(token);
  const withQr = await Promise.all(
    halls.map(async (h) => ({ hall: h, qr: (await api.getHallQr(token, h.id)).dataUrl }))
  );

  return (
    <div>
      <PageHeader
        title="Lecture halls"
        subtitle="Each hall gets a unique, signed QR code embedding its coordinates. Print it and post it in the hall — students must be physically inside the geofence to scan it successfully."
      />

      <div className="space-y-6">
        <Card className="p-5">
          <h2 className="font-semibold text-slate-900 mb-3">Add a lecture hall</h2>
          <ActionForm action={createHallAction} submitLabel="Create hall">
            <div className="max-w-md space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Hall name</label>
                <input name="name" required className={inputClass} placeholder="e.g. Block A — Room 101" />
              </div>
              <HallLocationFields />
            </div>
          </ActionForm>
        </Card>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {withQr.map(({ hall, qr }) => (
            <Card key={hall.id} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-medium text-slate-900">{hall.name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {hall.latitude.toFixed(5)}, {hall.longitude.toFixed(5)} · {hall.radius_meters}m radius
                  </p>
                </div>
                {!hall.is_active && <Badge tone="red">Inactive</Badge>}
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qr} alt={`QR code for ${hall.name}`} className="w-full max-w-[180px] mx-auto my-3" />
              <div className="flex gap-2">
                <Link
                  href={`/admin/halls/${hall.id}/print`}
                  className={`${secondaryButtonClass} flex-1 !py-1.5 text-xs`}
                >
                  Print QR
                </Link>
                <form action={toggleHallActiveAction.bind(null, hall.id, !hall.is_active)} className="flex-1">
                  <button type="submit" className={`${secondaryButtonClass} w-full !py-1.5 text-xs`}>
                    {hall.is_active ? "Deactivate" : "Reactivate"}
                  </button>
                </form>
              </div>
            </Card>
          ))}
          {halls.length === 0 && <p className="text-sm text-slate-500">No lecture halls yet.</p>}
        </div>
      </div>
    </div>
  );
}
