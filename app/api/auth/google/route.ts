import { NextRequest, NextResponse } from "next/server";
import { createAuthorization, getAppUrl, safeRedirectPath, type OAuthRole } from "@/lib/auth/google";
import { setOAuthStateCookie } from "@/lib/auth/cookies";
import { getIp, isRateLimited } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    if (isRateLimited(`google:${getIp(req)}`, { max: 20, windowMs: 60_000 })) {
      return NextResponse.redirect(new URL("/auth/login?error=too_many_requests", getAppUrl()));
    }

    const params = req.nextUrl.searchParams;
    const role: OAuthRole = params.get("role") === "SUPPLIER" ? "SUPPLIER" : "CUSTOMER";
    const next = safeRedirectPath(params.get("next"));

    const { url, stateToken } = createAuthorization({ role, next });
    const response = NextResponse.redirect(url);
    setOAuthStateCookie(response, stateToken);
    return response;
  } catch (error) {
    console.error("Google OAuth start error:", error);
    return NextResponse.redirect(new URL("/login?error=google_unavailable", req.nextUrl.origin));
  }
}