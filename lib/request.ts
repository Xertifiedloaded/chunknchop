import { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';

export function getTokenFromRequest(req: NextRequest): string | null {
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  const cookieToken = req.cookies.get('accessToken')?.value;
  if (cookieToken) {
    return cookieToken;
  }

  return null;
}

export function getUserFromRequest(req: NextRequest) {
  const token = getTokenFromRequest(req);
  if (!token) {
    return null;
  }
  return verifyToken(token);
}
