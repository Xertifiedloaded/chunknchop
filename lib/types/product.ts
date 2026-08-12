export interface Product {
  id: string;
  name: string;
  description: string;
  images: string[];
  basePrice: number;
  stock: number;
  inStock: boolean;
  category: string;
  meatType: string;
  tags: string[];
  preparations: string[];
  isNewArrival: boolean;
  isBestSeller: boolean;
  sameDayDelivery: boolean;
  rating: number;
  reviewCount: number;
  createdAt: string;
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
