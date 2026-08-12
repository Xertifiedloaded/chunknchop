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
  price: number;
  description?: string;
}
