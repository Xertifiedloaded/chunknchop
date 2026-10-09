import { prisma } from "@/lib/db";
import { InventoryChangeReason, Prisma } from "@prisma/client";

type TxClient = Prisma.TransactionClient;

const EXPIRING_SOON_WINDOW_MS = 72 * 60 * 60 * 1000;

export type InventoryStatus = "Healthy" | "Low stock" | "Out of stock" | "Expiring soon";

export function getInventoryStatus(record: { onHand: number; reorderPoint: number; expiryDate: Date | null }): InventoryStatus {
  if (record.onHand <= 0) return "Out of stock";

  if (record.expiryDate && record.expiryDate.getTime() - Date.now() <= EXPIRING_SOON_WINDOW_MS) {
    return "Expiring soon";
  }

  if (record.onHand <= record.reorderPoint) return "Low stock";

  return "Healthy";
}

type Batch = { expiryDate: Date | null; createdAt: Date };

function compareFefo(a: Batch, b: Batch) {
  if (a.expiryDate && b.expiryDate) {
    const diff = a.expiryDate.getTime() - b.expiryDate.getTime();
    if (diff !== 0) return diff;
  } else if (a.expiryDate) {
    return -1;
  } else if (b.expiryDate) {
    return 1;
  }
  return a.createdAt.getTime() - b.createdAt.getTime();
}

async function recomputeProductAggregate(tx: TxClient, productId: string) {
  const agg = await tx.inventoryRecord.aggregate({
    where: { productId },
    _sum: { onHand: true },
  });

  const total = agg._sum.onHand ?? 0;

  await tx.product.update({
    where: { id: productId },
    data: { stock: total, inStock: total > 0 },
  });

  return total;
}

export async function createInitialInventoryRecord(params: { productId: string; locationId: string; onHand: number; reorderPoint: number; performedById?: string }) {
  const { productId, locationId, onHand, reorderPoint, performedById } = params;

  return prisma.$transaction(async (tx) => {
    const record = await tx.inventoryRecord.create({
      data: { productId, locationId, onHand, reorderPoint },
    });

    if (onHand > 0) {
      await tx.inventoryLog.create({
        data: {
          productId,
          previousStock: 0,
          newStock: onHand,
          changeReason: InventoryChangeReason.RESTOCK,
          notes: "Initial stock on product creation",
          inventoryRecordId: record.id,
          performedById,
        },
      });
    }

    await recomputeProductAggregate(tx, productId);

    return record;
  });
}

export async function adjustInventoryRecord(params: { inventoryRecordId: string; newOnHand: number; changeReason: InventoryChangeReason; notes?: string; performedById?: string }) {
  const { inventoryRecordId, newOnHand, changeReason, notes, performedById } = params;

  if (!Number.isInteger(newOnHand) || newOnHand < 0) {
    throw new Error("newOnHand must be a non-negative whole number");
  }

  return prisma.$transaction(async (tx) => {
    const record = await tx.inventoryRecord.findUnique({
      where: { id: inventoryRecordId },
    });
    if (!record) throw new Error("Inventory record not found");

    await tx.inventoryLog.create({
      data: {
        productId: record.productId,
        previousStock: record.onHand,
        newStock: newOnHand,
        changeReason,
        notes,
        inventoryRecordId: record.id,
        performedById,
      },
    });

    const updated = await tx.inventoryRecord.update({
      where: { id: inventoryRecordId },
      data: { onHand: newOnHand },
    });

    await recomputeProductAggregate(tx, record.productId);

    return updated;
  });
}

export async function deductStockForOrder(orderId: string) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) throw new Error("Order not found");

    if (order.stockDeductedAt) return { alreadyDeducted: true };

    for (const item of order.items) {
      if (!item.productId) continue;

      let remaining = item.quantity;

      const records = (
        await tx.inventoryRecord.findMany({
          where: { productId: item.productId, onHand: { gt: 0 } },
        })
      ).sort(compareFefo);

      for (const record of records) {
        if (remaining <= 0) break;

        const take = Math.min(record.onHand, remaining);
        const releaseCommitted = Math.min(record.committed, take);

        const res = await tx.inventoryRecord.updateMany({
          where: { id: record.id, onHand: { gte: take } },
          data: {
            onHand: { decrement: take },
            committed: { decrement: releaseCommitted },
          },
        });
        if (res.count === 0) {
          throw new Error(`Stock for record ${record.id} changed during deduction, please retry`);
        }

        remaining -= take;

        await tx.inventoryLog.create({
          data: {
            productId: item.productId,
            previousStock: record.onHand,
            newStock: record.onHand - take,
            changeReason: InventoryChangeReason.ORDER_FULFILLED,
            notes: `Order ${orderId}`,
            inventoryRecordId: record.id,
            orderId,
          },
        });
      }

      if (remaining > 0) {
        throw new Error(`Insufficient stock for product ${item.productId} (short by ${remaining})`);
      }

      await recomputeProductAggregate(tx, item.productId);
    }

    await tx.order.update({
      where: { id: orderId },
      data: { stockDeductedAt: new Date() },
    });

    return { alreadyDeducted: false };
  });
}

export async function reserveStockForOrder(orderId: string) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) throw new Error("Order not found");

    for (const item of order.items) {
      if (!item.productId) continue;

      let remaining = item.quantity;

      const records = (
        await tx.inventoryRecord.findMany({
          where: { productId: item.productId },
        })
      ).sort(compareFefo);

      for (const record of records) {
        if (remaining <= 0) break;

        const available = record.onHand - record.committed;
        if (available <= 0) continue;

        const take = Math.min(available, remaining);

        const res = await tx.inventoryRecord.updateMany({
          where: { id: record.id, onHand: record.onHand, committed: record.committed },
          data: { committed: { increment: take } },
        });
        if (res.count === 0) {
          throw new Error(`Stock for record ${record.id} changed during reservation, please retry`);
        }

        remaining -= take;

        await tx.inventoryLog.create({
          data: {
            productId: item.productId,
            previousStock: record.onHand,
            newStock: record.onHand,
            changeReason: InventoryChangeReason.ORDER_RESERVED,
            notes: `Reserved ${take} for order ${orderId}`,
            inventoryRecordId: record.id,
            orderId,
          },
        });
      }

      if (remaining > 0) {
        throw new Error(`Insufficient available stock for product ${item.productId} (short by ${remaining})`);
      }
    }
  });
}


export async function releaseReservationForOrder(orderId: string) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId } });
    if (!order) throw new Error("Order not found");
    if (order.stockDeductedAt) return;

    const logs = await tx.inventoryLog.findMany({
      where: { orderId, changeReason: InventoryChangeReason.ORDER_RESERVED },
    });

    for (const log of logs) {
      if (!log.inventoryRecordId) continue;

      const match = /^Reserved (\d+) for order/.exec(log.notes ?? "");
      if (!match) continue;
      const qty = Number(match[1]);

      const record = await tx.inventoryRecord.findUnique({ where: { id: log.inventoryRecordId } });
      if (!record) continue;

      await tx.inventoryRecord.update({
        where: { id: record.id },
        data: { committed: Math.max(0, record.committed - qty) },
      });
    }
  });
}


export async function restoreStockForOrder(orderId: string) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId } });
    if (!order) throw new Error("Order not found");

    if (!order.stockDeductedAt) return;

    const logs = await tx.inventoryLog.findMany({
      where: { orderId, changeReason: InventoryChangeReason.ORDER_FULFILLED },
    });

    const touchedProducts = new Set<string>();

    for (const log of logs) {
      if (!log.inventoryRecordId) continue;

      const qty = log.previousStock - log.newStock;
      if (qty <= 0) continue;

      const record = await tx.inventoryRecord.findUnique({ where: { id: log.inventoryRecordId } });
      if (!record) continue;

      await tx.inventoryRecord.update({
        where: { id: record.id },
        data: { onHand: { increment: qty } },
      });

      await tx.inventoryLog.create({
        data: {
          productId: log.productId,
          previousStock: record.onHand,
          newStock: record.onHand + qty,
          changeReason: InventoryChangeReason.RESTOCK,
          notes: `Restored from order ${orderId}`,
          inventoryRecordId: record.id,
          orderId,
        },
      });

      touchedProducts.add(log.productId);
    }

    for (const productId of touchedProducts) {
      await recomputeProductAggregate(tx, productId);
    }

    await tx.order.update({
      where: { id: orderId },
      data: { stockDeductedAt: null },
    });
  });
}