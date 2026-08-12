import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { verifyPassword, generateAccessToken, generateRefreshToken } from '@/lib/auth';
import { z } from 'zod';

// Minimal in-memory rate limiter (per-IP, sliding window). Good for demo; use Redis for production.
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 10; // allow 10 requests per window
const rateLimits: Map<string, { count: number; firstRequest: number }> = new Map();

function isRateLimited(ip: string) {
  const now = Date.now();
  const entry = rateLimits.get(ip);
  if (!entry) {
    rateLimits.set(ip, { count: 1, firstRequest: now });
    return false;
  }
  if (now - entry.firstRequest > RATE_LIMIT_WINDOW_MS) {
    // reset window
    rateLimits.set(ip, { count: 1, firstRequest: now });
    return false;
  }
  entry.count += 1;
  rateLimits.set(ip, entry);
  return entry.count > RATE_LIMIT_MAX;
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = loginSchema.parse(body);

    // basic rate limit per IP
    const ip = req.headers.get('x-forwarded-for') || req.ip || req.headers.get('x-real-ip') || 'unknown';
    if (isRateLimited(ip)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    if (!verifyPassword(password, user.password)) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const accessToken = generateAccessToken(user.id, user.email, user.role);
    const refreshToken = generateRefreshToken();

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const response = NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        accessToken,
      },
      { status: 200 }
    );

    response.cookies.delete('accessToken');

    // Set refresh token as httpOnly cookie (not accessible to JS)
    response.cookies.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    // Set a CSRF cookie (readable by JS) for double-submit CSRF protection
    const csrfToken = Math.random().toString(36).substring(2);
    response.cookies.set('csrfToken', csrfToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    // NOTE: Access token is returned in the response body and SHOULD NOT be persisted to disk by the client.
    // The server will not set an httpOnly accessToken cookie anymore.

    return response;
  } catch (error) {
    console.error('[v0] Login error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
