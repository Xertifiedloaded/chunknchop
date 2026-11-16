import { NextRequest, NextResponse } from 'next/server';
import {
  createSession,
  getCredentialAccount,
  hasSameOrigin,
  isValidEmail,
  normalizeEmail,
  requestIp,
  takeRateLimit,
  verifyPassword,
} from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  if (!hasSameOrigin(request))
    return NextResponse.json({ error: 'Request could not be verified.' }, { status: 403 });
  const body = await request.json().catch(() => null);
  const email = normalizeEmail(body?.email);
  const password = typeof body?.password === 'string' ? body.password : '';
  if (!isValidEmail(email) || !password || password.length > 256)
    return NextResponse.json({ error: 'Email or password is incorrect.' }, { status: 401 });
  const allowed = await takeRateLimit(`signin:${email}:${requestIp(request)}`, 10, 15 * 60 * 1000);
  if (!allowed)
    return NextResponse.json(
      { error: 'Too many attempts. Please wait before trying again.' },
      { status: 429 },
    );

  const user = await prisma.user.findUnique({ where: { email } });
  const account = user ? await getCredentialAccount(user.id) : null;
  const passwordMatches = await verifyPassword(password, account?.password);
  if (!user || !account || !passwordMatches)
    return NextResponse.json({ error: 'Email or password is incorrect.' }, { status: 401 });
  if (!user.emailVerified)
    return NextResponse.json(
      { error: 'Please verify your email before signing in.' },
      { status: 403 },
    );

  const response = NextResponse.json({
    ok: true,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
  await createSession(user.id, request, response);
  return response;
}
