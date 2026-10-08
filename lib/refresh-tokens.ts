import { createHash } from "crypto";

import { prisma } from "@/lib/db";

const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function storeRefreshToken(userId: string, token: string) {
  await prisma.refreshToken.create({
    data: {
      userId,
      token: hashToken(token),
      expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
    },
  });
}

export async function consumeRefreshToken(token: string) {
  const { count } = await prisma.refreshToken.deleteMany({
    where: { token: hashToken(token), expiresAt: { gt: new Date() } },
  });
  return count > 0;
}

export async function revokeRefreshToken(token: string) {
  await prisma.refreshToken.deleteMany({ where: { token: hashToken(token) } });
}

export async function revokeAllRefreshTokens(userId: string) {
  await prisma.refreshToken.deleteMany({ where: { userId } });
}
