import { NextRequest, NextResponse } from 'next/server';
import { clearSession, hasSameOrigin } from '@/lib/auth';

export async function POST(request: NextRequest) {
  if (!hasSameOrigin(request))
    return NextResponse.json({ error: 'Request could not be verified.' }, { status: 403 });
  const response = NextResponse.json({ ok: true });
  await clearSession(request, response);
  return response;
}
