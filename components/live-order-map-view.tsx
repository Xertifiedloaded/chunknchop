'use client';

import { useEffect } from 'react';
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from 'react-leaflet';

function FollowRider({ latitude, longitude }: { latitude: number; longitude: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([latitude, longitude], Math.max(map.getZoom(), 13), { animate: true });
  }, [latitude, longitude, map]);
  return null;
}

export default function LiveOrderMapView({
  latitude,
  longitude,
}: {
  latitude: number;
  longitude: number;
}) {
  return (
    <MapContainer
      center={[latitude, longitude]}
      zoom={13}
      scrollWheelZoom={false}
      className="order-map-canvas"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FollowRider latitude={latitude} longitude={longitude} />
      <CircleMarker
        center={[latitude, longitude]}
        radius={10}
        pathOptions={{ color: '#a9442c', fillColor: '#e86b3e', fillOpacity: 0.95, weight: 4 }}
      >
        <Popup>Your rider’s latest shared location</Popup>
      </CircleMarker>
    </MapContainer>
  );
}
