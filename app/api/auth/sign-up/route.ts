import { NextRequest, NextResponse } from 'next/server';
import {
  createOrUpdateCredential,
  hasSameOrigin,
  isValidEmail,
  normalizeEmail,
  takeRateLimit,
  validPassword,
} from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { issueEmailCode } from '@/lib/auth-email';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  if (!hasSameOrigin(request))
    return NextResponse.json({ error: 'Request could not be verified.' }, { status: 403 });
  const body = await request.json().catch(() => null);
  const email = normalizeEmail(body?.email);
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  const password = body?.password;

  if (!isValidEmail(email) || !name || name.length > 80 || !validPassword(password)) {
    return NextResponse.json(
      { error: 'Enter a valid name and email, and a password of at least 12 characters.' },
      { status: 400 },
    );
  }
  if (
    !(await takeRateLimit(
      `signup:${email}:${request.headers.get('x-forwarded-for') ?? ''}`,
      5,
      60 * 60 * 1000,
    ))
  ) {
    return NextResponse.json(
      { error: 'Too many attempts. Please try again later.' },
      { status: 429 },
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing?.emailVerified)
    return NextResponse.json(
      { error: 'An account already uses this email. Sign in or reset its password.' },
      { status: 409 },
    );

  let user = existing;
  if (!user) {
    user = await prisma.user.create({ data: { email, name, emailVerified: false } });
  } else {
    await prisma.user.update({ where: { id: user.id }, data: { name } });
  }

  await createOrUpdateCredential(user.id, password);
  const sent = await issueEmailCode(email, name, 'verify');
  if (!sent)
    return NextResponse.json(
      {
        error:
          'We could not send a verification code. Check the email service configuration and try again.',
      },
      { status: 503 },
    );
  return NextResponse.json({ ok: true, email });
}
