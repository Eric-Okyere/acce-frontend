"use client";

import { useState } from "react";
import { inputClass, secondaryButtonClass } from "@/components/ui";

export default function HallLocationFields({
  defaultLat,
  defaultLng,
  defaultRadius = 80,
}: {
  defaultLat?: number;
  defaultLng?: number;
  defaultRadius?: number;
}) {
  const [lat, setLat] = useState(defaultLat != null ? String(defaultLat) : "");
  const [lng, setLng] = useState(defaultLng != null ? String(defaultLng) : "");
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);

  function useMyLocation() {
    if (!("geolocation" in navigator)) {
      setLocError("This browser doesn't support location access — enter coordinates manually.");
      return;
    }
    setLocating(true);
    setLocError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(7));
        setLng(pos.coords.longitude.toFixed(7));
        setLocating(false);
      },
      (err) => {
        setLocError(err.message || "Couldn't get your location — enter coordinates manually.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }

  return (
    <div className="space-y-3">
      <button type="button" onClick={useMyLocation} disabled={locating} className={`${secondaryButtonClass} w-full`}>
        {locating ? "Getting your location…" : "📍 Use my current location"}
      </button>
      {locError && <p className="text-xs text-red-600">{locError}</p>}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Latitude</label>
          <input
            name="latitude"
            required
            type="number"
            step="any"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            className={inputClass}
            placeholder="6.1631"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Longitude</label>
          <input
            name="longitude"
            required
            type="number"
            step="any"
            value={lng}
            onChange={(e) => setLng(e.target.value)}
            className={inputClass}
            placeholder="-0.5556"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Geofence radius (meters)
        </label>
        <input
          name="radiusMeters"
          type="number"
          min={10}
          max={500}
          defaultValue={defaultRadius}
          className={inputClass}
        />
        <p className="text-xs text-slate-400 mt-1">
          How close a student&apos;s phone GPS must be to this hall to check in. 80m is a reasonable
          default for GPS accuracy indoors.
        </p>
      </div>
    </div>
  );
}
