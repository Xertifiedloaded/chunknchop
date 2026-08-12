import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { generateAccessToken, verifyToken, generateRefreshToken } from '@/lib/auth';

// Minimal in-memory rate limiter for refresh endpoint
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 30; // refreshes allowed per minute per IP
const rateLimits: Map<string, { count: number; firstRequest: number }> = new Map();
function isRateLimited(ip: string) {
  const now = Date.now();
  const entry = rateLimits.get(ip);
  if (!entry) {
    rateLimits.set(ip, { count: 1, firstRequest: now });
    return false;
  }
  if (now - entry.firstRequest > RATE_LIMIT_WINDOW_MS) {
    rateLimits.set(ip, { count: 1, firstRequest: now });
    return false;
  }
  entry.count += 1;
  rateLimits.set(ip, entry);
  return entry.count > RATE_LIMIT_MAX;
}

export async function POST(req: NextRequest) {
  try {
    const refreshToken = req.cookies.get('refreshToken')?.value;

    // rate-limit refresh attempts per IP
    const ip = req.headers.get('x-forwarded-for') || req.ip || req.headers.get('x-real-ip') || 'unknown';
    if (isRateLimited(ip)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    if (!refreshToken) {
      return NextResponse.json(
        {
          error: 'Refresh token missing',
          code: 'NO_REFRESH_TOKEN',
        },
        { status: 401 }
      );
    }

    // CSRF double-submit check: require X-CSRF-Token header to match csrfToken cookie
    const csrfHeader = req.headers.get('x-csrf-token');
    const csrfCookie = req.cookies.get('csrfToken')?.value;
    if (csrfCookie && (!csrfHeader || csrfHeader !== csrfCookie)) {
      const response = NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });
      response.cookies.delete('refreshToken');
      response.cookies.delete('csrfToken');
      response.cookies.delete('accessToken');
      return response;
    }

    const decoded = verifyToken(refreshToken);

    if (!decoded) {
      // Token invalid or corrupted. Clear cookies and require re-login.
      const response = NextResponse.json(
        {
          error: 'Refresh token invalid or expired',
          code: 'INVALID_REFRESH_TOKEN',
        },
        { status: 401 }
      );

      response.cookies.delete('refreshToken');
      response.cookies.delete('csrfToken');
      response.cookies.delete('accessToken');

      return response;
    }

    const storedRefreshToken = await prisma.refreshToken.findUnique({
      where: {
        token: refreshToken,
      },
      include: {
        user: true,
      },
    });

    if (!storedRefreshToken) {
      // Possible token reuse or theft: revoke all tokens for the user if identifiable.
      // We don't have user context here (because DB entry missing). Best effort: clear cookies and ask user to login.
      const response = NextResponse.json(
        {
          error: 'Invalid refresh token',
          code: 'INVALID_REFRESH_TOKEN',
        },
        { status: 401 }
      );

      response.cookies.delete('refreshToken');
      response.cookies.delete('csrfToken');
      response.cookies.delete('accessToken');

      return response;
    }

    if (storedRefreshToken.expiresAt < new Date()) {
      await prisma.refreshToken.delete({
        where: {
          token: refreshToken,
        },
      });

      const response = NextResponse.json(
        {
          error: 'Refresh token expired',
          code: 'REFRESH_TOKEN_EXPIRED',
        },
        { status: 401 }
      );

      response.cookies.delete('refreshToken');
      response.cookies.delete('csrfToken');
      response.cookies.delete('accessToken');

      return response;
    }

    const user = storedRefreshToken.user;

    // Rotate refresh token: create a new refresh token and replace the old DB entry
    const newRefreshToken = generateRefreshToken();

    // Create new DB entry and delete old one atomically-ish
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: newRefreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    await prisma.refreshToken.delete({ where: { token: refreshToken } });

    const accessToken = generateAccessToken(user.id, user.email, user.role);

    const response = NextResponse.json({
      accessToken,
    });

    response.cookies.delete('accessToken');

    // Set new refresh cookie
    response.cookies.set('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    // Rotate CSRF token as well
    const csrfToken = Math.random().toString(36).substring(2);
    response.cookies.set('csrfToken', csrfToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Refresh token error:', error);

    const response = NextResponse.json(
      {
        error: 'Unable to refresh session',
      },
      { status: 500 }
    );

    response.cookies.delete('refreshToken');
    response.cookies.delete('csrfToken');
    response.cookies.delete('accessToken');

    return response;
  }
}
