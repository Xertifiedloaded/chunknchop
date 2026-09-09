import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const accessToken = req.cookies.get('accessToken')?.value;

    if (!accessToken) {
      const resp = NextResponse.json({ error: 'No access token' }, { status: 401 });
      // clear any leftover cookies
      resp.cookies.delete('accessToken');
      resp.cookies.delete('refreshToken');
      resp.cookies.delete('csrfToken');
      return resp;
    }

    const payload = verifyToken(accessToken);

    if (!payload) {
      const resp = NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
      resp.cookies.delete('accessToken');
      resp.cookies.delete('refreshToken');
      resp.cookies.delete('csrfToken');
      return resp;
    }

    const user = await prisma.user.findUnique({ where: { id: payload.id } });

    if (!user) {
      const resp = NextResponse.json({ error: 'User not found' }, { status: 404 });
      resp.cookies.delete('accessToken');
      resp.cookies.delete('refreshToken');
      resp.cookies.delete('csrfToken');
      return resp;
    }

    return NextResponse.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (err) {
    console.error('Error in /api/auth/me', err);
    const resp = NextResponse.json({ error: 'Unable to validate session' }, { status: 500 });
    resp.cookies.delete('accessToken');
    resp.cookies.delete('refreshToken');
    resp.cookies.delete('csrfToken');
    return resp;
  }
}
