
import type { NextRequest } from "next/server";

const store = new Map<string, { count: number; start: number }>();
const MAX_ENTRIES = 5000;

export function isRateLimited(key: string, { max, windowMs }: { max: number; windowMs: number }) {
  const now = Date.now();
  if (store.size > MAX_ENTRIES) {
    for (const [k, v] of store) {
      if (now - v.start > windowMs) store.delete(k);
    }
  }

  const entry = store.get(key);
  if (!entry || now - entry.start > windowMs) {
    store.set(key, { count: 1, start: now });
    return false;
  }

  entry.count += 1;
  return entry.count > max;
}

export function getIp(req: NextRequest) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
}