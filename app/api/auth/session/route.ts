import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const session = await getSession(request.headers);
  return NextResponse.json(
    { user: session?.user ?? null },
    { headers: { 'Cache-Control': 'no-store, private' } },
  );
}
