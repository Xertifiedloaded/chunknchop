'use client';

import dynamic from 'next/dynamic';
import { useCallback, useRef, useState } from 'react';
import { Search, LocateFixed, LoaderCircle } from 'lucide-react';

const LocationPickerMap = dynamic(() => import('./location-picker-map'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[300px] w-full items-center justify-center gap-2 bg-stone-50 text-xs text-stone-500">
      <LoaderCircle size={14} className="animate-spin" />
      Loading map…
    </div>
  ),
});

type Coordinates = {
  latitude: number;
  longitude: number;
};

type SearchItem = {
  display_name: string;
  lat: string;
  lon: string;
};

export default function LocationPicker({
  value,
  onChange,
  onAddressChange,
  radiusMeters = 0,
  className = '',
  defaultCenter = [7.1475, 3.3619],
}: {
  value?: Coordinates | null;
  onChange: (point: Coordinates) => void;
  onAddressChange?: (address: string) => void;
  radiusMeters?: number;
  className?: string;
  defaultCenter?: [number, number];
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  // Used to ignore stale reverse-geocode responses when the pin moves quickly
  const reverseRequestId = useRef(0);

  async function search() {
    if (!query.trim()) return;

    setSearching(true);
    setSearchError('');

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&q=${encodeURIComponent(query.trim())}`,
        {
          headers: {
            Accept: 'application/json',
          },
        },
      );

      if (!response.ok) {
        throw new Error('Search is temporarily unavailable. Try selecting on the map.');
      }

      const data = await response.json();

      setResults(Array.isArray(data) ? data : []);

      if (!Array.isArray(data) || data.length === 0) {
        setSearchError('No results found. Try a different search.');
      }
    } catch (error) {
      setSearchError(error instanceof Error ? error.message : 'Search failed.');
    } finally {
      setSearching(false);
    }
  }

  // Map click / marker drag → look up the address for the new pin
  const reportAddress = useCallback(
    async (point: Coordinates) => {
      if (!onAddressChange) return;

      const requestId = ++reverseRequestId.current;

      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${point.latitude}&lon=${point.longitude}`,
          { headers: { Accept: 'application/json' } },
        );

        if (!response.ok) return;

        const data = (await response.json()) as { display_name?: string };

        // A newer pin move happened while this request was in flight
        if (requestId !== reverseRequestId.current) return;

        if (data.display_name) onAddressChange(data.display_name);
      } catch {
        // Auto-fill is a convenience; the admin can still type the fields by hand
      }
    },
    [onAddressChange],
  );

  const handleMapChange = useCallback(
    (point: Coordinates) => {
      onChange(point);
      void reportAddress(point);
    },
    [onChange, reportAddress],
  );

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />

          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                void search();
              }
            }}
            placeholder="Search street, landmark, area or city"
            className="w-full rounded-lg border border-stone-200 bg-white py-2.5 pl-9 pr-3 text-xs outline-none focus:border-brand"
          />
        </div>

        <button
          type="button"
          onClick={() => void search()}
          disabled={searching}
          className="rounded-lg bg-brand px-3 text-xs font-semibold text-white disabled:opacity-60"
        >
          {searching ? <LoaderCircle size={14} className="animate-spin" /> : 'Search'}
        </button>
      </div>

      {results.length > 0 && (
        <div className="max-h-36 overflow-y-auto rounded-lg border border-stone-200 bg-white text-xs shadow-sm">
          {results.map((item, index) => (
            <button
              key={`${item.lat}-${item.lon}-${index}`}
              type="button"
              onClick={() => {
                // Cancel any in-flight reverse lookup so it can't overwrite this address
                reverseRequestId.current += 1;

                onChange({
                  latitude: Number(item.lat),
                  longitude: Number(item.lon),
                });
                onAddressChange?.(item.display_name);

                setResults([]);
                setQuery(item.display_name);
              }}
              className="block w-full border-b border-stone-100 px-3 py-2.5 text-left last:border-0 hover:bg-stone-50"
            >
              {item.display_name}
            </button>
          ))}
        </div>
      )}

      {searchError && <p className="text-[10px] text-amber-700">{searchError}</p>}

      <div className="overflow-hidden rounded-xl border border-stone-200">
        <LocationPickerMap
          value={value}
          onChange={handleMapChange}
          radiusMeters={radiusMeters}
          defaultCenter={defaultCenter}
        />
      </div>

      <p className="text-[10px] leading-4 text-stone-500">
        <LocateFixed size={12} className="mr-1 inline" />
        Tap the map to choose a pin
        {radiusMeters > 0 ? `; the circle shows the zone's ${radiusMeters} m radius.` : '.'} Search
        above to jump to a place.
      </p>

      {value && (
        <div className="rounded-md bg-stone-50 px-3 py-2 text-[10px] text-stone-600">
          Selected: {value.latitude.toFixed(5)}, {value.longitude.toFixed(5)}
        </div>
      )}
    </div>
  );
}