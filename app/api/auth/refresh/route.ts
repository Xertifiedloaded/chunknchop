import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { generateAccessToken, verifyToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
    try {
        const refreshToken = req.cookies.get('refreshToken')?.value;

        if (!refreshToken) {
            return NextResponse.json(
                {
                    error: 'Refresh token missing',
                    code: 'NO_REFRESH_TOKEN',
                },
                { status: 401 }
            );
        }

        const decoded = verifyToken(refreshToken);

        if (!decoded) {
            const response = NextResponse.json(
                {
                    error: 'Refresh token expired',
                    code: 'REFRESH_TOKEN_EXPIRED',
                },
                { status: 401 }
            );

            response.cookies.delete('accessToken');
            response.cookies.delete('refreshToken');

            return response;
        }

        const storedRefreshToken = await prisma.refreshToken.findUnique({
            where: {
                token: refreshToken,
            },
            include: {
                user: true,
            },
        });

        if (!storedRefreshToken) {
            const response = NextResponse.json(
                {
                    error: 'Invalid refresh token',
                    code: 'INVALID_REFRESH_TOKEN',
                },
                { status: 401 }
            );

            response.cookies.delete('accessToken');
            response.cookies.delete('refreshToken');

            return response;
        }

        if (storedRefreshToken.expiresAt < new Date()) {
            await prisma.refreshToken.delete({
                where: {
                    token: refreshToken,
                },
            });

            const response = NextResponse.json(
                {
                    error: 'Refresh token expired',
                    code: 'REFRESH_TOKEN_EXPIRED',
                },
                { status: 401 }
            );

            response.cookies.delete('accessToken');
            response.cookies.delete('refreshToken');

            return response;
        }

        const user = storedRefreshToken.user;

        const accessToken = generateAccessToken(
            user.id,
            user.email,
            user.role
        );

        const response = NextResponse.json({
            accessToken,
        });

        response.cookies.set('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 24 * 60 * 60,
            path: '/',
        });

        return response;
    } catch (error) {
        console.error('Refresh token error:', error);

        const response = NextResponse.json(
            {
                error: 'Unable to refresh session',
            },
            { status: 500 }
        );

        response.cookies.delete('accessToken');

        return response;
    }
}