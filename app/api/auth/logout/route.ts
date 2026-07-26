import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const response = NextResponse.json({ message: 'Logged out successfully' }, { status: 200 });

    response.cookies.delete('refreshToken');

    return response;
  } catch (error) {
    console.error('[v0] Logout error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
