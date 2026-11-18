import { randomBytes, scrypt as scryptCallback, timingSafeEqual, createHash } from 'node:crypto';
import type { NextRequest, NextResponse } from 'next/server';
import type { User } from '@prisma/client';
import { prisma } from '@/lib/prisma';

function deriveScrypt(password: string, salt: Buffer) {
  return new Promise<Buffer>((resolve, reject) => {
    scryptCallback(password, salt, 64, scryptOptions, (error, derived) => {
      if (error) reject(error);
      else resolve(derived as Buffer);
    });
  });
}

const sessionCookieName = 'chunknchop';
const sessionLifetimeMs = 7 * 24 * 60 * 60 * 1000;
const scryptOptions = { N: 16_384, r: 16, p: 1, maxmem: 128 * 1024 * 1024 };

type AuthUser = Pick<
  User,
  'id' | 'name' | 'email' | 'emailVerified' | 'image' | 'role'
>;
type AuthSession = { id: string; expiresAt: Date; user: AuthUser };

export const isGoogleAuthEnabled = Boolean(
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
);

export function normalizeEmail(value: unknown) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

export function hashToken(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

export function createOpaqueToken(bytes = 32) {
  return randomBytes(bytes).toString('base64url');
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const derived = await deriveScrypt(password, salt);
  return `${salt.toString('hex')}:${derived.toString('hex')}`;
}

export async function verifyPassword(password: string, storedHash?: string | null) {
  const [saltHex, hashHex, extra] = (storedHash ?? '').split(':');
  const wellFormed =
    !extra && /^[a-f0-9]{32}$/i.test(saltHex ?? '') && /^[a-f0-9]{128}$/i.test(hashHex ?? '');
  const salt = wellFormed ? Buffer.from(saltHex, 'hex') : Buffer.alloc(16);
  const expected = wellFormed ? Buffer.from(hashHex, 'hex') : Buffer.alloc(64);
  const actual = await deriveScrypt(password, salt);
  return wellFormed && timingSafeEqual(actual, expected);
}

export function getCookieValue(headers: Headers, name: string) {
  const cookieHeader = headers.get('cookie') ?? '';
  for (const part of cookieHeader.split(';')) {
    const separator = part.indexOf('=');
    if (separator < 0 || part.slice(0, separator).trim() !== name) continue;
    try {
      return decodeURIComponent(part.slice(separator + 1).trim());
    } catch {
      return '';
    }
  }
  return '';
}

export async function getSession(headers: Headers): Promise<AuthSession | null> {
  const rawToken = getCookieValue(headers, sessionCookieName);
  if (!rawToken || rawToken.length > 256) return null;

  const stored = await prisma.session.findUnique({
    where: { token: hashToken(rawToken) },
    include: { user: true },
  });
  if (!stored) return null;
  if (stored.expiresAt.getTime() <= Date.now()) {
    await prisma.session.delete({ where: { id: stored.id } }).catch(() => undefined);
    return null;
  }

  const { user } = stored;
  return {
    id: stored.id,
    expiresAt: stored.expiresAt,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      image: user.image,
      role: user.role,
    },
  };
}

export async function createSession(userId: string, request: NextRequest, response: NextResponse) {
  const rawToken = createOpaqueToken();
  const expiresAt = new Date(Date.now() + sessionLifetimeMs);
  await prisma.session.create({
    data: {
      token: hashToken(rawToken),
      userId,
      expiresAt,
      ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim().slice(0, 64),
      userAgent: request.headers.get('user-agent')?.slice(0, 512),
    },
  });

  response.cookies.set(sessionCookieName, rawToken, {
    httpOnly: true,
    secure: request.nextUrl.protocol === 'https:' || process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  });
}

export async function clearSession(request: NextRequest, response: NextResponse) {
  const rawToken = getCookieValue(request.headers, sessionCookieName);
  if (rawToken) {
    await prisma.session.deleteMany({ where: { token: hashToken(rawToken) } });
  }
  response.cookies.set(sessionCookieName, '', {
    httpOnly: true,
    secure: request.nextUrl.protocol === 'https:' || process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: new Date(0),
  });
}

export function hasSameOrigin(request: NextRequest) {
  const origin = request.headers.get('origin');
  if (!origin) return false;
  try {
    return new URL(origin).origin === request.nextUrl.origin;
  } catch {
    return false;
  }
}

export function safeReturnTo(value: unknown, fallback = '/account') {
  if (
    typeof value !== 'string' ||
    !value.startsWith('/') ||
    value.startsWith('//') ||
    value.includes('\\')
  )
    return fallback;
  return value.slice(0, 500);
}

export async function getCredentialAccount(userId: string) {
  return prisma.account.findFirst({
    where: { userId, providerId: 'credential' },
    select: { id: true, password: true },
  });
}

export async function createOrUpdateCredential(userId: string, password: string) {
  const hash = await hashPassword(password);
  const current = await getCredentialAccount(userId);
  if (current) {
    await prisma.account.update({ where: { id: current.id }, data: { password: hash } });
    return;
  }
  await prisma.account.create({
    data: { userId, providerId: 'credential', accountId: userId, password: hash },
  });
}

export function isValidEmail(email: string) {
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validPassword(password: unknown): password is string {
  return typeof password === 'string' && password.length >= 12 && password.length <= 256;
}

export async function takeRateLimit(key: string, limit: number, windowMs: number) {
  const identifier = `auth-rate:${hashToken(key)}`;
  const now = new Date();
  const existing = await prisma.verification.findFirst({
    where: { identifier },
    orderBy: { createdAt: 'desc' },
  });
  if (!existing || existing.expiresAt.getTime() <= now.getTime()) {
    await prisma.verification.create({
      data: { identifier, value: '1', expiresAt: new Date(now.getTime() + windowMs) },
    });
    return true;
  }
  const count = Number(existing.value);
  if (!Number.isSafeInteger(count) || count >= limit) return false;
  const result = await prisma.verification.updateMany({
    where: { id: existing.id, value: existing.value },
    data: { value: String(count + 1) },
  });
  return result.count === 1;
}

export function requestIp(request: NextRequest) {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim().slice(0, 64) || 'unknown';
}

export type { AuthSession, AuthUser };
