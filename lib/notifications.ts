import 'server-only';

import { sendNotification, setVapidDetails } from 'web-push';
import { createECDH, createHash, randomUUID } from 'node:crypto';

import { prisma } from '@/lib/prisma';
import { findMongoDocuments } from '@/lib/mongo-collections';

type PushSubscriptionShape = {
  endpoint: string;
  expirationTime?: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
};

type PushSubscriptionDoc = {
  _id: string;
  userId?: string | null;
  anonymousId?: string | null;
  vapidKeyId?: string | null;
  subscription: PushSubscriptionShape;
};

type Notice = {
  title: string;
  body: string;
  url: string;
  tag?: string;
  data?: Record<string, unknown>;
};

let configured = false;
let currentKeyId: string | null = null;

/** Short fingerprint of a VAPID public key. Must match the client helper. */
export function getVapidKeyId(publicKey: string): string {
  return createHash('sha256')
    .update(Buffer.from(publicKey, 'base64url'))
    .digest('hex')
    .slice(0, 16);
}

function configure(): boolean {
  if (configured) return true;

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();
  const subject =
    process.env.VAPID_SUBJECT?.trim() || 'mailto:admin@chunknchop.com';

  if (!publicKey || !privateKey) {
    console.warn('Web Push disabled: VAPID keys are missing.');
    return false;
  }

  try {
    const decodedPrivateKey = Buffer.from(privateKey, 'base64url');

    if (decodedPrivateKey.length !== 32) {
      console.error(
        `Web Push disabled: VAPID private key must decode to 32 bytes. Received ${decodedPrivateKey.length} bytes.`,
      );
      return false;
    }

    const decodedPublicKey = Buffer.from(publicKey, 'base64url');

    if (decodedPublicKey.length !== 65 || decodedPublicKey[0] !== 0x04) {
      console.error('Web Push disabled: VAPID public key is invalid.');
      return false;
    }

    // Verify the public key really belongs to the private key.
    const ecdh = createECDH('prime256v1');
    ecdh.setPrivateKey(decodedPrivateKey);
    const derivedPublicKey = ecdh.getPublicKey().toString('base64url');

    if (derivedPublicKey !== publicKey) {
      console.error(
        'Web Push disabled: VAPID public and private keys are not a matching pair.',
      );
      return false;
    }

    setVapidDetails(subject, publicKey, privateKey);

    currentKeyId = getVapidKeyId(publicKey);
    configured = true;
    return true;
  } catch (error) {
    console.error('Web Push configuration failed:', error);
    return false;
  }
}

function serializeNoticeData(data?: Record<string, unknown>) {
  try {
    return JSON.parse(JSON.stringify(data ?? {}));
  } catch {
    return {};
  }
}

/** A subscription that can never succeed and should be deleted. */
function isDeadSubscription(error: unknown): boolean {
  const { statusCode, body } = error as { statusCode?: number; body?: string };
  const text = typeof body === 'string' ? body : '';

  if (statusCode === 404 || statusCode === 410) return true;

  // Subscription was created with a different VAPID key.
  if (statusCode === 403 && text.includes('VAPID credentials')) return true;
  if (statusCode === 400 && text.includes('VapidPkHashMismatch')) return true;

  return false;
}

async function removeSubscription(id: string) {
  try {
    await prisma.$runCommandRaw({
      delete: 'PushSubscription',
      deletes: [{ q: { _id: id }, limit: 1 }],
    });
  } catch (deleteError) {
    console.error('Failed to remove push subscription:', deleteError);
  }
}

export async function notifyUsers(
  userIds: string[],
  notice: Notice,
): Promise<void> {
  const ids = [...new Set(userIds.filter(Boolean))];

  if (!ids.length) return;

  const now = new Date().toISOString();
  const notificationData = serializeNoticeData(notice.data);

  // Save notifications and send realtime Pusher events.
  await Promise.all(
    ids.map(async (userId) => {
      try {
        await prisma.$runCommandRaw({
          insert: 'UserNotification',
          documents: [
            {
              _id: randomUUID(),
              userId,
              title: notice.title,
              body: notice.body,
              url: notice.url,
              tag: notice.tag ?? null,
              data: notificationData,
              read: false,
              createdAt: now,
            },
          ],
        });

        const { getPusher } = await import('@/lib/pusher');
        const pusher = getPusher();

        if (pusher) {
          await pusher
            .trigger(`private-user-${userId}`, 'user.notification.created', {
              title: notice.title,
              body: notice.body,
              url: notice.url,
              tag: notice.tag,
              createdAt: now,
            })
            .catch(() => undefined);
        }
      } catch (error) {
        console.error(`Failed to save notification for user ${userId}:`, error);
      }
    }),
  );

  // Push configuration problems should never block the calling flow.
  if (!configure()) return;

  let subscriptions: PushSubscriptionDoc[];

  try {
    // Only subscriptions created with the current VAPID key can succeed.
    subscriptions = await findMongoDocuments<PushSubscriptionDoc>(
      'PushSubscription',
      {
        userId: { $in: ids },
        vapidKeyId: currentKeyId,
      },
      500,
    );
  } catch (error) {
    console.error('Failed to retrieve push subscriptions:', error);
    return;
  }

  if (!subscriptions.length) return;

  await Promise.all(
    subscriptions.map(async (entry) => {
      try {
        await sendNotification(entry.subscription, JSON.stringify(notice), {
          TTL: 60 * 60 * 12,
        });
      } catch (error) {
        if (isDeadSubscription(error)) {
          await removeSubscription(entry._id);
        } else {
          console.error(
            `Push notification failed for user ${entry.userId}:`,
            error,
          );
        }
      }
    }),
  );
}

export async function notifyAdmins(notice: Notice): Promise<void> {
  const admins = await prisma.user.findMany({
    where: {
      role: {
        in: ['admin', 'superadmin'],
      },
    },
    select: {
      id: true,
    },
  });

  if (!admins.length) return;

  await notifyUsers(
    admins.map((admin) => admin.id),
    notice,
  );
}