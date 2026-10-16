
import { prisma } from "@/lib/db";
import type { GoogleProfile, OAuthRole } from "@/lib/auth/google";

const PROVIDER = "google";

export async function findOrCreateGoogleUser(profile: GoogleProfile, role: OAuthRole, retry = true) {
  const linked = await prisma.oAuthAccount.findUnique({
    where: { provider_providerAccountId: { provider: PROVIDER, providerAccountId: profile.sub } },
    include: { user: true },
  });
  if (linked) return linked.user;

  try {
    const existing = await prisma.user.findUnique({ where: { email: profile.email } });

    if (existing) {
      return await prisma.user.update({
        where: { id: existing.id },
        data: {
          emailVerified: existing.emailVerified ?? new Date(),
          avatar: existing.avatar ?? profile.picture,
          name: existing.name ?? profile.name,
          oauthAccounts: { create: { provider: PROVIDER, providerAccountId: profile.sub } },
        },
      });
    }

    const name = profile.name || profile.email.split("@")[0];

    return await prisma.user.create({
      data: {
        email: profile.email,
        name,
        avatar: profile.picture,
        emailVerified: new Date(),
        role,
        oauthAccounts: { create: { provider: PROVIDER, providerAccountId: profile.sub } },
        ...(role === "SUPPLIER" && { supplierProfile: { create: { storeName: name } } }),
      },
    });
  } catch (error) {

    if (retry && (error as { code?: string })?.code === "P2002") {
      return findOrCreateGoogleUser(profile, role, false);
    }
    throw error;
  }
}