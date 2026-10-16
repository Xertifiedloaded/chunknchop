"use client";

import { useCallback, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { fetchWithAuth } from "@/lib/http/fetchClient";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import { useWishlistStore } from "@/store/wishlistStore";

const json = { "Content-Type": "application/json" };
const BATCH_DELAY_MS = 300;

export type AddOptions = {
  quantity?: number;
  selectedTier?: string | null;
  selectedPreparation?: string | null;
};

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

const isPlainLine = (item: any, productId: string) => item.product?.id === productId && !item.selectedVariants?.length && !item.selectedTier;

const cartHas = (items: any[], productId: string) => items.some((i) => (i.product?.id ?? i.productId) === productId);

const isInCart = (productId: string) => pendingAdds.has(productId) || cartHas(useCartStore.getState().items as any[], productId);

const isInStock = (p: any) => p.inStock ?? (p.stock ?? 0) > 0;

const isPlainAdd = (product: any, o?: AddOptions) => !o || (!o.selectedTier && (o.quantity ?? 1) === 1 && (!o.selectedPreparation || o.selectedPreparation === (product.preparations?.[0] ?? null)));

function adjustCart(product: any, delta: number) {
  const { items, setItems } = useCartStore.getState();
  const existing = (items as any[]).find((i) => isPlainLine(i, product.id));

  if (existing) {
    const quantity = existing.quantity + delta;
    setItems(quantity > 0 ? (items as any[]).map((i) => (i === existing ? { ...i, quantity } : i)) : (items as any[]).filter((i) => i !== existing));
    return;
  }

  if (delta > 0) {
    setItems([
      ...(items as any[]),
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
    const res = await fetchWithAuth("/api/customer/cart", { method: "GET", cache: "no-store" });
    if (!res.ok) return;

    const data = await res.json();
    if (seq !== refreshSeq || inFlight > 0 || pendingAdds.size > 0) return;

    useCartStore.getState().setItems((data.cartItems || []).map(normalizeItem));
  } catch (error) {
    console.error("failed to refresh cart:", error);
  }
}

async function postAdd(product: any, body: { quantity: number; selectedTier: string | null; selectedPreparation: string | null }, onFail?: () => void): Promise<boolean> {
  inFlight++;

  try {
    const res = await fetchWithAuth("/api/customer/cart", {
      method: "POST",
      headers: json,
      body: JSON.stringify({ productId: product.id, ...body, selectedVariants: [] }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data?.error || "Failed to add product to cart");
    }
    return true;
  } catch (error) {
    console.error("failed to add item:", error);
    onFail?.();
    toast.error(error instanceof Error ? error.message : "Failed to add item to cart");
    return false;
  } finally {
    inFlight--;
    if (inFlight === 0 && pendingAdds.size === 0) await refreshCart();
  }
}

async function flushAdd(productId: string) {
  const entry = pendingAdds.get(productId);
  if (!entry) return;

  pendingAdds.delete(productId);

  await postAdd(entry.product, { quantity: entry.qty, selectedTier: null, selectedPreparation: entry.product.preparations?.[0] || null }, () => adjustCart(entry.product, -entry.qty));
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

export const useInCart = (productId: string) => useCartStore((s) => cartHas(s.items as any[], productId));

export function useWishlistHydrate() {
  const user = useAuthStore((s) => s.user);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const seed = useWishlistStore((s) => s.seed);
  const canShop = !!user && user.role !== "SUPPLIER" && user.role !== "STAFF";

  useEffect(() => {
    if (!isHydrated) return;
    if (!canShop) {
      seed([]);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetchWithAuth("/api/customer/wishlist", { method: "GET", cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        const rows: any[] = Array.isArray(data) ? data : (data.wishlist ?? data.items ?? data.wishlistItems ?? []);
        if (!cancelled) seed(rows.map((r) => r.productId ?? r.product?.id).filter(Boolean));
      } catch (error) {
        console.error("failed to load wishlist:", error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isHydrated, canShop, seed]);
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
    async (product: any, options?: AddOptions): Promise<boolean> => {
      if (!isInStock(product) || !guard("add items to your cart")) return false;

      if (isPlainAdd(product, options)) {
        if (isInCart(product.id)) {
          toast("Already in cart", { id: `cart-${product.id}` });
          return false;
        }

        adjustCart(product, 1);
        queueAdd(product);
        toast.success("Added to cart", { id: `cart-${product.id}` });
        return true;
      }

      const ok = await postAdd(product, {
        quantity: options?.quantity ?? 1,
        selectedTier: options?.selectedTier ?? null,
        selectedPreparation: options?.selectedPreparation ?? null,
      });
      if (ok) toast.success("Added to cart", { id: `cart-${product.id}` });
      return ok;
    },
    [guard],
  );

  const buyNow = useCallback(
    async (product: any, options?: AddOptions): Promise<boolean> => {
      if (!isInStock(product) || !guard("continue to checkout")) return false;

      return postAdd(product, {
        quantity: options?.quantity ?? 1,
        selectedTier: options?.selectedTier ?? null,
        selectedPreparation: options?.selectedPreparation ?? null,
      });
    },
    [guard],
  );

  const setWishlisted = useCallback(
    async (productId: string, add: boolean) => {
      if (!guard("save favorites")) return false;

      const { set } = useWishlistStore.getState();
      set(productId, add);

      try {
        const res = add
          ? await fetchWithAuth("/api/customer/wishlist", { method: "POST", headers: json, body: JSON.stringify({ productId }) })
          : await fetchWithAuth(`/api/customer/wishlist/${productId}`, { method: "DELETE" });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          if (add && res.status === 400 && data?.error === "Already in wishlist") {
            toast.success("Already in favorites");
            return true;
          }
          throw new Error(data?.error || "Failed to update favorites");
        }

        toast.success(add ? "Added to favorites" : "Removed from favorites");
        return true;
      } catch (error) {
        console.error("failed to toggle wishlist:", error);
        set(productId, !add);
        toast.error(error instanceof Error ? error.message : "Failed to update favorites");
        return false;
      }
    },
    [guard],
  );

  return { addToCart, buyNow, setWishlisted, canShop };
}