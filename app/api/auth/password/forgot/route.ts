
import { NextRequest, NextResponse } from 'next/server';
import {
  hasSameOrigin,
  isValidEmail,
  normalizeEmail,
  requestIp,
  takeRateLimit,
} from '@/lib/auth';
import { issueEmailCode } from '@/lib/auth-email';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  if (!hasSameOrigin(request)) {
    return NextResponse.json(
      { error: 'Request could not be verified.' },
      { status: 403 },
    );
  }

  const body = await request.json().catch(() => null);
  const email = normalizeEmail(body?.email);

   
  if (!isValidEmail(email)) {
    return NextResponse.json({ ok: true });
  }

  if (
    !(await takeRateLimit(
      `forgot:${email}:${requestIp(request)}`,
      5,
      60 * 60_000,
    ))
  ) {
    return NextResponse.json({ ok: true });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      email: true,
      name: true,
      emailVerified: true,
    },
  });

  if (user?.emailVerified) {
    await issueEmailCode(user.email, user.name, 'reset');
  }

  return NextResponse.json({ ok: true });
}
