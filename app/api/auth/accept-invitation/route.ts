import { NextRequest, NextResponse } from 'next/server';
import {
  createSession,
  hasSameOrigin,
  isValidEmail,
  normalizeEmail,
  requestIp,
  takeRateLimit,
  validPassword,
  createOrUpdateCredential,
} from '@/lib/auth';
import { consumeEmailCode } from '@/lib/auth-email';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  if (!hasSameOrigin(request)) {
    return NextResponse.json({ error: 'Request could not be verified.' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const email = normalizeEmail(body?.email);
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  const code = body?.code;
  const password = body?.password;

  if (
    !isValidEmail(email) ||
    !name ||
    name.length > 80 ||
    typeof code !== 'string' ||
    !/^\d{8}$/.test(code) ||
    !validPassword(password)
  ) {
    return NextResponse.json(
      {
        error:
          'Enter your name, valid email, 8-digit invitation code and a password of at least 12 characters.',
      },
      { status: 400 },
    );
  }

  if (!(await takeRateLimit(`accept-invite:${email}:${requestIp(request)}`, 10, 15 * 60_000))) {
    return NextResponse.json(
      { error: 'Too many attempts. Please request a new invitation.' },
      { status: 429 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      role: true,
      emailVerified: true,
    },
  });

  if (
    !user ||
    user.emailVerified ||
    !['customer', 'admin', 'rider'].includes(user.role) ||
    !(await consumeEmailCode(email, 'invite', code))
  ) {
    return NextResponse.json(
      {
        error:
          'The invitation code is invalid or expired. Contact the administrator for a new invitation.',
      },
      { status: 400 },
    );
  }

  try {
    await createOrUpdateCredential(user.id, password);

    const updated = await prisma.user.updateMany({
      where: {
        id: user.id,
        emailVerified: false,
      },
      data: {
        name,
        emailVerified: true,
      },
    });

    if (updated.count !== 1) {
      await prisma.account.deleteMany({
        where: { userId: user.id, providerId: 'credential' },
      });

      return NextResponse.json(
        { error: 'This invitation has already been used or is no longer valid.' },
        { status: 409 },
      );
    }

    const response = NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        name,
        role: user.role,
      },
    });

    await createSession(user.id, request, response);

    return response;
  } catch (error) {
    console.error('[accept-invitation] failed', error);

    return NextResponse.json(
      {
        error:
          'We could not finish setting up your account. Please contact the administrator for a new invitation.',
      },
      { status: 500 },
    );
  }
}
