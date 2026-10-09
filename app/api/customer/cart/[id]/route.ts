import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { getUserFromRequest } from "@/lib/request";

type RouteContext = { params: Promise<{ id: string }> };

const cartItemInclude = {
  product: {
    include: {
      tiers: true,
      variants: true,
      supplier: {
        select: {
          id: true,
          supplierProfile: {
            select: {
              storeName: true,
            },
          },
        },
      },
    },
  },
} as const;

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const user = getUserFromRequest(req);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json().catch(() => null);
    const quantity = Number(body?.quantity);

    if (!Number.isInteger(quantity) || quantity < 1) {
      return NextResponse.json({ error: "Invalid quantity" }, { status: 400 });
    }

    const cartItem = await prisma.cartItem.findUnique({
      where: { id },
      select: {
        userId: true,
        product: { select: { stock: true } },
      },
    });

    if (!cartItem || cartItem.userId !== user.id) {
      return NextResponse.json(
        { error: "Cart item not found" },
        { status: 404 },
      );
    }

    if (quantity > cartItem.product.stock) {
      return NextResponse.json(
        { error: `Only ${cartItem.product.stock} items available` },
        { status: 400 },
      );
    }

    const updated = await prisma.cartItem.update({
      where: { id },
      data: { quantity },
      include: cartItemInclude,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[cart PATCH] Failed:", error);

    return NextResponse.json(
      { error: "Failed to update quantity" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  try {
    const user = getUserFromRequest(req);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const { count } = await prisma.cartItem.deleteMany({
      where: { id, userId: user.id },
    });

    if (count === 0) {
      return NextResponse.json(
        { error: "Cart item not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Item removed from cart",
    });
  } catch (error) {
    console.error("[cart DELETE] Failed:", error);

    return NextResponse.json(
      { error: "Failed to remove item from cart" },
      { status: 500 },
    );
  }
}