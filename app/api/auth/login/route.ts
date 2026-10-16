import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/db";
import { DUMMY_HASH, verifyPasswordAsync } from "@/lib/auth";
import { setAuthCookies } from "@/lib/auth/cookies";
import { createSession, toPublicUser } from "@/lib/auth/session";
import { getIp, isRateLimited } from "@/lib/rate-limit";

export const runtime = "nodejs";

const loginSchema = z.object({
  email: z
    .string()
    .email()
    .transform((value) => value.toLowerCase().trim()),
  password: z.string().min(1).max(72),
});

export async function POST(req: NextRequest) {
  if (isRateLimited(`login:${getIp(req)}`, { max: 10, windowMs: 60_000 })) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const { email, password } = loginSchema.parse(await req.json());

    const user = await prisma.user.findUnique({ where: { email } });

    const passwordOk = await verifyPasswordAsync(password, user?.password ?? DUMMY_HASH);

    if (!user || !user.password || !passwordOk) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const tokens = await createSession(user);

    const response = NextResponse.json({ user: toPublicUser(user) });
    setAuthCookies(response, tokens);
    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.issues }, { status: 400 });
    }

    const code = (error as { code?: string })?.code;
    if (code === "P1001" || code === "P1010") {
      return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    }

    console.error("Login error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
