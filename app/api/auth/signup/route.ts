import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/db";
import { generateAccessToken, generateRefreshToken, hashPassword } from "@/lib/auth";
import { setAuthCookies } from "@/lib/auth/cookies";
import { storeRefreshToken } from "@/lib/auth/tokens";

export const runtime = "nodejs";

const signupSchema = z.object({
  email: z
    .string()
    .email()
    .transform((value) => value.toLowerCase().trim()),
  password: z.string().min(6),
  name: z.string().min(1),
  role: z.enum(["CUSTOMER", "SUPPLIER"]).default("CUSTOMER"),
});

export async function POST(req: NextRequest) {
  try {
    const { email, password, name, role } = signupSchema.parse(await req.json());

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 });
    }

    const user = await prisma.user.create({
      data: { email, password: hashPassword(password), name, role },
    });

    if (role === "SUPPLIER") {
      await prisma.supplierProfile.create({
        data: { userId: user.id, storeName: name },
      });
    }

    const accessToken = generateAccessToken(user.id, user.email, user.role);
    const refreshToken = generateRefreshToken(user.id);
    await storeRefreshToken(user.id, refreshToken);

    const response = NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          staffRole: user.staffRole,
        },
      },
      { status: 201 },
    );

    setAuthCookies(response, { accessToken, refreshToken });
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
