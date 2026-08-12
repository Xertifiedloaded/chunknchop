import { create } from 'zustand';

import type { CartItem } from '@/lib/types/cart';

interface CartState {
  items: CartItem[];
  isLoading: boolean;
  error: string | null;
  setItems: (items: CartItem[]) => void;
  addItem: (item: CartItem) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  isLoading: false,
  error: null,

  setItems: (items) =>
    set({
      items,
      error: null,
    }),

  addItem: (item) =>
    set((state) => {
      const existingItem = state.items.find((existing) => existing.productId === item.productId && existing.selectedTier === item.selectedTier && existing.selectedPreparation === item.selectedPreparation);

      if (existingItem) {
        return {
          items: state.items.map((existing) =>
            existing.id === existingItem.id
              ? {
                  ...existing,
                  quantity: existing.quantity + item.quantity,
                }
              : existing
          ),
        };
      }

      return {
        items: [...state.items, item],
      };
    }),

  removeItem: (itemId) =>
    set((state) => ({
      items: state.items.filter((item) => item.id !== itemId),
    })),

  updateQuantity: (itemId, quantity) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.id === itemId
          ? {
              ...item,
              quantity,
            }
          : item
      ),
    })),

  clearCart: () =>
    set({
      items: [],
      error: null,
    }),

  setLoading: (loading) =>
    set({
      isLoading: loading,
    }),

  setError: (error) =>
    set({
      error,
    }),

  getTotalItems: () => {
    return get().items.reduce((total, item) => total + item.quantity, 0);
  },

  getTotalPrice: () => {
    return get().items.reduce((total, item) => {
      const tierPrice = item.selectedTier ? item.product.tiers.find((tier) => tier.name === item.selectedTier)?.price : undefined;

      const price = tierPrice ?? item.product.basePrice;

      return total + price * item.quantity;
    }, 0);
  },
}));
