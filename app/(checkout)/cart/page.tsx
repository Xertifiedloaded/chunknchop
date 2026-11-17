import type { Metadata } from 'next';
import CartPage from '@/components/cart/cart-page';

export const metadata: Metadata = {
  title: 'Your bag | ChunknChop',
  description: 'Review your cut selection.',
};

export default function CartRoute() {
  return <CartPage />;
}
