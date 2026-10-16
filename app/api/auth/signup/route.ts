import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/db";
import { hashPasswordAsync } from "@/lib/auth";
import { setAuthCookies } from "@/lib/auth/cookies";
import { createSession, toPublicUser } from "@/lib/auth/session";

export const runtime = "nodejs";

const signupSchema = z.object({
  email: z
    .string()
    .email()
    .transform((value) => value.toLowerCase().trim()),
  password: z.string().min(8).max(72),
  name: z.string().trim().min(1),
  role: z.enum(["CUSTOMER", "SUPPLIER"]).default("CUSTOMER"),
});

export async function POST(req: NextRequest) {
  try {
    const { email, password, name, role } = signupSchema.parse(await req.json());

    const user = await prisma.user.create({
      data: {
        email,
        password: await hashPasswordAsync(password),
        name,
        role,
        ...(role === "SUPPLIER" && { supplierProfile: { create: { storeName: name } } }),
      },
    });

    const tokens = await createSession(user);

    const response = NextResponse.json({ user: toPublicUser(user) }, { status: 201 });
    setAuthCookies(response, tokens);
    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.issues }, { status: 400 });
    }

    if ((error as { code?: string })?.code === "P2002") {
      return NextResponse.json({ error: "User already exists" }, { status: 400 });
    }

    console.error("Signup error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
