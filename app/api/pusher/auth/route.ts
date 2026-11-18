import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getSession } from '@/lib/auth';
import { getPusher } from '@/lib/pusher';
import { findMongoDocument } from '@/lib/mongo-collections';
type O = { userId?: string; riderId?: string };
export async function POST(req: Request) {
  const s = await getSession(await headers());
  if (!s?.user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  const form = await req.formData();
  const socketId = String(form.get('socket_id') ?? '');
  const channelName = String(form.get('channel_name') ?? '');
  const match = /^private-order-(CNC-[A-F\d]{32})$/i.exec(channelName);
  if (!socketId || !match)
    return NextResponse.json({ error: 'Invalid channel request' }, { status: 400 });
  const order = await findMongoDocument<O>('StoreOrder', match[1]);
  if (!order || !(order.userId === s.user.id || order.riderId === s.user.id))
    return NextResponse.json({ error: 'Channel access denied' }, { status: 403 });
  const pusher = getPusher();
  if (!pusher)
    return NextResponse.json({ error: 'Real-time service is not configured' }, { status: 503 });
  return NextResponse.json(pusher.authorizeChannel(socketId, channelName));
}
