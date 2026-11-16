import { NextRequest, NextResponse } from 'next/server';
import {
  clearSession,
  createOrUpdateCredential,
  hasSameOrigin,
  isValidEmail,
  normalizeEmail,
  requestIp,
  takeRateLimit,
  validPassword,
} from '@/lib/auth';
import { consumeEmailCode } from '@/lib/auth-email';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  if (!hasSameOrigin(request))
    return NextResponse.json({ error: 'Request could not be verified.' }, { status: 403 });
  const body = await request.json().catch(() => null);
  const email = normalizeEmail(body?.email);
  if (!isValidEmail(email) || !validPassword(body?.password))
    return NextResponse.json(
      { error: 'Enter a valid email and a password of at least 12 characters.' },
      { status: 400 },
    );
  if (!(await takeRateLimit(`reset:${email}:${requestIp(request)}`, 10, 15 * 60_000)))
    return NextResponse.json(
      { error: 'Too many attempts. Request another code later.' },
      { status: 429 },
    );

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user?.emailVerified || !(await consumeEmailCode(email, 'reset', body?.code))) {
    return NextResponse.json(
      { error: 'That code could not be verified. Request a new code and try again.' },
      { status: 400 },
    );
  }

  await createOrUpdateCredential(user.id, body.password);
  await prisma.session.deleteMany({ where: { userId: user.id } });
  const response = NextResponse.json({ ok: true });
  await clearSession(request, response);
  return response;
}
