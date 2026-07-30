import { NextRequest, NextResponse } from 'next/server';
import { verifyTokenEdge } from '@/lib/auth-edge';

const PROTECTED_PREFIXES = ['/api/customer', '/api/supplier', '/api/admin'];

function getTokenFromRequest(req: NextRequest): string | null {
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return req.cookies.get('accessToken')?.value || null;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  if (!isProtected) {
    return NextResponse.next();
  }

  const token = getTokenFromRequest(req);

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized', code: 'NO_TOKEN' }, { status: 401 });
  }

  const payload = await verifyTokenEdge(token);

  if (!payload) {
    return NextResponse.json({ error: 'Session expired', code: 'TOKEN_EXPIRED' }, { status: 401 });
  }

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-user-id', payload.id);
  requestHeaders.set('x-user-email', payload.email);
  requestHeaders.set('x-user-role', payload.role);

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: ['/api/customer/:path*', '/api/supplier/:path*'],
};
