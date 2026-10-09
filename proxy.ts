import { NextRequest, NextResponse } from "next/server";

import { verifyTokenEdge } from "@/lib/auth/edge";
import { findRule, isAllowed } from "@/lib/auth/routes";

function getToken(req: NextRequest): string | null {
  const header = req.headers.get("authorization");
  if (header?.startsWith("Bearer ")) return header.substring(7);
  return req.cookies.get("accessToken")?.value || null;
}

export async function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const rule = findRule(pathname);

  if (!rule) return NextResponse.next();

  const isApi = pathname.startsWith("/api/");
  const token = getToken(req);
  const payload = token ? await verifyTokenEdge(token) : null;

  if (!payload) {
    if (isApi) {
      const res = NextResponse.json(token ? { error: "Session expired", code: "TOKEN_EXPIRED" } : { error: "Unauthorized", code: "NO_TOKEN" }, { status: 401 });
      if (token) res.cookies.set("accessToken", "", { path: "/", maxAge: 0 });
      return res;
    }

    const next = `${pathname}${search}`;
    const hasRefreshToken = Boolean(req.cookies.get("refreshToken")?.value);
    const url = new URL(hasRefreshToken ? "/api/auth/refresh" : "/auth/login", req.url);
    url.searchParams.set("next", next);
    return NextResponse.redirect(url);
  }

  if (!isAllowed(rule, payload.role)) {
    return isApi ? NextResponse.json({ error: "Forbidden", code: "FORBIDDEN" }, { status: 403 }) : NextResponse.redirect(new URL("/", req.url));
  }

  const headers = new Headers(req.headers);
  headers.set("x-user-id", payload.id);
  headers.set("x-user-email", payload.email);
  headers.set("x-user-role", payload.role);

  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ["/api/customer/:path*", "/api/supplier/:path*", "/api/staff/:path*", "/api/admin/:path*", "/admin/:path*", "/supplier/:path*", "/staff/:path*", "/orders/:path*", "/account/:path*"],
};
