import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isContentType, type ContentTypeKey } from "@/lib/cms/config";
import { meatboxSku } from "@/lib/cms/meatbox-sync";

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const types = (sp.get("type") ?? "")
    .split(",")
    .map((t) => t.trim().toUpperCase())
    .filter(isContentType) as ContentTypeKey[];

  if (types.length === 0) {
    return NextResponse.json({ error: "Provide ?type=" }, { status: 400 });
  }

  const slug = sp.get("slug");

  try {
    const rows = await prisma.contentEntry.findMany({
      where: { type: { in: types }, status: "LIVE", ...(slug ? { slug } : {}) },
      orderBy: [{ sortOrder: "asc" }, { publishedAt: "desc" }],
      select: { id: true, type: true, title: true, slug: true, sortOrder: true, data: true, publishedAt: true },
    });

    const productBySku = new Map<string, { id: string; inStock: boolean; stock: number; basePrice: number }>();
    const meatboxRows = rows.filter((r) => r.type === "MEATBOX");
    if (meatboxRows.length) {
      const products = await prisma.product.findMany({
        where: { sku: { in: meatboxRows.map((r) => meatboxSku(r.id)) }, isActive: true, isArchived: false },
        select: { id: true, sku: true, inStock: true, stock: true, basePrice: true },
      });
      for (const p of products) if (p.sku) productBySku.set(p.sku, p);
    }

    const now = Date.now();
    const content: Record<string, any[]> = Object.fromEntries(types.map((t) => [t, []]));

    for (const row of rows) {
      if (row.type === "BANNER") {
        const d = row.data as { startsAt?: string; endsAt?: string };
        if (d.startsAt && new Date(d.startsAt).getTime() > now) continue;
        if (d.endsAt && new Date(d.endsAt).getTime() < now) continue;
      }

      if (row.type === "MEATBOX") {
        const p = productBySku.get(meatboxSku(row.id));
        content[row.type].push({
          ...row,
          productId: p?.id ?? null,
          inStock: p ? p.inStock && p.stock > 0 : null,
          data: { ...(row.data as Record<string, any>), price: p?.basePrice ?? (row.data as any)?.price },
        });
        continue;
      }

      content[row.type].push(row);
    }

    if (slug && rows.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(
      { content },
      { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=300" } }
    );
  } catch (error) {
    console.error("Public content failed:", error);
    return NextResponse.json({ error: "Failed to load content" }, { status: 500 });
  }
}