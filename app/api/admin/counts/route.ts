import prisma from "@/lib/db";
import { NextResponse } from "next/server";


export const dynamic = "force-dynamic";

export async function GET() {

  const now = new Date();

  const [orders, processing, delivery, products, categories, customers, promotions, content, staff, inventoryRows] = await Promise.all([
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.order.count({ where: { status: "PROCESSING" } }),
    prisma.order.count({ where: { status: { in: ["READY_FOR_DISPATCH", "OUT_FOR_DELIVERY"] } } }),
    prisma.product.count({ where: { isActive: true, isArchived: false } }),
    prisma.category.count({ where: { isActive: true } }),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.promotion.count({ where: { isActive: true, endDate: { gte: now } } }),
    prisma.contentEntry.count(),
    prisma.user.count({ where: { role: "STAFF" } }),
    prisma.inventoryRecord.findMany({ select: { onHand: true, reorderPoint: true } }),
  ]);

  const lowStock = inventoryRows.filter((r) => r.onHand <= r.reorderPoint).length;

  return NextResponse.json({
    orders,
    processing,
    delivery,
    products,
    categories,
    inventory: lowStock,
    customers,
    promotions,
    content,
    staff,
  });
}