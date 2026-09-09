import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword, generateAccessToken, generateRefreshToken } from '@/lib/auth';
import { z } from 'zod';

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  role: z.enum(['CUSTOMER', 'SUPPLIER']).default('CUSTOMER'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, name, role } = signupSchema.parse(body);

    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }

    const hashedPassword = hashPassword(password);
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name, role },
    });

    if (role === 'SUPPLIER') {
      await prisma.supplierProfile.create({
        data: { userId: user.id, storeName: name },
      });
    }

    const accessToken = generateAccessToken(user.id, user.email, user.role); // no await
    const refreshToken = generateRefreshToken();

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const response = NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        accessToken,
      },
      { status: 201 }
    );

    response.cookies.delete('accessToken');

    // Set refresh token as httpOnly cookie (not accessible to JS)
    response.cookies.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    // Set a CSRF cookie (readable by JS) for double-submit CSRF protection
    const csrfToken = Math.random().toString(36).substring(2);
    response.cookies.set('csrfToken', csrfToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    // NOTE: Access token is returned in the response body and SHOULD NOT be persisted to disk by the client.
    // The server will not set an httpOnly accessToken cookie anymore.

    return response;
  } catch (error) {
    console.error('Signup error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
