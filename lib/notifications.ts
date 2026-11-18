import 'server-only';

import { sendNotification, setVapidDetails } from 'web-push';

import { randomUUID } from 'node:crypto';
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
  userId: string;
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

function configure(): boolean {
  if (configured) return true;

  const subject = process.env.WEB_PUSH_SUBJECT;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;

  if (!subject || !publicKey || !privateKey) {
    return false;
  }

  try {
    setVapidDetails(subject, publicKey, privateKey);
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

export async function notifyUsers(userIds: string[], notice: Notice): Promise<void> {
  const ids = [...new Set(userIds.filter(Boolean))];

  if (!ids.length) return;

  const now = new Date().toISOString();
  const notificationData = serializeNoticeData(notice.data);

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
      } catch (error) {
        console.error(`Failed to save notification for user ${userId}:`, error);
      }
    }),
  );

  if (!configure()) return;

  let subscriptions: PushSubscriptionDoc[];

  try {
    subscriptions = await findMongoDocuments<PushSubscriptionDoc>(
      'PushSubscription',
      {
        userId: { $in: ids },
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
        const status = (error as { statusCode?: number }).statusCode;

        if (status === 404 || status === 410) {
          try {
            await prisma.$runCommandRaw({
              delete: 'PushSubscription',
              deletes: [
                {
                  q: {
                    _id: entry._id,
                  },
                  limit: 1,
                },
              ],
            });
          } catch (deleteError) {
            console.error('Failed to remove expired push subscription:', deleteError);
          }
        } else {
          console.error(`Push notification failed for user ${entry.userId}:`, error);
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
