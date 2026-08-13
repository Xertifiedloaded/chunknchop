import jwt from 'jsonwebtoken';
import type { TokenPayload } from '@/lib/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Verifies a JWT fully (signature + expiry) in environments used by middleware/edge code.
export function verifyTokenEdge(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;

    if (!decoded || !decoded.id || !decoded.email || !decoded.role) {
      return null;
    }

    return decoded;
  } catch {
    return null;
  }
}
