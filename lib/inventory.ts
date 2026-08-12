import prisma from '@/lib/db';
import { InventoryChangeReason, Prisma } from '@prisma/client';

type TxClient = Prisma.TransactionClient;

const EXPIRING_SOON_WINDOW_MS = 72 * 60 * 60 * 1000;

export type InventoryStatus = 'Healthy' | 'Low stock' | 'Out of stock' | 'Expiring soon';

export function getInventoryStatus(record: { onHand: number; reorderPoint: number; expiryDate: Date | null }): InventoryStatus {
  if (record.onHand <= 0) return 'Out of stock';

  if (record.expiryDate && record.expiryDate.getTime() - Date.now() <= EXPIRING_SOON_WINDOW_MS) {
    return 'Expiring soon';
  }

  if (record.onHand <= record.reorderPoint) return 'Low stock';

  return 'Healthy';
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

/**
 * Creates the first InventoryRecord for a brand-new product. Called from
 * POST /api/admin/products so a product never exists without a stock row.
 */
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
          notes: 'Initial stock on product creation',
          inventoryRecordId: record.id,
          performedById,
        },
      });
    }

    await recomputeProductAggregate(tx, productId);

    return record;
  });
}

/** Manual admin adjustment — used by the "Adjust" action on the Inventory page. */
export async function adjustInventoryRecord(params: { inventoryRecordId: string; newOnHand: number; changeReason: InventoryChangeReason; notes?: string; performedById?: string }) {
  const { inventoryRecordId, newOnHand, changeReason, notes, performedById } = params;

  if (!Number.isInteger(newOnHand) || newOnHand < 0) {
    throw new Error('newOnHand must be a non-negative whole number');
  }

  return prisma.$transaction(async (tx) => {
    const record = await tx.inventoryRecord.findUnique({ where: { id: inventoryRecordId } });
    if (!record) throw new Error('Inventory record not found');

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
    if (!order) throw new Error('Order not found');

    for (const item of order.items) {
      let remaining = item.quantity;

      const records = await tx.inventoryRecord.findMany({
        where: { productId: item.productId, onHand: { gt: 0 } },
        orderBy: [{ expiryDate: { sort: 'asc', nulls: 'last' } }, { createdAt: 'asc' }],
      });

      for (const record of records) {
        if (remaining <= 0) break;

        const take = Math.min(record.onHand, remaining);
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

        await tx.inventoryRecord.update({
          where: { id: record.id },
          data: {
            onHand: { decrement: take },
            committed: { decrement: Math.min(record.committed, take) },
          },
        });
      }

      if (remaining > 0) {
        // Not enough physical stock anywhere — fail loudly instead of going negative.
        throw new Error(`Insufficient stock for product ${item.productId} (short by ${remaining})`);
      }

      await recomputeProductAggregate(tx, item.productId);
    }
  });
}

/**
 * Reverses a previously fulfilled order back into stock. Call this when an
 * order transitions to CANCELLED or RETURNED after deductStockForOrder already ran.
 */
export async function restoreStockForOrder(orderId: string) {
  return prisma.$transaction(async (tx) => {
    const fulfillmentLogs = await tx.inventoryLog.findMany({
      where: { orderId, changeReason: InventoryChangeReason.ORDER_FULFILLED },
    });

    const productIds = new Set<string>();

    for (const log of fulfillmentLogs) {
      if (!log.inventoryRecordId) continue;

      const returned = log.previousStock - log.newStock;
      if (returned <= 0) continue;

      const record = await tx.inventoryRecord.update({
        where: { id: log.inventoryRecordId },
        data: { onHand: { increment: returned } },
      });

      await tx.inventoryLog.create({
        data: {
          productId: log.productId,
          previousStock: record.onHand - returned,
          newStock: record.onHand,
          changeReason: InventoryChangeReason.ORDER_CANCELLED,
          notes: `Reversal for order ${orderId}`,
          inventoryRecordId: record.id,
          orderId,
        },
      });

      productIds.add(log.productId);
    }

    for (const productId of productIds) {
      await recomputeProductAggregate(tx, productId);
    }
  });
}

/** Reserves stock at cart/checkout time without deducting onHand yet. Optional, symmetric with restore below. */
export async function reserveStockForOrder(orderId: string) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId }, include: { items: true } });
    if (!order) throw new Error('Order not found');

    for (const item of order.items) {
      let remaining = item.quantity;

      const records = await tx.inventoryRecord.findMany({
        where: { productId: item.productId },
        orderBy: [{ expiryDate: { sort: 'asc', nulls: 'last' } }, { createdAt: 'asc' }],
      });

      for (const record of records) {
        if (remaining <= 0) break;

        const available = record.onHand - record.committed;
        if (available <= 0) continue;

        const take = Math.min(available, remaining);
        remaining -= take;

        await tx.inventoryRecord.update({
          where: { id: record.id },
          data: { committed: { increment: take } },
        });

        await tx.inventoryLog.create({
          data: {
            productId: item.productId,
            previousStock: record.onHand,
            newStock: record.onHand,
            changeReason: InventoryChangeReason.ORDER_RESERVED,
            notes: `Reserved for order ${orderId}`,
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
