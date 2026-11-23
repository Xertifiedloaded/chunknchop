import { NextRequest, NextResponse } from 'next/server';
import { getSession, getCookieValue, hashToken, createOpaqueToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
const ACCESS_COOKIE = 'chunknchop';
const REFRESH_COOKIE = 'chunknchop_refresh';
const ACCESS_LIFETIME = 30 * 24 * 60 * 60 * 1000;
const REFRESH_LIFETIME = 90 * 24 * 60 * 60 * 1000;
const RENEW_ACCESS_AT = 7 * 24 * 60 * 60 * 1000;


function noStore() {
  return { headers: { 'Cache-Control': 'no-store, private' } };
}


function setAuthCookies(
  response: NextResponse,
  request: NextRequest,
  access: string,
  refresh: string,
  accessExpiry: Date,
  refreshExpiry: Date,
) {
  const secure = request.nextUrl.protocol === 'https:' || process.env.NODE_ENV === 'production';
  response.cookies.set(ACCESS_COOKIE, access, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    expires: accessExpiry,
  });
  response.cookies.set(REFRESH_COOKIE, refresh, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    expires: refreshExpiry,
  });
}


export async function GET(request: NextRequest) {
  const now = Date.now();
  const session = await getSession(request.headers);

  if (session) {
    const rawAccess = getCookieValue(request.headers, ACCESS_COOKIE);
    const rawRefresh = getCookieValue(request.headers, REFRESH_COOKIE);
    const response = NextResponse.json({ user: session.user, expiresAt: session.expiresAt }, noStore());

    // Legacy sessions are upgraded with a refresh cookie without changing their access token.
    if (!rawRefresh) {
      const refreshToken = createOpaqueToken();
      const refreshExpiry = new Date(now + REFRESH_LIFETIME);
      await prisma.session.update({
        where: { id: session.id },
        data: { refreshToken: hashToken(refreshToken), refreshExpiresAt: refreshExpiry },
      });
      setAuthCookies(response, request, rawAccess, refreshToken, session.expiresAt, refreshExpiry);
      return response;
    }

    // Rotate both opaque tokens before the access session reaches its expiry.
    if (session.expiresAt.getTime() - now < RENEW_ACCESS_AT) {
      const accessToken = createOpaqueToken();
      const refreshToken = createOpaqueToken();
      const accessExpiry = new Date(now + ACCESS_LIFETIME);
      const refreshExpiry = new Date(now + REFRESH_LIFETIME);
      await prisma.session.update({
        where: { id: session.id },
        data: {
          token: hashToken(accessToken),
          refreshToken: hashToken(refreshToken),
          expiresAt: accessExpiry,
          refreshExpiresAt: refreshExpiry,
        },
      });
      const renewed = NextResponse.json({ user: session.user, expiresAt: accessExpiry }, noStore());
      setAuthCookies(renewed, request, accessToken, refreshToken, accessExpiry, refreshExpiry);
      return renewed;
    }

    return response;
  }


  // If the 30-day access cookie expired, rotate using the 90-day refresh token.
  const rawRefresh = getCookieValue(request.headers, REFRESH_COOKIE);
  if (rawRefresh) {
    const stored = await prisma.session.findFirst({
      where: { refreshToken: hashToken(rawRefresh) },
      include: { user: true },
    });
    if (stored?.refreshExpiresAt && stored.refreshExpiresAt.getTime() > now) {
      const accessToken = createOpaqueToken();
      const refreshToken = createOpaqueToken();
      const accessExpiry = new Date(now + ACCESS_LIFETIME);
      const refreshExpiry = new Date(now + REFRESH_LIFETIME);
      await prisma.session.update({
        where: { id: stored.id },
        data: {
          token: hashToken(accessToken),
          refreshToken: hashToken(refreshToken),
          expiresAt: accessExpiry,
          refreshExpiresAt: refreshExpiry,
        },
      });
      const user = {
        id: stored.user.id,
        name: stored.user.name,
        email: stored.user.email,
        emailVerified: stored.user.emailVerified,
        image: stored.user.image,
        role: stored.user.role,
      };
      const response = NextResponse.json({ user, expiresAt: accessExpiry }, noStore());
      setAuthCookies(response, request, accessToken, refreshToken, accessExpiry, refreshExpiry);
      return response;
    }
  }


  const response = NextResponse.json({ user: null }, noStore());
  const secure = request.nextUrl.protocol === 'https:' || process.env.NODE_ENV === 'production';
  response.cookies.set(ACCESS_COOKIE, '', { httpOnly: true, secure, sameSite: 'lax', path: '/', expires: new Date(0) });
  response.cookies.set(REFRESH_COOKIE, '', { httpOnly: true, secure, sameSite: 'lax', path: '/', expires: new Date(0) });
  return response;
}