import { create } from "zustand";

import type { Product } from "@/lib/types";

interface ProductState {
  products: Product[];
  selectedProduct: Product | null;
  isLoading: boolean;
  error: string | null;

  setProducts: (products: Product[]) => void;
  setSelectedProduct: (product: Product | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

const normalizeProduct = (product: Product): Product => ({
  ...product,
  preparations: Array.isArray(product.preparations)
    ? product.preparations
    : [],
});

export const useProductStore = create<ProductState>((set) => ({
  products: [],
  selectedProduct: null,
  isLoading: false,
  error: null,

  setProducts: (products) =>
    set({ products: (products ?? []).map(normalizeProduct) }),
  setSelectedProduct: (product) =>
    set({ selectedProduct: product ? normalizeProduct(product) : null }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));