import { prisma } from '@/lib/prisma';

export async function findEligibleRiders(zoneId: string) {
  return prisma.riderProfile.findMany({
    where: {
      verificationStatus: 'approved',
      isActive: true,
      isAvailable: true,
      zones: { some: { zoneId } },
      user: { role: 'rider' },
    },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
      zones: { include: { zone: true } },
    },
  });
}

export function distanceKm(
  aLat?: number | null,
  aLng?: number | null,
  bLat?: number | null,
  bLng?: number | null,
) {
  if ([aLat, aLng, bLat, bLng].some((v) => typeof v !== 'number')) return Number.POSITIVE_INFINITY;
  const rad = (n: number) => (n * Math.PI) / 180;
  const dLat = rad((bLat as number) - (aLat as number));
  const dLng = rad((bLng as number) - (aLng as number));
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(aLat as number)) * Math.cos(rad(bLat as number)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

export async function assignPaidOrderAutomatically(orderNumber: string) {
  const { findMongoDocument, updateMongoDocument } = await import('@/lib/mongo-collections');
  const { publishOrderEvent } = await import('@/lib/pusher');
  type Stored = {
    _id: string;
    paymentStatus?: string;
    status?: string;
    riderId?: string;
    delivery?: { area?: string; city?: string; region?: string };
    deliveryZoneId?: string;
  };
  const order = await findMongoDocument<Stored>('StoreOrder', orderNumber);
  if (
    !order ||
    order.paymentStatus !== 'paid' ||
    order.riderId ||
    ['delivered', 'cancelled'].includes(order.status ?? '')
  )
    return { assigned: false, reason: 'not-eligible-order' };
  const zone = order.deliveryZoneId
    ? await prisma.deliveryZone.findFirst({ where: { id: order.deliveryZoneId, active: true } })
    : await prisma.deliveryZone.findFirst({
        where: {
          name: { equals: order.delivery?.area ?? '', mode: 'insensitive' },
          city: { equals: order.delivery?.city ?? '', mode: 'insensitive' },
          state: { equals: order.delivery?.region ?? '', mode: 'insensitive' },
          active: true,
        },
      });
  if (!zone) return { assigned: false, reason: 'delivery-zone-not-found' };
  const settings = await findMongoDocument<{
    assignmentMode?: string;
    maxActiveDeliveries?: number;
  }>('DeliverySettings', 'delivery-settings');
  if (settings?.assignmentMode === 'manual') return { assigned: false, reason: 'manual-mode' };
  const eligible = await findEligibleRiders(zone.id);
  const max = settings?.maxActiveDeliveries ?? 1;
  const { findMongoDocuments } = await import('@/lib/mongo-collections');
  const ranked = await Promise.all(
    eligible.map(async (rider) => {
      const current = await findMongoDocuments<{ _id: string }>(
        'StoreOrder',
        { riderId: rider.userId, status: { $in: ['assigned', 'picked_up', 'out_for_delivery'] } },
        max + 1,
      );
      return { rider, activeCount: current.length };
    }),
  );
  ranked.sort((a, b) => a.activeCount - b.activeCount);
  for (const { rider, activeCount } of ranked) {
    if (activeCount >= max) continue;
    const at = new Date().toISOString();
    const result = await updateMongoDocument(
      'StoreOrder',
      {
        _id: orderNumber,
        paymentStatus: 'paid',
        riderId: { $exists: false },
        status: { $nin: ['delivered', 'cancelled'] },
      },
      {
        $set: {
          riderId: rider.userId,
          riderName: rider.user.name,
          riderEmail: rider.user.email,
          deliveryZoneId: zone.id,
          riderLocation: null,
          status: 'assigned',
          assignedAt: at,
          assignmentMode: 'automatic',
        },
        $push: {
          statusHistory: {
            status: 'assigned',
            at,
            note: `Automatically assigned to ${rider.user.name}`,
          },
        },
      },
    );
    if ((result as { n?: number }).n !== 1) continue;
    await prisma.riderProfile.update({ where: { id: rider.id }, data: { isAvailable: false } });
    await publishOrderEvent(orderNumber, 'delivery.assigned', {
      orderNumber,
      status: 'assigned',
      rider: {
        name: rider.user.name,
        photoUrl: rider.photoUrl,
        vehicleType: rider.vehicleType,
        vehicleColor: rider.vehicleColor,
        plateNumber: rider.plateNumber,
      },
    }).catch(() => undefined);
    return { assigned: true, riderId: rider.userId, zoneId: zone.id };
  }
  return { assigned: false, reason: 'no-eligible-rider' };
}
