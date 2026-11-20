'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

import 'leaflet/dist/leaflet.css';

type Coordinates = {
  latitude: number;
  longitude: number;
};

const pinIcon = L.divIcon({
  className: 'chunknchop-map-pin',
  html: '<div style="width:18px;height:18px;border-radius:50%;background:#b64b2c;border:3px solid white;box-shadow:0 1px 8px #0005"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

function MapMover({ point }: { point?: Coordinates | null }) {
  const map = useMap();

  useEffect(() => {
    if (!point) return;

    map.setView([point.latitude, point.longitude], Math.max(map.getZoom(), 16), { animate: true });
  }, [point?.latitude, point?.longitude, map]);

  return null;
}

function ClickHandler({ onPick }: { onPick: (point: Coordinates) => void }) {
  useMapEvents({
    click(event) {
      onPick({
        latitude: event.latlng.lat,
        longitude: event.latlng.lng,
      });
    },
  });

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
  const center: [number, number] = value ? [value.latitude, value.longitude] : defaultCenter;

  return (
    <MapContainer
      center={center}
      zoom={value ? 16 : 12}
      scrollWheelZoom
      className="h-[300px] w-full"
    >
      <MapMover point={value} />

      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <ClickHandler onPick={onChange} />

      {value && <Marker position={[value.latitude, value.longitude]} icon={pinIcon} />}

      {value && radiusMeters > 0 && (
        <Circle
          center={[value.latitude, value.longitude]}
          radius={radiusMeters}
          pathOptions={{
            color: '#b64b2c',
            fillColor: '#b64b2c',
            fillOpacity: 0.12,
          }}
        />
      )}
    </MapContainer>
  );
}
