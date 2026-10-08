import { NextRequest, NextResponse } from "next/server";

import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "@/lib/auth";
import { clearAuthCookies, setAuthCookies } from "@/lib/auth-cookies";
import {
  consumeRefreshToken,
  revokeAllRefreshTokens,
  storeRefreshToken,
} from "@/lib/refresh-tokens";
import { findUserById } from "@/lib/users";

export const runtime = "nodejs";

function safeNext(value: string | null) {
  return value && value.startsWith("/") && !value.startsWith("//")
    ? value
    : "/";
}

async function rotate(req: NextRequest) {
  const token = req.cookies.get("refreshToken")?.value;
  const payload = token ? verifyRefreshToken(token) : null;
  if (!token || !payload) return null;

  try {
    if (!(await consumeRefreshToken(token))) {
      await revokeAllRefreshTokens(payload.id);
      return null;
    }

    const user = await findUserById(payload.id);
    if (!user) return null;

    const refreshToken = generateRefreshToken(user.id);
    await storeRefreshToken(user.id, refreshToken);

    return {
      accessToken: generateAccessToken(user.id, user.email, user.role),
      refreshToken,
    };
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const tokens = await rotate(req);

  if (!tokens) {
    const res = NextResponse.json(
      { error: "Session expired", code: "REFRESH_FAILED" },
      { status: 401 },
    );
    clearAuthCookies(res);
    return res;
  }

  const res = NextResponse.json({ ok: true });
  setAuthCookies(res, tokens);
  return res;
}

export async function GET(req: NextRequest) {
  const next = safeNext(req.nextUrl.searchParams.get("next"));
  const tokens = await rotate(req);

  if (!tokens) {
    const login = new URL("/auth/login", req.url);
    login.searchParams.set("next", next);
    const res = NextResponse.redirect(login);
    clearAuthCookies(res);
    return res;
  }

  const res = NextResponse.redirect(new URL(next, req.url));
  setAuthCookies(res, tokens);
  return res;
}
