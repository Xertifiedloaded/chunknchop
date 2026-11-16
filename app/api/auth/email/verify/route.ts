import { NextRequest, NextResponse } from 'next/server';
import {
  createSession,
  hasSameOrigin,
  isValidEmail,
  normalizeEmail,
  requestIp,
  takeRateLimit,
} from '@/lib/auth';
import { consumeEmailCode } from '@/lib/auth-email';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  if (!hasSameOrigin(request))
    return NextResponse.json({ error: 'Request could not be verified.' }, { status: 403 });
  const body = await request.json().catch(() => null);
  const email = normalizeEmail(body?.email);
  if (
    !isValidEmail(email) ||
    !(await takeRateLimit(`verify:${email}:${requestIp(request)}`, 10, 15 * 60_000))
  ) {
    return NextResponse.json(
      { error: 'That code could not be verified. Request a new code and try again.' },
      { status: 400 },
    );
  }
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.emailVerified || !(await consumeEmailCode(email, 'verify', body?.code))) {
    return NextResponse.json(
      { error: 'That code could not be verified. Request a new code and try again.' },
      { status: 400 },
    );
  }

  await prisma.user.update({ where: { id: user.id }, data: { emailVerified: true } });
  const response = NextResponse.json({
    ok: true,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
  await createSession(user.id, request, response);
  return response;
}
