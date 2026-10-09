import { NextRequest, NextResponse } from "next/server";

import { clearAuthCookies } from "@/lib/auth/cookies";
import { revokeRefreshToken } from "@/lib/auth/tokens";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const token = req.cookies.get("refreshToken")?.value;

  if (token) {
    try {
      await revokeRefreshToken(token);
    } catch {}
  }

  const res = NextResponse.json({ ok: true });
  clearAuthCookies(res);
  return res;
}
