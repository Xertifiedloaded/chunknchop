import { create } from 'zustand';

export interface CartItem {
  id: string;
  userId: string;
  productId: string;
  quantity: number;
  selectedTier?: string;
  selectedVariants: string[];
  product: {
    id: string;
    name: string;
    basePrice: number;
    images: string[];
    tiers: Array<{ id: string; name: string; price: number }>;
    supplier?: {
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

  setItems: (items) => set({ items }),
  addItem: (item) => set((state) => ({ items: [...state.items, item] })),
  removeItem: (itemId) =>
    set((state) => ({
      items: state.items.filter((i) => i.id !== itemId),
    })),
  updateQuantity: (itemId, quantity) =>
    set((state) => ({
      items: state.items.map((i) => (i.id === itemId ? { ...i, quantity } : i)),
    })),
  clearCart: () => set({ items: [] }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  getTotalItems: () => {
    return get().items.reduce((total, item) => total + item.quantity, 0);
  },
  getTotalPrice: () => {
    return get().items.reduce((total, item) => {
      const tierPrice = item.selectedTier
        ? item.product.tiers.find((t) => t.name === item.selectedTier)?.price ||
          item.product.basePrice
        : item.product.basePrice;
      return total + tierPrice * item.quantity;
    }, 0);
  },
}));
