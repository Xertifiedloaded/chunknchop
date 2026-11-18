import { NextResponse } from 'next/server';
import { requireAdminApi, hasSameOrigin } from '@/lib/admin-api';
import { findMongoDocument, upsertMongoDocument } from '@/lib/mongo-collections';
const ID = 'delivery-settings';
type Settings = {
  _id: string;
  assignmentMode?: 'automatic' | 'manual';
  manualFallback?: boolean;
  maxActiveDeliveries?: number;
};
export async function GET() {
  const a = await requireAdminApi();
  if (a.response) return a.response;
  const settings = await findMongoDocument<Settings>('DeliverySettings', ID);
  return NextResponse.json({
    settings: {
      assignmentMode: settings?.assignmentMode ?? 'automatic',
      manualFallback: settings?.manualFallback ?? true,
      maxActiveDeliveries: settings?.maxActiveDeliveries ?? 1,
    },
  });
}
export async function PUT(req: Request) {
  if (!hasSameOrigin(req))
    return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 });
  const a = await requireAdminApi();
  if (a.response) return a.response;
  const body = await req.json().catch(() => null);
  if (
    !body ||
    !['automatic', 'manual'].includes(body.assignmentMode) ||
    typeof body.manualFallback !== 'boolean' ||
    ![1, 2, 3, 5].includes(body.maxActiveDeliveries)
  )
    return NextResponse.json({ error: 'Invalid delivery settings' }, { status: 400 });
  await upsertMongoDocument('DeliverySettings', ID, {
    assignmentMode: body.assignmentMode,
    manualFallback: body.manualFallback,
    maxActiveDeliveries: body.maxActiveDeliveries,
    updatedAt: new Date().toISOString(),
  });
  return NextResponse.json({ success: true });
}
