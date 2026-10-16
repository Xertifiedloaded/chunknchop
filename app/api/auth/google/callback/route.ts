
import { NextRequest, NextResponse } from "next/server";

import { exchangeCodeForProfile, getAppUrl, OAuthError, readOAuthState, statesMatch } from "@/lib/auth/google";
import { clearOAuthStateCookie, OAUTH_STATE_COOKIE, setAuthCookies } from "@/lib/auth/cookies";
import { createSession } from "@/lib/auth/session";
import { findOrCreateGoogleUser } from "@/lib/auth/oauth-user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function fail(code: string, req: NextRequest) {
  let base: string;
  try {
    base = getAppUrl();
  } catch {
    base = req.nextUrl.origin;
  }
  const res = NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(code)}`, base));
  clearOAuthStateCookie(res);
  return res;
}

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;

  if (params.get("error")) return fail("google_denied", req);

  const code = params.get("code");
  const state = params.get("state");
  const saved = readOAuthState(req.cookies.get(OAUTH_STATE_COOKIE)?.value);

  if (!code || !state || !saved || !statesMatch(state, saved.state)) {
    return fail("invalid_state", req);
  }

  try {
    const profile = await exchangeCodeForProfile(code, saved);
    const user = await findOrCreateGoogleUser(profile, saved.role);
    const tokens = await createSession(user);

    const response = NextResponse.redirect(new URL(saved.next, getAppUrl()));
    setAuthCookies(response, tokens);
    clearOAuthStateCookie(response);
    return response;
  } catch (error) {
    if (error instanceof OAuthError) {
      console.error("Google OAuth rejected:", error.message);
      return fail(error.code, req);
    }

    const code = (error as { code?: string })?.code;
    if (code === "P1001" || code === "P1010") return fail("service_unavailable", req);

    console.error("Google OAuth callback error:", error);
    return fail("google_failed", req);
  }
}