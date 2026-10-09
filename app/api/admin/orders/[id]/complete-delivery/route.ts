import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/http/request";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = getUserFromRequest(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const order = await prisma.order.findUnique({ where: { id: params.id } });
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    if (order.status !== "OUT_FOR_DELIVERY") {
      return NextResponse.json({ error: "Order is not out for delivery" }, { status: 400 });
    }

    const updatedOrder = await prisma.$transaction(async (tx) => {
      const delivered = await tx.order.update({
        where: { id: params.id },
        data: { status: "DELIVERED", deliveredAt: new Date() },
      });

      if (order.riderId) {
        const stillOnDelivery = await tx.order.count({
          where: { riderId: order.riderId, status: "OUT_FOR_DELIVERY" },
        });

        await tx.rider.update({
          where: { id: order.riderId },
          data: {
            totalDeliveries: { increment: 1 },
            status: stillOnDelivery === 0 ? "AVAILABLE" : "ON_DELIVERY",
          },
        });
      }

      return delivered;
    });

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error("Error completing delivery:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
