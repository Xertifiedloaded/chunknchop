import { jwtVerify } from 'jose';

import type { TokenPayload } from '@/lib/types';

let cachedKey: Uint8Array | null = null;

function getKey() {
  if (!cachedKey) {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET is not set');
    cachedKey = new TextEncoder().encode(secret);
  }
  return cachedKey;
}

export async function verifyTokenEdge(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getKey(), { algorithms: ['HS256'] });

    if (typeof payload.id !== 'string' || typeof payload.email !== 'string' || typeof payload.role !== 'string') {
      return null;
    }

    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}