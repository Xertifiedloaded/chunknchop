import 'server-only';
import Pusher from 'pusher';

let client: Pusher | null = null;
export function getPusher() {
  const { PUSHER_APP_ID, PUSHER_KEY, PUSHER_SECRET, PUSHER_CLUSTER } = process.env;
  if (!PUSHER_APP_ID || !PUSHER_KEY || !PUSHER_SECRET || !PUSHER_CLUSTER) return null;
  if (!client)
    client = new Pusher({
      appId: PUSHER_APP_ID,
      key: PUSHER_KEY,
      secret: PUSHER_SECRET,
      cluster: PUSHER_CLUSTER,
      useTLS: true,
    });
  return client;
}
export async function publishOrderEvent(orderNumber: string, event: string, data: unknown) {
  const pusher = getPusher();
  if (!pusher) return false;
  await pusher.trigger(`private-order-${orderNumber}`, event, data);
  return true;
}
