'use client';

import { useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, LoaderCircle, LocateFixed } from 'lucide-react';

type Coordinates = {
  latitude: number;
  longitude: number;
};

const NUDGE = 0.0005; // roughly 55 m

function parseCoordinates(input: string): Coordinates | null {
  let text = input.trim();
  if (!text) return null;

  try {
    text = decodeURIComponent(text);
  } catch {
    // keep the raw text
  }

  const num = '(-?\\d+(?:\\.\\d+)?)';
  const patterns = [
    new RegExp(`@${num},${num}`), // .../@6.52,3.37,15z
    new RegExp(`!3d${num}!4d${num}`), // ...!3d6.52!4d3.37
    new RegExp(`[?&](?:q|query|ll|destination)=${num},\\s*${num}`), // ?q=6.52,3.37
    new RegExp(`^${num}\\s*[,\\s]\\s*${num}$`), // 6.52, 3.37
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match) continue;

    const latitude = Number(match[1]);
    const longitude = Number(match[2]);

    if (Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180) {
      return { latitude, longitude };
    }
  }

  return null;
}

export default function LocationPickerMap({
  value,
  onChange,
  radiusMeters = 0,
  defaultCenter = [7.1475, 3.3619],
}: {
  value?: Coordinates | null;
  onChange: (point: Coordinates) => void;
  radiusMeters?: number;
  defaultCenter?: [number, number];
}) {
  const [paste, setPaste] = useState('');
  const [message, setMessage] = useState('');
  const [locating, setLocating] = useState(false);

  const latitude = value?.latitude ?? defaultCenter[0];
  const longitude = value?.longitude ?? defaultCenter[1];

  const mapUrl = `https://maps.google.com/maps?q=${latitude},${longitude}&z=${value ? 16 : 13}&output=embed`;

  function applyPaste() {
    const point = parseCoordinates(paste);

    if (!point) {
      setMessage('Could not read that. Paste coordinates like 6.5244, 3.3792 or a full Google Maps link.');
      return;
    }

    setMessage('');
    setPaste('');
    onChange(point);
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      setMessage('Location is not supported on this device.');
      return;
    }

    setLocating(true);
    setMessage('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        onChange({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      () => {
        setLocating(false);
        setMessage('Could not get your location. Allow location access and try again.');
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  function nudge(dLat: number, dLng: number) {
    onChange({ latitude: latitude + dLat, longitude: longitude + dLng });
  }

  return (
    <div className="bg-white">
      <iframe
        title="Selected location"
        src={mapUrl}
        className="h-[300px] w-full border-0"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
      />

      <div className="space-y-2 border-t border-stone-200 bg-stone-50 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={useMyLocation}
            disabled={locating}
            className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700 disabled:opacity-60"
          >
            {locating ? (
              <LoaderCircle size={13} className="animate-spin" />
            ) : (
              <LocateFixed size={13} />
            )}
            Use my current location
          </button>

          {value && (
            <div className="ml-auto flex items-center gap-1">
              <button type="button" onClick={() => nudge(NUDGE, 0)} aria-label="Move pin north" className="rounded-md border border-stone-200 bg-white p-1.5 text-stone-600"><ArrowUp size={13} /></button>
              <button type="button" onClick={() => nudge(-NUDGE, 0)} aria-label="Move pin south" className="rounded-md border border-stone-200 bg-white p-1.5 text-stone-600"><ArrowDown size={13} /></button>
              <button type="button" onClick={() => nudge(0, -NUDGE)} aria-label="Move pin west" className="rounded-md border border-stone-200 bg-white p-1.5 text-stone-600"><ArrowLeft size={13} /></button>
              <button type="button" onClick={() => nudge(0, NUDGE)} aria-label="Move pin east" className="rounded-md border border-stone-200 bg-white p-1.5 text-stone-600"><ArrowRight size={13} /></button>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <input
            value={paste}
            onChange={(event) => setPaste(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                applyPaste();
              }
            }}
            placeholder="Paste coordinates or a Google Maps link"
            className="min-w-0 flex-1 rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs outline-none focus:border-brand"
          />
          <button
            type="button"
            onClick={applyPaste}
            className="rounded-lg bg-brand px-3 text-xs font-semibold text-white"
          >
            Set
          </button>
        </div>

        {radiusMeters > 0 && (
          <p className="text-[10px] text-stone-500">Zone radius: {radiusMeters} m</p>
        )}

        {message && <p className="text-[10px] text-amber-700">{message}</p>}
      </div>
    </div>
  );
}