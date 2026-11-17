import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getSession } from '@/lib/auth';
import { isAdminUser } from '@/lib/admin-api';

export async function GET() {
  const session = await getSession(await headers());
  if (!session?.user)
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  return NextResponse.json({
    user: {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      emailVerified: session.user.emailVerified,
      role: isAdminUser(session.user)
        ? 'admin'
        : session.user.role === 'rider'
          ? 'rider'
          : 'customer',
    },
  });
}

