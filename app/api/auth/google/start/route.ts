import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createOpaqueToken, hashToken, safeReturnTo } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

function redirectUri(request: NextRequest) {
  return (
    process.env.GOOGLE_REDIRECT_URI ||
    new URL('/api/auth/google/callback', request.nextUrl.origin).toString()
  );
}

export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret)
    return NextResponse.redirect(new URL('/sign-in?error=google', request.nextUrl.origin));

  const state = createOpaqueToken(32);
  const verifier = createOpaqueToken(48);
  const challenge = createHash('sha256').update(verifier).digest('base64url');
  const returnTo = safeReturnTo(request.nextUrl.searchParams.get('returnTo'));
  await prisma.verification.create({
    data: {
      identifier: `google-state:${hashToken(state)}`,
      value: JSON.stringify({ verifier, returnTo }),
      expiresAt: new Date(Date.now() + 10 * 60_000),
    },
  });

  const authorizationUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authorizationUrl.search = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri(request),
    response_type: 'code',
    scope: 'openid email profile',
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
    prompt: 'select_account',
  }).toString();

  const response = NextResponse.redirect(authorizationUrl);
  response.cookies.set('ff_google_state', state, {
    httpOnly: true,
    secure: request.nextUrl.protocol === 'https:' || process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/auth/google',
    maxAge: 600,
  });
  return response;
}
