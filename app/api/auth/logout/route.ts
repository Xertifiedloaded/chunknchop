import { NextResponse } from 'next/server';

import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  // Attempt to revoke refresh token server-side
  try {
    // CSRF check
    const csrfHeader = req.headers.get('x-csrf-token');
    const csrfCookie = req.cookies.get('csrfToken')?.value;
    if (csrfCookie && (!csrfHeader || csrfHeader !== csrfCookie)) {
      const resp = NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });
      return resp;
    }

    const refreshToken = req.cookies.get('refreshToken')?.value ?? null;

    if (refreshToken) {
      try {
        const prisma = require('@/lib/db').default;
        await prisma.refreshToken.delete({ where: { token: refreshToken } }).catch(() => null);
      } catch (err) {
        // ignore DB errors, proceed to clear cookies
      }
    }
  } catch (e) {
    // best-effort only
  }

  const response = NextResponse.json({ success: true });

  response.cookies.delete('refreshToken');
  response.cookies.delete('csrfToken');
  response.cookies.delete('accessToken');

  return response;
}
