import type { NextResponse } from "next/server";

export const ACCESS_TOKEN_MAX_AGE_SECONDS =
  parseInt(process.env.ACCESS_TOKEN_MAX_AGE_SECONDS || "") || 15 * 60;
const REFRESH_TOKEN_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

const base = {
  path: "/",
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
};

export function setAuthCookies(
  res: NextResponse,
  tokens: { accessToken: string; refreshToken: string },
) {
  res.cookies.set("accessToken", tokens.accessToken, {
    ...base,
    httpOnly: true,
    maxAge: ACCESS_TOKEN_MAX_AGE_SECONDS,
  });
  res.cookies.set("refreshToken", tokens.refreshToken, {
    ...base,
    httpOnly: true,
    maxAge: REFRESH_TOKEN_MAX_AGE_SECONDS,
  });
  res.cookies.set("csrfToken", crypto.randomUUID(), {
    ...base,
    httpOnly: false,
    maxAge: REFRESH_TOKEN_MAX_AGE_SECONDS,
  });
}

export function clearAuthCookies(res: NextResponse) {
  for (const name of ["accessToken", "refreshToken", "csrfToken"]) {
    res.cookies.set(name, "", { ...base, maxAge: 0 });
  }
}
