import { create } from 'zustand';

export interface CartItem {
  id: string;
  userId: string;
  productId: string;
  quantity: number;

  selectedTier?: string | null;
  selectedPreparation?: string | null;
  selectedVariants?: string[] | null;

  product: {
    id: string;
    name: string;
    basePrice: number;
    images: string[];

    tiers: Array<{
      id: string;
      name: string;
      price: number;
      features?: string[];
    }>;

    variants?: Array<{
      id: string;
      name: string;
      value: string;
      priceModifier: number;
    }>;

    supplier?: {
      id?: string;
      supplierProfile?: {
        storeName: string;
      };
    };
  };
}

interface CartState {
  items: CartItem[];
  isLoading: boolean;
  error: string | null;

  // Actions
  setItems: (items: CartItem[]) => void;
  addItem: (item: CartItem) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;

  // Loading / error
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Computed
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
