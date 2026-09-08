import { notFound } from "next/navigation";
import { requireSessionWithToken } from "@/lib/guard";
import * as api from "@/lib/api";
import { ApiError } from "@/lib/api";
import PrintButton from "./PrintButton";

export default async function HallPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { token } = await requireSessionWithToken(["ADMIN"]);
  const { id } = await params;

  let qr: { dataUrl: string; hallName: string };
  try {
    qr = await api.getHallQr(token, id);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }

  return (
    <div className="max-w-md mx-auto text-center py-10">
      <p className="text-xs uppercase tracking-wide text-slate-400 mb-1">Accra College of Education</p>
      <h1 className="text-2xl font-bold text-slate-900 mb-1">{qr.hallName}</h1>
      <p className="text-sm text-slate-500 mb-6">Scan to check in / check out of a lecture in this hall</p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={qr.dataUrl} alt={`QR code for ${qr.hallName}`} className="mx-auto w-72 h-72 border border-slate-200 rounded-xl p-4" />
      <p className="text-xs text-slate-400 mt-4">
        This QR code is unique to this hall and cryptographically signed — copies or edited images
        will be rejected by the system.
      </p>
      <div className="mt-8">
        <PrintButton />
      </div>
    </div>
  );
}
