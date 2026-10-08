import type { LucideIcon } from 'lucide-react';

export interface AuthField {
  name: string;
  label?: string;
  type?: string;
  icon?: LucideIcon;
  placeholder?: string;
  autoComplete?: string;
  hint?: string;
  linkLabel?: string;
  linkHref?: string;
  required?: boolean;
}

export interface ProductFormData {
  name: string;
  description: string;
  categoryId: string;
  basePrice: string;
  stock: string;
  unit: string;
  reorderPoint: string;
  locationId: string;
  tags: string;
  preparations: string;
  isNewArrival: boolean;
  isBestSeller: boolean;
  sameDayDelivery: boolean;
}
