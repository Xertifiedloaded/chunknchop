import { NextRequest, NextResponse } from 'next/server';
import { pusher } from '@/lib/pusher';
import { getUserFromRequest } from '@/lib/request';

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { socket_id, channel_name } = body;

    if (!socket_id || !channel_name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Only allow users to subscribe to their own private channels
    if (channel_name.startsWith('private-user-') && !channel_name.includes(user.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Authenticate the subscription
    const auth = pusher.authenticateUser(socket_id, {
      id: user.id,
      info: {
        email: user.email,
      },
    });

    return NextResponse.json(auth);
  } catch (error) {
    console.error('Pusher auth error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
