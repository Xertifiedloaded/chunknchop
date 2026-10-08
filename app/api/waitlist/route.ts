import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { sendWaitlistEmail } from "@/lib/email";
import prisma from "@/lib/db";

export const runtime = "nodejs";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  let body: {
    name?: unknown;
    email?: unknown;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { status: "error", message: "Invalid request." },
      { status: 400 },
    );
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";

  if (!name || name.length > 100) {
    return NextResponse.json(
      { status: "error", message: "Please enter a valid name." },
      { status: 400 },
    );
  }

  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!email || email.length > 254 || !EMAIL_REGEX.test(email)) {
    return NextResponse.json(
      { status: "error", message: "Please enter a valid email address." },
      { status: 400 },
    );
  }

  try {
    const existing = await prisma.waitlistEntry.findUnique({
      where: { email },
    });

    if (existing) {
      return NextResponse.json(
        {
          status: "already_joined",
          message: "You're already on the list. We'll be in touch!",
        },
        { status: 200 },
      );
    }

    await prisma.waitlistEntry.create({
      data: { name, email },
    });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return NextResponse.json(
        {
          status: "already_joined",
          message: "You're already on the list. We'll be in touch!",
        },
        { status: 200 },
      );
    }

    console.error("Waitlist DB error:", err);

    return NextResponse.json(
      {
        status: "error",
        message: "Something went wrong. Please try again.",
      },
      { status: 500 },
    );
  }

  
  let emailSent = true;

  try {
    await sendWaitlistEmail(name, email); 
  } catch (err) {
    emailSent = false;
    console.error("Waitlist email error:", err);
  }

  return NextResponse.json(
    {
      status: "joined",
      emailSent,
      message: emailSent
        ? "You're on the list. Check your inbox for a confirmation."
        : "You're on the list. We'll email you when we launch.",
    },
    { status: 201 },
  );
}