import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';

import { getSession } from '@/lib/auth';
import { hasSameOrigin } from '@/lib/admin-api';
import { prisma } from '@/lib/prisma';

const subscriptionSchema = z
  .object({
    endpoint: z.string().url().max(2048),
    expirationTime: z.number().nullable().optional(),
    keys: z
      .object({
        p256dh: z.string().min(1).max(512),
        auth: z.string().min(1).max(512),
      })
      .strict(),
  })
  .strict();

const schema = z
  .object({
    subscription: subscriptionSchema,
    anonymousId: z.string().regex(/^[a-f0-9-]{20,80}$/i).optional(),
    vapidKeyId: z.string().regex(/^[a-f0-9]{16}$/),
  })
  .strict();

export async function POST(req: Request) {
  try {
    if (!hasSameOrigin(req)) {
      return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
    }

    const session = await getSession(await headers());

    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid push subscription' },
        { status: 400 },
      );
    }

    if (!session?.user && !parsed.data.anonymousId) {
      return NextResponse.json(
        { error: 'Anonymous subscription id required' },
        { status: 400 },
      );
    }

    const { subscription, anonymousId, vapidKeyId } = parsed.data;
    const now = new Date().toISOString();
    const userId = session?.user?.id ?? null;

    const update = {
      $set: {
        userId,
        anonymousId: userId ? null : anonymousId ?? null,
        endpoint: subscription.endpoint,
        subscription,
        vapidKeyId,
        updatedAt: now,
      },
      $setOnInsert: {
        _id: randomUUID(),
        createdAt: now,
      },
    };

    // Endpoint uniquely identifies a browser subscription; upsert replaces stale details.
    await prisma.$runCommandRaw({
      update: 'PushSubscription',
      updates: [
        {
          q: { endpoint: subscription.endpoint },
          u: update,
          upsert: true,
        },
      ],
    });

    return NextResponse.json({ subscribed: true }, { status: 200 });
  } catch (error) {
    console.error('Push subscription registration failed:', error);

    return NextResponse.json(
      { error: 'Failed to register push subscription' },
      { status: 500 },
    );
  }
}

export async function DELETE(req: Request) {
  try {
    if (!hasSameOrigin(req)) {
      return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
    }

    const session = await getSession(await headers());

    const body = await req.json().catch(() => null);

    const parsed = z
      .object({
        endpoint: z.string().url().max(2048),
        anonymousId: z.string().regex(/^[a-f0-9-]{20,80}$/i).optional(),
      })
      .safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Endpoint required' }, { status: 400 });
    }

    const query: Record<string, string> = {
      endpoint: parsed.data.endpoint,
    };

    if (session?.user) {
      query.userId = session.user.id;
    } else if (parsed.data.anonymousId) {
      query.anonymousId = parsed.data.anonymousId;
    } else {
      return NextResponse.json(
        { error: 'Authentication or anonymous id required' },
        { status: 401 },
      );
    }

    await prisma.$runCommandRaw({
      delete: 'PushSubscription',
      deletes: [{ q: query, limit: 1 }],
    });

    return NextResponse.json({ unsubscribed: true }, { status: 200 });
  } catch (error) {
    console.error('Push subscription removal failed:', error);

    return NextResponse.json(
      { error: 'Failed to remove push subscription' },
      { status: 500 },
    );
  }
}