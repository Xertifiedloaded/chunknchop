"use client";

import { useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { fetchWithAuth } from "@/lib/http/fetchClient";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";

const json = { "Content-Type": "application/json" };
const BATCH_DELAY_MS = 300;

type PendingAdd = {
  product: any;
  qty: number;
  timer: ReturnType<typeof setTimeout>;
};

const pendingAdds = new Map<string, PendingAdd>();
let inFlight = 0;
let refreshSeq = 0;

const normalizeItem = (item: any) => ({
  ...item,
  selectedVariants: item.selectedVariants || [],
  selectedTier: item.selectedTier || undefined,
  product: {
    ...item.product,
    tiers: item.product?.tiers || [],
    variants: item.product?.variants || [],
  },
});

const isPlainLine = (item: any, productId: string) =>
  item.product?.id === productId &&
  !item.selectedVariants?.length &&
  !item.selectedTier;

const isInCart = (productId: string) =>
  pendingAdds.has(productId) ||
  useCartStore
    .getState()
    .items.some((i: any) => (i.product?.id ?? i.productId) === productId);

function adjustCart(product: any, delta: number) {
  const { items, setItems } = useCartStore.getState();
  const existing = items.find((i: any) => isPlainLine(i, product.id));

  if (existing) {
    const quantity = existing.quantity + delta;
    setItems(
      quantity > 0
        ? items.map((i: any) => (i === existing ? { ...i, quantity } : i))
        : items.filter((i: any) => i !== existing),
    );
    return;
  }

  if (delta > 0) {
    setItems([
      ...items,
      normalizeItem({
        id: `temp-${product.id}`,
        productId: product.id,
        quantity: delta,
        selectedPreparation: product.preparations?.[0] || null,
        product,
      }),
    ]);
  }
}

async function refreshCart() {
  const seq = ++refreshSeq;

  try {
    const res = await fetchWithAuth("/api/customer/cart", {
      method: "GET",
      cache: "no-store",
    });
    if (!res.ok) return;

    const data = await res.json();

    if (seq !== refreshSeq || inFlight > 0 || pendingAdds.size > 0) return;

    useCartStore.getState().setItems((data.cartItems || []).map(normalizeItem));
  } catch (error) {
    console.error("failed to refresh cart:", error);
  }
}

async function flushAdd(productId: string) {
  const entry = pendingAdds.get(productId);
  if (!entry) return;

  pendingAdds.delete(productId);
  inFlight++;

  try {
    const res = await fetchWithAuth("/api/customer/cart", {
      method: "POST",
      headers: json,
      body: JSON.stringify({
        productId,
        quantity: entry.qty,
        selectedTier: null,
        selectedPreparation: entry.product.preparations?.[0] || null,
        selectedVariants: [],
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data?.error || "Failed to add product to cart");
    }
  } catch (error) {
    console.error("failed to add item:", error);
    adjustCart(entry.product, -entry.qty);
    toast.error(
      error instanceof Error ? error.message : "Failed to add item to cart",
    );
  } finally {
    inFlight--;
    if (inFlight === 0 && pendingAdds.size === 0) refreshCart();
  }
}

function queueAdd(product: any) {
  const existing = pendingAdds.get(product.id);
  if (existing) clearTimeout(existing.timer);

  pendingAdds.set(product.id, {
    product,
    qty: (existing?.qty ?? 0) + 1,
    timer: setTimeout(() => flushAdd(product.id), BATCH_DELAY_MS),
  });
}

export function useShopActions() {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const isHydrated = useAuthStore((s) => s.isHydrated);

  const canShop = !!user && user.role !== "SUPPLIER" && user.role !== "STAFF";

  const guard = useCallback(
    (action: string) => {
      if (!isHydrated) return false;

      if (!user) {
        toast.error(`Please sign in to ${action}.`);
        router.push(`/auth/login?next=${encodeURIComponent(pathname)}`);
        return false;
      }

      if (!canShop) {
        toast.error(`Your account type can't ${action}.`);
        return false;
      }

      return true;
    },
    [isHydrated, user, canShop, router, pathname],
  );

  const addToCart = useCallback(
    (product: any) => {
      if (!product.inStock || !guard("add items to your cart")) return false;

      if (isInCart(product.id)) {
        toast("Already in cart", { id: `cart-${product.id}` });
        return false;
      }

      adjustCart(product, 1);
      queueAdd(product);
      toast.success("Added to cart", { id: `cart-${product.id}` });

      return true;
    },
    [guard],
  );

  const setWishlisted = useCallback(
    async (productId: string, add: boolean) => {
      if (!guard("save favorites")) return false;

      try {
        const res = add
          ? await fetchWithAuth("/api/customer/wishlist", {
              method: "POST",
              headers: json,
              body: JSON.stringify({ productId }),
            })
          : await fetchWithAuth(`/api/customer/wishlist/${productId}`, {
              method: "DELETE",
            });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          if (
            add &&
            res.status === 400 &&
            data?.error === "Already in wishlist"
          ) {
            toast.success("Already in favorites");
            return true;
          }
          throw new Error(data?.error || "Failed to update favorites");
        }

        toast.success(add ? "Added to favorites" : "Removed from favorites");
        return true;
      } catch (error) {
        console.error("failed to toggle wishlist:", error);
        toast.error(
          error instanceof Error ? error.message : "Failed to update favorites",
        );
        return false;
      }
    },
    [guard],
  );

  return { addToCart, setWishlisted };
}