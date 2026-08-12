import { jwtDecode } from 'jwt-decode';
import type { TokenPayload } from '@/lib/auth';

export function verifyTokenEdge(token: string): TokenPayload | null {
  try {
    const decoded = jwtDecode<TokenPayload>(token);

    if (!decoded || !decoded.id || !decoded.email || !decoded.role) {
      return null;
    }

    if (decoded.exp && decoded.exp * 1000 < Date.now()) {
      return null;
    }

    return decoded;
  } catch {
    return null;
  }
}
