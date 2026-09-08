"use client";

import { useEffect, useRef, useState } from "react";
import {
  resolveScanAction,
  checkInAction,
  checkOutAction,
  type ScanCandidate,
} from "@/app/actions/student";
import { Card, buttonClass, secondaryButtonClass, Badge } from "@/components/ui";

const DEVICE_ID_KEY = "acce_device_id";

function getOrCreateDeviceId(): string {
  try {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  } catch {
    // localStorage unavailable (private mode, etc.) — fall back to a per-session id.
    // Device binding will simply re-verify every session in that case.
    return crypto.randomUUID();
  }
}

type Stage = "idle" | "scanning" | "resolving" | "picking" | "submitting" | "done";

function getLocation(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("Your browser doesn't support location access, which is required to check in."));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    });
  });
}

export default function ScannerClient() {
  const [stage, setStage] = useState<Stage>("idle");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [hallName, setHallName] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<ScanCandidate[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [manualToken, setManualToken] = useState("");
  const [locating, setLocating] = useState(false);

  const readerRef = useRef<HTMLDivElement>(null);
  const scannerRef = useRef<import("html5-qrcode").Html5Qrcode | null>(null);

  async function startCamera() {
    setError(null);
    setStage("scanning");
    const { Html5Qrcode } = await import("html5-qrcode");
    const el = readerRef.current;
    if (!el) return;
    const scanner = new Html5Qrcode(el.id);
    scannerRef.current = scanner;
    try {
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        async (decodedText) => {
          await stopCamera();
          handleToken(decodedText);
        },
        undefined
      );
    } catch {
      setError("Couldn't access the camera. You can paste the hall's code manually below instead.");
      setStage("idle");
    }
  }

  async function stopCamera() {
    const scanner = scannerRef.current;
    if (scanner) {
      try {
        await scanner.stop();
        scanner.clear();
      } catch {
        // camera may already be stopped
      }
      scannerRef.current = null;
    }
  }

  useEffect(() => {
    return () => {
      void stopCamera();
    };
  }, []);

  async function handleToken(qrToken: string) {
    setToken(qrToken);
    setStage("resolving");
    setError(null);
    const result = await resolveScanAction(qrToken);
    if (result.error) {
      setError(result.error);
      setHallName(result.hallName ?? null);
      setStage("idle");
      return;
    }
    setHallName(result.hallName ?? null);
    setCandidates(result.candidates ?? []);
    setStage("picking");
  }

  async function handleAction(candidate: ScanCandidate, kind: "in" | "out") {
    if (!token) return;
    setStage("submitting");
    setError(null);
    setLocating(true);
    try {
      const pos = await getLocation();
      setLocating(false);
      const payload = {
        lectureId: candidate.lectureId,
        qrToken: token,
        deviceId: getOrCreateDeviceId(),
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy ?? null,
      };
      const result = kind === "in" ? await checkInAction(payload) : await checkOutAction(payload);
      if (result.error) {
        setError(result.error);
        setStage("picking");
      } else {
        setMessage(result.success ?? "Done.");
        setStage("done");
      }
    } catch (e) {
      setLocating(false);
      setError(
        e instanceof Error
          ? `Couldn't get your location: ${e.message}`
          : "Couldn't get your location. Make sure location access is allowed for this site."
      );
      setStage("picking");
    }
  }

  function reset() {
    setStage("idle");
    setError(null);
    setMessage(null);
    setHallName(null);
    setCandidates([]);
    setToken(null);
    setManualToken("");
  }

  return (
    <div className="space-y-4">
      {stage === "idle" && (
        <Card className="p-6 text-center">
          <p className="text-sm text-slate-600 mb-4">
            Scan the QR code posted in your lecture hall to check in or out.
          </p>
          <button onClick={startCamera} className={buttonClass}>
            📷 Start scanning
          </button>
          {error && <p className="text-sm text-red-600 mt-4">{error}</p>}

          <details className="mt-6 text-left">
            <summary className="text-xs text-slate-400 cursor-pointer">Camera not working?</summary>
            <div className="mt-2 flex gap-2">
              <input
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                placeholder="Paste the hall code here"
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <button
                onClick={() => manualToken.trim() && handleToken(manualToken.trim())}
                className={secondaryButtonClass}
              >
                Use code
              </button>
            </div>
          </details>
        </Card>
      )}

      {stage === "scanning" && (
        <Card className="p-4">
          <div id="qr-reader" ref={readerRef} className="rounded-xl overflow-hidden" />
          <button onClick={() => { void stopCamera(); reset(); }} className={`${secondaryButtonClass} w-full mt-3`}>
            Cancel
          </button>
        </Card>
      )}

      {stage === "resolving" && (
        <Card className="p-6 text-center text-sm text-slate-500">Checking that code…</Card>
      )}

      {(stage === "picking" || stage === "submitting") && (
        <Card className="p-5">
          {hallName && <p className="text-sm text-slate-500 mb-3">📍 {hallName}</p>}
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">
              {error}
            </p>
          )}
          {locating && <p className="text-sm text-slate-500 mb-3">Getting your location…</p>}
          <div className="space-y-3">
            {candidates.map((c) => (
              <div key={c.lectureId} className="border border-slate-200 rounded-xl p-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div>
                    <p className="font-medium text-slate-900">{c.subjectName}</p>
                    <p className="text-xs text-slate-400">
                      {new Date(c.startTime).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                      {" – "}
                      {new Date(c.endTime).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                    </p>
                  </div>
                  <Badge tone={c.phase === "ONGOING" ? "green" : c.phase === "ENDED" ? "slate" : "blue"}>
                    {c.phase}
                  </Badge>
                </div>
                <div className="mt-3 flex gap-2">
                  {!c.checkedIn && (
                    <button
                      disabled={stage === "submitting"}
                      onClick={() => handleAction(c, "in")}
                      className={`${buttonClass} flex-1`}
                    >
                      Check in
                    </button>
                  )}
                  {c.checkedIn && !c.checkedOut && (
                    <button
                      disabled={stage === "submitting"}
                      onClick={() => handleAction(c, "out")}
                      className={`${buttonClass} flex-1`}
                    >
                      Check out
                    </button>
                  )}
                  {c.checkedIn && c.checkedOut && (
                    <span className="flex-1 text-center text-sm text-emerald-700 py-2">
                      ✓ Complete for this lecture
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
          <button onClick={reset} className={`${secondaryButtonClass} w-full mt-4`}>
            Scan a different code
          </button>
        </Card>
      )}

      {stage === "done" && (
        <Card className="p-6 text-center">
          <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 mb-4">
            {message}
          </p>
          <button onClick={reset} className={buttonClass}>
            Scan again
          </button>
        </Card>
      )}
    </div>
  );
}
