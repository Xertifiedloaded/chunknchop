import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import type { Metadata } from "next";

import AdminNav, { AdminTopbar } from "@/components/admin/AdminNav";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const metadata: Metadata = {
  title: "Staff Dashboard - ChunkNChop",
  description: "Manage products, orders, and customers",
};

export default async function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;
  const payload = accessToken ? verifyToken(accessToken) : null;

  if (!payload) {
    redirect(
      cookieStore.has("refreshToken")
        ? "/api/auth/refresh?next=/staff/dashboard"
        : "/auth/login",
    );
  }

  let role: string | null = null;

  try {
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { role: true },
    });
    role = user?.role ?? null;
  } catch (error) {
    console.error("Staff layout lookup failed", error);
    redirect("/auth/login");
  }

  if (role !== "STAFF" && role !== "ADMIN") {
    redirect(role ? "/" : "/auth/login");
  }

  return (
    <div className="min-h-screen bg-white">
      <AdminNav />
      <AdminTopbar />
      <main className="min-h-screen pt-14 lg:pl-64">{children}</main>
    </div>
  );
}
