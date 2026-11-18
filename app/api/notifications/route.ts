import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getSession } from '@/lib/auth';
import { hasSameOrigin } from '@/lib/admin-api';
import { findMongoDocuments, updateMongoDocument } from '@/lib/mongo-collections';
type NoticeDoc = {
  _id: string;
  title: string;
  body: string;
  url: string;
  read?: boolean;
  createdAt: string;
};
export async function GET() {
  const session = await getSession(await headers());
  if (!session?.user)
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  const items = await findMongoDocuments<NoticeDoc>(
    'UserNotification',
    { userId: session.user.id },
    60,
  );
  return NextResponse.json(
    { notifications: items, unread: items.filter((n) => !n.read).length },
    { headers: { 'Cache-Control': 'private, no-store' } },
  );
}
export async function PATCH(req: Request) {
  if (!hasSameOrigin(req)) return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
  const session = await getSession(await headers());
  if (!session?.user)
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  const body = (await req.json().catch(() => null)) as { id?: string; all?: boolean } | null;
  if (body?.all) {
    const { prisma } = await import('@/lib/prisma');
    await prisma.$runCommandRaw({
      update: 'UserNotification',
      updates: [
        { q: { userId: session.user.id }, u: { $set: { read: true } }, multi: true, upsert: false },
      ],
    });
  } else if (body?.id) {
    await updateMongoDocument(
      'UserNotification',
      { _id: body.id, userId: session.user.id },
      { $set: { read: true } },
    );
  } else return NextResponse.json({ error: 'Notification id required' }, { status: 400 });
  return NextResponse.json({ updated: true });
}

export async function DELETE(req: Request) {
  if (!hasSameOrigin(req)) return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
  const session = await getSession(await headers());
  if (!session?.user)
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  const { prisma } = await import('@/lib/prisma');
  await prisma.$runCommandRaw({
    delete: 'UserNotification',
    deletes: [{ q: { userId: session.user.id }, limit: 0 }],
  });
  return NextResponse.json({ cleared: true });
}
