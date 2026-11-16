import { NextRequest, NextResponse } from 'next/server';
import { hasSameOrigin, isValidEmail, normalizeEmail, requestIp, takeRateLimit } from '@/lib/auth';
import { issueEmailCode } from '@/lib/auth-email';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  if (!hasSameOrigin(request))
    return NextResponse.json({ error: 'Request could not be verified.' }, { status: 403 });
  const body = await request.json().catch(() => null);
  const email = normalizeEmail(body?.email);
  if (
    !isValidEmail(email) ||
    !(await takeRateLimit(`resend:${email}:${requestIp(request)}`, 5, 60 * 60_000))
  ) {
    return NextResponse.json(
      { error: 'Please wait before requesting another code.' },
      { status: 429 },
    );
  }
  const user = await prisma.user.findUnique({ where: { email } });
  if (user && !user.emailVerified) {
    const sent = await issueEmailCode(email, user.name, 'verify');
    if (!sent)
      return NextResponse.json(
        { error: 'We could not send a code right now. Please try again shortly.' },
        { status: 503 },
      );
  }
  return NextResponse.json({ ok: true });
}
