import { timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createSession, getCookieValue, hashToken, safeReturnTo } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

function redirectUri(request: NextRequest) {
  return (
    process.env.GOOGLE_REDIRECT_URI ||
    new URL('/api/auth/google/callback', request.nextUrl.origin).toString()
  );
}

function clearStateCookie(response: NextResponse, request: NextRequest) {
  response.cookies.set('ff_google_state', '', {
    httpOnly: true,
    secure: request.nextUrl.protocol === 'https:' || process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/auth/google',
    expires: new Date(0),
  });
}

function signInError(request: NextRequest) {
  const response = NextResponse.redirect(new URL('/sign-in?error=google', request.nextUrl.origin));
  clearStateCookie(response, request);
  return response;
}

export async function GET(request: NextRequest) {
  const state = request.nextUrl.searchParams.get('state') ?? '';
  const cookieState = getCookieValue(request.headers, 'ff_google_state');
  const code = request.nextUrl.searchParams.get('code');
  if (
    !code ||
    !state ||
    !cookieState ||
    state.length !== cookieState.length ||
    !timingSafeEqual(Buffer.from(state), Buffer.from(cookieState))
  ) {
    return signInError(request);
  }

  const identifier = `google-state:${hashToken(state)}`;
  const stateRecord = await prisma.verification.findFirst({
    where: { identifier },
    orderBy: { createdAt: 'desc' },
  });
  if (!stateRecord || stateRecord.expiresAt.getTime() <= Date.now()) return signInError(request);
  await prisma.verification.deleteMany({ where: { identifier } });

  let oauthState: { verifier?: string; returnTo?: string };
  try {
    oauthState = JSON.parse(stateRecord.value);
  } catch {
    return signInError(request);
  }
  if (!oauthState.verifier) return signInError(request);

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return signInError(request);

  try {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri(request),
        grant_type: 'authorization_code',
        code_verifier: oauthState.verifier,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!tokenResponse.ok) return signInError(request);
    const tokenData = (await tokenResponse.json()) as { access_token?: string };
    if (!tokenData.access_token) return signInError(request);

    const profileResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
      signal: AbortSignal.timeout(10_000),
    });
    if (!profileResponse.ok) return signInError(request);
    const profile = (await profileResponse.json()) as {
      sub?: string;
      email?: string;
      email_verified?: boolean;
      name?: string;
      picture?: string;
    };
    const email = profile.email?.trim().toLowerCase() ?? '';
    if (!profile.sub || !email || profile.email_verified !== true || email.length > 254)
      return signInError(request);

    const linkedAccount = await prisma.account.findUnique({
      where: { providerId_accountId: { providerId: 'google', accountId: profile.sub } },
      select: { userId: true },
    });
    let user = linkedAccount
      ? await prisma.user.findUnique({ where: { id: linkedAccount.userId } })
      : await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name: profile.name?.trim().slice(0, 80) || email.split('@')[0],
          emailVerified: true,
          image: profile.picture?.startsWith('https://') ? profile.picture.slice(0, 2048) : null,
        },
      });
    } else if (!user.emailVerified) {
      user = await prisma.user.update({ where: { id: user.id }, data: { emailVerified: true } });
    }

    if (!linkedAccount) {
      await prisma.account.create({
        data: { userId: user.id, providerId: 'google', accountId: profile.sub },
      });
    }

    const destination = safeReturnTo(oauthState.returnTo);
    const response = NextResponse.redirect(new URL(destination, request.nextUrl.origin));
    clearStateCookie(response, request);
    await createSession(user.id, request, response);
    return response;
  } catch {
    return signInError(request);
  }
}
