import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/http/request";
import { prisma } from "@/lib/db";
import { LOCATION_TYPES } from "@/features/catalog/server/catalog";

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [categories, locations] = await Promise.all([
      prisma.category.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
        select: { id: true, name: true, slug: true, color: true },
      }),
      prisma.storageLocation.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
        select: { id: true, name: true, type: true },
      }),
    ]);

    return NextResponse.json({
      categories: categories.map((c) => ({
        ...c,
        slug: c.slug.replace(/^\//, ""),
      })),
      locations,
      locationTypes: LOCATION_TYPES,
    });
  } catch (error) {
    console.error("Error fetching product form options:", error);
    return NextResponse.json({ error: "Failed to load form options" }, { status: 500 });
  }
}
