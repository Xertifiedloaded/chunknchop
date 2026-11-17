import type { Metadata } from 'next';
import CheckoutPageClient from '@/components/checkout/checkout-page';

export const metadata: Metadata = {
  title: 'Checkout | ChunknChop',
  description: 'Securely pay for your ChunknChop order with Paystack.',
};

export default function CheckoutPage() {
  return <CheckoutPageClient />;
}
