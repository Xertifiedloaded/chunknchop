import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { hasSameOrigin } from '@/lib/admin-api';
import { prisma } from '@/lib/prisma';
const schema = z
  .object({
    subscription: z.object({
      endpoint: z.string().url(),
      expirationTime: z.number().nullable().optional(),
      keys: z.object({ p256dh: z.string(), auth: z.string() }),
    }),
  })
  .strict();
export async function POST(req: Request) {
  if (!hasSameOrigin(req)) return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
  const session = await getSession(await headers());
  if (!session?.user)
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: 'Invalid push subscription' }, { status: 400 });
  const endpoint = parsed.data.subscription.endpoint;
  await prisma.$runCommandRaw({
    update: 'PushSubscription',
    updates: [
      {
        q: { endpoint },
        u: {
          $set: {
            userId: session.user.id,
            endpoint,
            subscription: parsed.data.subscription,
            updatedAt: new Date().toISOString(),
          },
          $setOnInsert: { _id: randomUUID(), createdAt: new Date().toISOString() },
        },
        upsert: true,
      },
    ],
  });
  return NextResponse.json({ subscribed: true });
}
export async function DELETE(req: Request) {
  if (!hasSameOrigin(req)) return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
  const session = await getSession(await headers());
  if (!session?.user)
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  const body = (await req.json().catch(() => null)) as { endpoint?: string } | null;
  if (!body?.endpoint) return NextResponse.json({ error: 'Endpoint required' }, { status: 400 });
  await prisma.$runCommandRaw({
    delete: 'PushSubscription',
    deletes: [{ q: { userId: session.user.id, endpoint: body.endpoint }, limit: 1 }],
  });
  return NextResponse.json({ unsubscribed: true });
}
