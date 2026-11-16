import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getSession } from '@/lib/auth';

export function hasSameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  if (!origin) return false;

  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

export function isAdminUser(user: { role?: string | null; email?: string | null }) {
  const adminEmails = new Set(
    (process.env.ADMIN_EMAILS ?? '')
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );

  return (
    user.role === 'admin' || Boolean(user.email && adminEmails.has(user.email.trim().toLowerCase()))
  );
}

export async function requireAdminApi() {
  const session = await getSession(await headers());

  if (!session?.user) {
    return {
      user: null,
      response: NextResponse.json({ error: 'Authentication required' }, { status: 401 }),
    };
  }

  if (!isAdminUser(session.user)) {
    return {
      user: null,
      response: NextResponse.json({ error: 'Administrator access required' }, { status: 403 }),
    };
  }

  return { user: session.user, response: null };
}
