'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import useSWR from 'swr';
import { useAuth } from '@/components/auth-provider';
import type { CatalogProduct } from '@/lib/catalog';

type CartLine = { product: CatalogProduct; quantity: number };
type CartResponse = { items: CartLine[] };
type CartContextValue = {
  items: CartLine[];
  cartCount: number;
  subtotalCents: number;
  isSignedIn: boolean;
  isLoading: boolean;
  error: string;
  addProduct: (product: CatalogProduct, quantity?: number) => void;
  setQuantity: (slug: string, quantity: number) => void;
  removeProduct: (slug: string) => void;
  clearCart: () => Promise<void>;
  syncGuestCart: () => Promise<boolean>;
};

const CartContext = createContext<CartContextValue | null>(null);
const MAX_QUANTITY = 99;

async function saveCartRequest(items: CartLine[]): Promise<CartLine[]> {
  const response = await fetch('/api/cart', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      items: items.map(({ product, quantity }) => ({ slug: product.slug, quantity })),
    }),
  });
  const result = await response.json().catch(() => null);
  if (!response.ok) throw new Error(result?.error || 'Your bag could not be saved.');
  return result.items as CartLine[];
}

function mergeItems(saved: CartLine[], guest: CartLine[]) {
  const merged = new Map(saved.map((item) => [item.product.slug, item]));
  for (const item of guest) {
    const existing = merged.get(item.product.slug);
    merged.set(item.product.slug, {
      product: item.product,
      quantity: Math.min(MAX_QUANTITY, item.quantity + (existing?.quantity ?? 0)),
    });
  }
  return [...merged.values()];
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: sessionPending } = useAuth();
  const userId = user?.id ?? null;
  const [guestItems, setGuestItems] = useState<CartLine[]>([]);
  const guestItemsRef = useRef(guestItems);
  guestItemsRef.current = guestItems;
  const itemsRef = useRef<CartLine[]>([]);
  const [error, setError] = useState('');
  const cartKey = userId ? `/api/cart?account=${encodeURIComponent(userId)}` : null;

  const {
    data: savedCart,
    error: fetchError,
    mutate,
    isLoading: cartPending,
  } = useSWR<CartResponse>(
    cartKey,
    async (url) => {
      const response = await fetch(url, { cache: 'no-store' });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.error || 'Your saved bag could not be loaded.');

      const guests = guestItemsRef.current;
      if (!guests.length) return result as CartResponse;
      const merged = mergeItems((result as CartResponse).items, guests);
      const items = await saveCartRequest(merged);
      guestItemsRef.current = [];
      setGuestItems([]);
      return { items };
    },
    { revalidateOnFocus: false },
  );

  const isSignedIn = Boolean(userId);
  const items = isSignedIn ? (savedCart?.items ?? []) : guestItems;
  itemsRef.current = items;

  const saveItems = useCallback(
    async (next: CartLine[]) => {
      itemsRef.current = next;
      setError('');
      if (!userId) {
        guestItemsRef.current = next;
        setGuestItems(next);
        return;
      }
      try {
        await mutate(async () => ({ items: await saveCartRequest(next) }), {
          optimisticData: { items: next },
          rollbackOnError: true,
          revalidate: false,
        });
      } catch (saveError) {
        setError(saveError instanceof Error ? saveError.message : 'Your bag could not be saved.');
        void mutate();
      }
    },
    [mutate, userId],
  );

  const addProduct = useCallback(
    (product: CatalogProduct, quantity = 1) => {
      if (!Number.isSafeInteger(quantity) || quantity < 1) return;
      const current = itemsRef.current;
      const line = current.find((item) => item.product.slug === product.slug);
      const nextQuantity = Math.min(MAX_QUANTITY, (line?.quantity ?? 0) + quantity);
      const next = line
        ? current.map((item) =>
            item.product.slug === product.slug ? { ...item, quantity: nextQuantity } : item,
          )
        : [...current, { product, quantity: nextQuantity }];
      void saveItems(next);
    },
    [saveItems],
  );

  const setQuantity = useCallback(
    (slug: string, quantity: number) => {
      const current = itemsRef.current;
      if (!Number.isSafeInteger(quantity) || quantity < 1) {
        void saveItems(current.filter((item) => item.product.slug !== slug));
        return;
      }
      const next = current.map((item) =>
        item.product.slug === slug ? { ...item, quantity: Math.min(MAX_QUANTITY, quantity) } : item,
      );
      void saveItems(next);
    },
    [saveItems],
  );

  const removeProduct = useCallback(
    (slug: string) => {
      void saveItems(itemsRef.current.filter((item) => item.product.slug !== slug));
    },
    [saveItems],
  );

  const clearCart = useCallback(async () => {
    await saveItems([]);
  }, [saveItems]);

  const syncGuestCart = useCallback(async () => {
    const guests = guestItemsRef.current;
    if (!guests.length) return true;
    try {
      const response = await fetch('/api/cart', { cache: 'no-store' });
      const result = await response.json().catch(() => null);
      if (!response.ok) return false;
      const items = await saveCartRequest(mergeItems((result as CartResponse).items, guests));
      guestItemsRef.current = [];
      setGuestItems([]);
      if (userId) await mutate({ items }, { revalidate: false });
      return true;
    } catch {
      return false;
    }
  }, [mutate, userId]);

  const cartCount = items.reduce((count, item) => count + item.quantity, 0);
  const subtotalCents = items.reduce(
    (sum, item) => sum + item.product.priceCents * item.quantity,
    0,
  );
  const value = useMemo(
    () => ({
      items,
      cartCount,
      subtotalCents,
      isSignedIn,
      isLoading: sessionPending || Boolean(userId && cartPending),
      error: error || (fetchError instanceof Error ? fetchError.message : ''),
      addProduct,
      setQuantity,
      removeProduct,
      clearCart,
      syncGuestCart,
    }),
    [
      items,
      cartCount,
      subtotalCents,
      isSignedIn,
      sessionPending,
      userId,
      cartPending,
      error,
      fetchError,
      addProduct,
      setQuantity,
      removeProduct,
      clearCart,
      syncGuestCart,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
}
