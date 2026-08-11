export interface CartItem {
  id: string;
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

    tiers?: Array<{
      id: string;
      name: string;
      price: number;
    }>;

    variants?: Array<{
      id: string;
      name: string;
      value: string;
      priceModifier: number;
    }>;
  };
}

export interface Address {
  id: string;
  label: string;
  fullName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
  isDefault: boolean;
}

export interface DeliverySlot {
  id: string;
  label: string;
  subtitle: string;
  price: number;
  disabled?: boolean;
}

export interface DeliveryDate {
  value: string;
  day: string;
  date: string;
  month: string;
}

export type DeliveryMethod = 'home' | 'pickup';
