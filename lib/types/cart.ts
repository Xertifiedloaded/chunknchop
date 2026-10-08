export interface CartItem {
  id: string;
  userId?: string;
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

export interface Address {
  id: string;
  street: string;
  city: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface DeliverySlot {
  start: string;
  end: string;
}

export interface DeliveryDate {
  date: string;
  slots: DeliverySlot[];
}

export type DeliveryMethod = 'home' | 'pickup';
