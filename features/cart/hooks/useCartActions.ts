"use client";

import { useCallback } from "react";
import toast from "react-hot-toast";
import { fetchWithAuth } from "@/lib/http/fetchClient";
import { useCartStore } from "@/store/cartStore";

const MAX_QTY = 99;
const DEBOUNCE_MS = 400;
const json = { "Content-Type": "application/json" };

const timers = new Map<string, ReturnType<typeof setTimeout>>();
const confirmedQty = new Map<string, number>();

export const isTempItem = (id: string) => id.startsWith("temp-");

export const maxQuantityFor = (stock?: number | null) =>
  Math.min(MAX_QTY, typeof stock === "number" && stock > 0 ? stock : MAX_QTY);

async function syncQuantity(itemId: string) {
  timers.delete(itemId);

  const item = useCartStore.getState().items.find((i) => i.id === itemId);
  if (!item) {
    confirmedQty.delete(itemId);
    return;
  }

  try {
    const res = await fetchWithAuth(`/api/customer/cart/${itemId}`, {
      method: "PATCH",
      headers: json,
      body: JSON.stringify({ quantity: item.quantity }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data?.error || "Failed to update quantity");
    }

    confirmedQty.delete(itemId);
  } catch (error) {
    const previous = confirmedQty.get(itemId);
    confirmedQty.delete(itemId);

    if (previous !== undefined) {
      useCartStore.getState().updateQuantity(itemId, previous);
    }

    toast.error(
      error instanceof Error ? error.message : "Failed to update quantity",
    );
  }
}

export function useCartActions() {
  const setQuantity = useCallback((itemId: string, quantity: number) => {
    if (isTempItem(itemId)) return;

    const { items, updateQuantity } = useCartStore.getState();
    const item = items.find((i) => i.id === itemId);
    if (!item) return;

    const max = maxQuantityFor(item.product?.stock);
    const next = Math.min(max, Math.max(1, quantity));

    if (next === item.quantity) {
      if (quantity > max) toast.error(`Only ${max} available`);
      return;
    }

    if (!confirmedQty.has(itemId)) confirmedQty.set(itemId, item.quantity);

    updateQuantity(itemId, next);

    clearTimeout(timers.get(itemId));
    timers.set(
      itemId,
      setTimeout(() => syncQuantity(itemId), DEBOUNCE_MS),
    );
  }, []);

  const removeItem = useCallback(async (itemId: string) => {
    if (isTempItem(itemId)) return;

    const {
      items,
      removeItem: removeFromStore,
      addItem,
    } = useCartStore.getState();
    const item = items.find((i) => i.id === itemId);
    if (!item) return;

    clearTimeout(timers.get(itemId));
    timers.delete(itemId);
    confirmedQty.delete(itemId);

    removeFromStore(itemId);

    try {
      const res = await fetchWithAuth(`/api/customer/cart/${itemId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to remove item");
      }
    } catch (error) {
      addItem(item);
      toast.error(
        error instanceof Error ? error.message : "Failed to remove item",
      );
    }
  }, []);

  return { setQuantity, removeItem };
}