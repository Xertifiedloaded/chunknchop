
import { NextRequest, NextResponse } from 'next/server';
import {
  clearSession,
  createOrUpdateCredential,
  hasSameOrigin,
  requestIp,
  takeRateLimit,
  validPassword,
} from '@/lib/auth';
import { consumePasswordResetOtp } from '@/lib/auth-email';
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
  const code = typeof body?.code === 'string' ? body.code.trim() : '';

  if (!/^\d{8}$/.test(code) || !validPassword(body?.password)) {
    return NextResponse.json(
      { error: 'Enter a valid 8-digit code and a password of at least 12 characters.' },
      { status: 400 },
    );
  }

   
  if (
    !(await takeRateLimit(
      `password-reset:${requestIp(request)}`,
      10,
      15 * 60_000,
    ))
  ) {
    return NextResponse.json(
      { error: 'Too many attempts. Request another code later.' },
      { status: 429 },
    );
  }

  const userId = await consumePasswordResetOtp(code);

  if (!userId) {
    return NextResponse.json(
      { error: 'That code is invalid or expired. Request a new code and try again.' },
      { status: 400 },
    );
  }

  try {
    await createOrUpdateCredential(userId, body.password);

     
    await prisma.session.deleteMany({ where: { userId } });

    const response = NextResponse.json({ ok: true });
    await clearSession(request, response);

    return response;
  } catch (error) {
    console.error('[password-reset] failed', error);

    return NextResponse.json(
      { error: 'We could not update your password. Please request a new code.' },
      { status: 500 },
    );
  }
}
