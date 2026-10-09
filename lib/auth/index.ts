import jwt, { type SignOptions } from "jsonwebtoken";
import bcryptjs from "bcryptjs";
import { randomUUID } from "crypto";
import { jwtDecode } from "jwt-decode";

import type { TokenPayload } from "@/types";

export { ACCESS_TOKEN_MAX_AGE_SECONDS } from "@/lib/auth/cookies";

const ACCESS_EXPIRY = (process.env.ACCESS_TOKEN_EXPIRY || "15m") as SignOptions["expiresIn"];
const REFRESH_EXPIRY = (process.env.REFRESH_TOKEN_EXPIRY || "7d") as SignOptions["expiresIn"];

export interface RefreshPayload {
  id: string;
  jti: string;
  exp: number;
}

function getSecret(name: "JWT_SECRET" | "REFRESH_TOKEN_SECRET"): string {
  const value = process.env[name];
  if (!value || value.length < 32) {
    throw new Error(`${name} must be set to at least 32 characters`);
  }
  return value;
}

export function hashPassword(password: string): string {
  return bcryptjs.hashSync(password, 10);
}

export function verifyPassword(password: string, hash: string): boolean {
  return bcryptjs.compareSync(password, hash);
}

export function generateAccessToken(userId: string, email: string, role: string): string {
  return jwt.sign({ id: userId, email, role }, getSecret("JWT_SECRET"), {
    algorithm: "HS256",
    expiresIn: ACCESS_EXPIRY,
  });
}

export function generateRefreshToken(userId: string): string {
  return jwt.sign({ id: userId, jti: randomUUID() }, getSecret("REFRESH_TOKEN_SECRET"), {
    algorithm: "HS256",
    expiresIn: REFRESH_EXPIRY,
  });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, getSecret("JWT_SECRET"), {
      algorithms: ["HS256"],
    }) as TokenPayload;
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token: string): RefreshPayload | null {
  try {
    const decoded = jwt.verify(token, getSecret("REFRESH_TOKEN_SECRET"), {
      algorithms: ["HS256"],
    }) as RefreshPayload;
    return decoded.id ? decoded : null;
  } catch {
    return null;
  }
}

export function decodeToken(token: string): TokenPayload | null {
  try {
    return jwtDecode<TokenPayload>(token);
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  const decoded = decodeToken(token);
  return !decoded?.exp || decoded.exp * 1000 <= Date.now();
}
