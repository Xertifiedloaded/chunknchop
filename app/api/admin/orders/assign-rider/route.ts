import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/http/request";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { orderIds, riderId } = body;

    if (!riderId || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json({ error: "riderId and orderIds are required" }, { status: 400 });
    }

    const assignedCount = await prisma.$transaction(async (tx) => {
      const rider = await tx.rider.findUnique({ where: { id: riderId } });
      if (!rider || !rider.isActive) {
        throw new Error("Rider not found or inactive");
      }

      const orders = await tx.order.findMany({
        where: { id: { in: orderIds } },
      });

      if (orders.length !== orderIds.length) {
        throw new Error("One or more orders not found");
      }

      const notReady = orders.filter((o) => o.status !== "READY_FOR_DISPATCH");
      if (notReady.length > 0) {
        throw new Error(`Orders not ready for dispatch: ${notReady.map((o) => o.id).join(", ")}`);
      }

      await tx.order.updateMany({
        where: { id: { in: orderIds } },
        data: {
          riderId,
          status: "OUT_FOR_DELIVERY",
          shippedAt: new Date(),
        },
      });

      await tx.rider.update({
        where: { id: riderId },
        data: { status: "ON_DELIVERY" },
      });

      return orders.length;
    });

    return NextResponse.json({ assigned: assignedCount, riderId });
  } catch (error) {
    console.error("Error assigning rider:", error);
    const message = error instanceof Error ? error.message : "Failed to assign rider";
    const isClientError = message.includes("not ready") || message.includes("not found") || message.includes("inactive");
    return NextResponse.json({ error: message }, { status: isClientError ? 400 : 500 });
  }
}
