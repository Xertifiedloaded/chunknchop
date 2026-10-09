import { NextRequest, NextResponse } from "next/server";

import { verifyToken } from "@/lib/auth";
import prisma from "@/lib/db";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("accessToken")?.value;
  const payload = token ? verifyToken(token) : null;

  if (!payload) {
    return NextResponse.json({ error: "Unauthorized", code: token ? "TOKEN_EXPIRED" : "NO_TOKEN" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        staffRole: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Unauthorized", code: "USER_NOT_FOUND" }, { status: 401 });
    }

    return NextResponse.json({ user }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
