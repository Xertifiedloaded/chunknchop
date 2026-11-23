export type DeliveryPoint = { latitude?: number | null; longitude?: number | null };
export type DeliveryZoneShape = DeliveryPoint & { id: string; radiusMeters?: number | null };

export function distanceMeters(a: DeliveryPoint, b: DeliveryPoint) {
  if (a.latitude == null || a.longitude == null || b.latitude == null || b.longitude == null) return Infinity;
  const rad = (n: number) => (n * Math.PI) / 180;
  const dLat = rad(b.latitude - a.latitude);
  const dLon = rad(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function findDeliveryZone<T extends DeliveryZoneShape>(point: DeliveryPoint, zones: T[]): T | undefined {
  if (point.latitude == null || point.longitude == null) return undefined;
  return zones
    .filter((zone) => zone.latitude != null && zone.longitude != null && zone.radiusMeters != null && distanceMeters(point, zone) <= zone.radiusMeters)
    .sort((a, b) => distanceMeters(point, a) - distanceMeters(point, b))[0];
}
