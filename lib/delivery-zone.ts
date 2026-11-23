import { prisma } from '@/lib/prisma';
import { findDeliveryZone, distanceMeters, type DeliveryPoint } from '@/lib/delivery-geometry';
export type { DeliveryPoint } from '@/lib/delivery-geometry';
export async function resolveDeliveryZone(point: DeliveryPoint, requestedZoneId?: string | null) {
  if (requestedZoneId) {
    const selected = await prisma.deliveryZone.findFirst({ where: { id: requestedZoneId, active: true } });
    if (!selected) return null;
    if (point.latitude != null && point.longitude != null && selected.latitude != null && selected.longitude != null && selected.radiusMeters != null && distanceMeters(point, selected) > selected.radiusMeters) return null;
    return selected;
  }
  if (point.latitude == null || point.longitude == null) return null;
  const zones = await prisma.deliveryZone.findMany({
    where: { active: true, latitude: { not: null }, longitude: { not: null }, radiusMeters: { not: null } },
  });
  return findDeliveryZone(point, zones);
}
