import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { prisma } from '@/lib/db';
import { generateAccessToken, generateRefreshToken, verifyPassword } from '@/lib/auth';
import { setAuthCookies } from '@/lib/auth-cookies';
import { storeRefreshToken } from '@/lib/refresh-tokens';

export const runtime = 'nodejs';

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 10;
const rateLimits = new Map<string, { count: number; start: number }>();

function isRateLimited(key: string) {
  const now = Date.now();
  const entry = rateLimits.get(key);

  if (!entry || now - entry.start > RATE_LIMIT_WINDOW_MS) {
    rateLimits.set(key, { count: 1, start: now });
    return false;
  }

  entry.count += 1;
  return entry.count > RATE_LIMIT_MAX;
}

function getIp(req: NextRequest) {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown';
}

const loginSchema = z.object({
  email: z.string().email().transform((value) => value.toLowerCase().trim()),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  if (isRateLimited(getIp(req))) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const { email, password } = loginSchema.parse(await req.json());

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !verifyPassword(password, user.password)) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const accessToken = generateAccessToken(user.id, user.email, user.role);
    const refreshToken = generateRefreshToken(user.id);
    await storeRefreshToken(user.id, refreshToken);

    const response = NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role, staffRole: user.staffRole },
    });

    setAuthCookies(response, { accessToken, refreshToken });
    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.issues }, { status: 400 });
    }

    const code = (error as { code?: string })?.code;
    if (code === 'P1001' || code === 'P1010') {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
    }

    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}