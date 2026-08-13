import { NextRequest, NextResponse } from 'next/server';
import { verifyTokenEdge } from '@/lib/auth-edge';

// Protect admin pages and sensitive API routes. Keep storefront/public routes untouched.
const API_PROTECTED_PREFIXES = ['/api/customer', '/api/supplier', '/api/admin'];
const PAGE_PROTECTED_PREFIXES = ['/admin'];

function getTokenFromRequest(req: NextRequest): string | null {
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  return req.cookies.get('accessToken')?.value || null;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isApiProtected = API_PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  const isPageProtected = PAGE_PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (!isApiProtected && !isPageProtected) {
    return NextResponse.next();
  }

  const token = getTokenFromRequest(req);

  if (!token) {
    if (isPageProtected) {
      // redirect browser pages to login
      const redirectUrl = new URL('/auth/login', req.url);
      const res = NextResponse.redirect(redirectUrl);
      // ensure cookies removed
      res.cookies.delete('accessToken');
      res.cookies.delete('refreshToken');
      res.cookies.delete('csrfToken');
      return res;
    }

    // API: return JSON 401
    return NextResponse.json({ error: 'Unauthorized', code: 'NO_TOKEN' }, { status: 401 });
  }

  const payload = await verifyTokenEdge(token);

  if (!payload) {
    if (isPageProtected) {
      const redirectUrl = new URL('/auth/login', req.url);
      const res = NextResponse.redirect(redirectUrl);
      res.cookies.delete('accessToken');
      res.cookies.delete('refreshToken');
      res.cookies.delete('csrfToken');
      return res;
    }

    // API: clear cookies and return 401 JSON
    const resp = NextResponse.json({ error: 'Session expired', code: 'TOKEN_EXPIRED' }, { status: 401 });
    resp.cookies.delete('accessToken');
    resp.cookies.delete('refreshToken');
    resp.cookies.delete('csrfToken');
    return resp;
  }

  // Attach user info to internal request headers for downstream API handlers
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-user-id', payload.id);
  requestHeaders.set('x-user-email', payload.email);
  requestHeaders.set('x-user-role', payload.role);

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ['/api/customer/:path*', '/api/supplier/:path*', '/api/admin/:path*', '/admin/:path*'],
};
