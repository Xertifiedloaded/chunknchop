import { create } from "zustand";

interface WishlistState {
  ids: Record<string, true>;
  hydrated: boolean;
  set: (productId: string, on: boolean) => void;
  seed: (productIds: string[]) => void;
}

export const useWishlistStore = create<WishlistState>((setState) => ({
  ids: {},
  hydrated: false,
  set: (productId, on) =>
    setState((s) => {
      const ids = { ...s.ids };
      if (on) ids[productId] = true;
      else delete ids[productId];
      return { ids };
    }),
  seed: (productIds) =>
    setState({
      ids: Object.fromEntries(productIds.map((id) => [id, true as const])),
      hydrated: true,
    }),
}));

export const useIsWishlisted = (productId: string) => useWishlistStore((s) => !!s.ids[productId]);