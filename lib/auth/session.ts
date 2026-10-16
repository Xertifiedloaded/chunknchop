import { generateAccessToken, generateRefreshToken } from "@/lib/auth";
import { storeRefreshToken } from "@/lib/auth/tokens";

interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  staffRole: string | null;
}

export async function createSession(user: Pick<SessionUser, "id" | "email" | "role">) {
  const accessToken = generateAccessToken(user.id, user.email, user.role);
  const refreshToken = generateRefreshToken(user.id);
  await storeRefreshToken(user.id, refreshToken);
  return { accessToken, refreshToken };
}

export function toPublicUser(user: SessionUser) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    staffRole: user.staffRole,
  };
}