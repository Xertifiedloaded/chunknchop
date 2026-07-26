import { create } from 'zustand';

export interface Product {
  id: string;
  name: string;
  description: string;
  images: string[];
  basePrice: number;
  stock: number;
  category: string;
  rating: number;
  tiers: Array<{
    id: string;
    name: string;
    price: number;
    features: string[];
  }>;
  variants: Array<{
    id: string;
    name: string;
    value: string;
    priceModifier: number;
  }>;
  supplier: {
    id: string;
    supplierProfile?: {
      storeName: string;
      logo?: string;
      rating: number;
    };
  };
}

interface ProductState {
  products: Product[];
  selectedProduct: Product | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setProducts: (products: Product[]) => void;
  setSelectedProduct: (product: Product | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useProductStore = create<ProductState>((set) => ({
  products: [],
  selectedProduct: null,
  isLoading: false,
  error: null,

  setProducts: (products) => set({ products }),
  setSelectedProduct: (product) => set({ selectedProduct: product }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));
