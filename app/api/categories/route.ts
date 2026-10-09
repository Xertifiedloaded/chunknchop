import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        image: true,
        color: true,
        _count: {
          select: {
            products: { where: { isArchived: false, isActive: true } },
          },
        },
      },
    });

    const result = categories.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug.replace(/^\//, ""),
      image: c.image,
      color: c.color,
      productCount: c._count.products,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Public categories error:", error);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}
