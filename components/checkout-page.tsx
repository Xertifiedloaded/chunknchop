'use client';

import Link from 'next/link';
import { useRef, useState, type FormEvent } from 'react';
import { ArrowLeft, ArrowRight, LoaderCircle } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { useCart } from '@/components/cart-provider';
import { formatPrice } from '@/lib/catalog';

type CheckoutResponse = { orderNumber: string; authorizationUrl: string };

export default function CheckoutPageClient() {
  const { user, isLoading: sessionPending } = useAuth();
  const { items, subtotalCents, cartCount, isLoading: cartLoading } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const checkoutRequestId = useRef<string | null>(null);

  async function placeOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    const form = new FormData(event.currentTarget);
    const values = Object.fromEntries(form.entries());
    checkoutRequestId.current ??= crypto.randomUUID();

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, checkoutRequestId: checkoutRequestId.current }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok)
        throw new Error(result?.error || 'We couldn’t place your order. Please try again.');
      const checkout = result as CheckoutResponse;
      if (!checkout.authorizationUrl) throw new Error('Paystack did not return a checkout link.');
      window.location.assign(checkout.authorizationUrl);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'We couldn’t place your order. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="checkout-page">
      <header className="catalog-top">
        <Link href="/cart" className="catalog-back">
          <ArrowLeft size={15} /> BACK TO YOUR BAG
        </Link>
        <Link href="/" className="catalog-wordmark">
          FIELD <i>&</i> FABLE
        </Link>
        <span className="catalog-bag">
          CHECKOUT <span>{cartCount}</span>
        </span>
      </header>
      {!sessionPending && !user ? (
        <section className="checkout-gate">
          <p className="eyebrow">
            <span /> YOUR BAG IS ACCOUNT-BASED
          </p>
          <h1>
            Sign in to
            <br />
            <em>check out.</em>
          </h1>
          <p>
            Your bag is saved to your account once you sign in. We don&apos;t store cart data in
            your browser.
          </p>
          <Link href="/sign-in?returnTo=/checkout" className="checkout-submit">
            SIGN IN TO CONTINUE <ArrowRight size={16} />
          </Link>
        </section>
      ) : cartLoading || sessionPending ? (
        <section className="checkout-gate">
          <LoaderCircle className="auth-spinner" size={22} />
          <p>Loading your saved bag…</p>
        </section>
      ) : items.length === 0 ? (
        <section className="checkout-gate">
          <p className="eyebrow">
            <span /> YOUR BAG IS EMPTY
          </p>
          <h1>
            Nothing to
            <br />
            <em>check out.</em>
          </h1>
          <Link href="/shop" className="checkout-submit">
            EXPLORE THE CUTS <ArrowRight size={16} />
          </Link>
        </section>
      ) : (
        <section className="checkout-layout">
          <div className="checkout-form-panel">
            <p className="eyebrow">
              <span /> DELIVERY DETAILS
            </p>
            <h1>
              Almost <em>there.</em>
            </h1>
            <p className="checkout-account">Signed in as {user?.email}</p>
            <form
              className="checkout-form"
              onInput={() => {
                checkoutRequestId.current = null;
              }}
              onSubmit={placeOrder}
            >
              <label>
                Full name
                <input name="fullName" autoComplete="name" maxLength={100} required />
              </label>
              <label>
                Phone number
                <input name="phone" type="tel" autoComplete="tel" maxLength={32} required />
              </label>
              <label className="checkout-field-wide">
                Address line 1
                <input name="addressLine1" autoComplete="address-line1" maxLength={160} required />
              </label>
              <label className="checkout-field-wide">
                Address line 2 <span>(optional)</span>
                <input name="addressLine2" autoComplete="address-line2" maxLength={160} />
              </label>
              <label>
                City
                <input name="city" autoComplete="address-level2" maxLength={80} required />
              </label>
              <label>
                State / region
                <input name="region" autoComplete="address-level1" maxLength={80} required />
              </label>
              <label>
                Postal code
                <input name="postalCode" autoComplete="postal-code" maxLength={20} required />
              </label>
              <p className="checkout-payment-note checkout-field-wide">
                You&apos;ll be redirected to Paystack&apos;s secure checkout to complete payment in
                Nigerian naira (₦).
              </p>
              {error && (
                <p className="checkout-error checkout-field-wide" role="alert">
                  {error}
                </p>
              )}
              <button
                type="submit"
                className="checkout-submit checkout-field-wide"
                disabled={submitting}
              >
                {submitting ? (
                  <LoaderCircle className="auth-spinner" size={16} />
                ) : (
                  <>
                    CONTINUE TO PAYSTACK <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          </div>
          <aside className="checkout-summary">
            <p className="eyebrow">
              <span /> ORDER SUMMARY
            </p>
            {items.map(({ product, quantity }) => (
              <div className="checkout-summary-item" key={product.slug}>
                <span>
                  {product.name} <i>× {quantity}</i>
                </span>
                <strong>{formatPrice(product.priceCents * quantity)}</strong>
              </div>
            ))}
            <div className="checkout-total">
              <span>Subtotal</span>
              <strong>{formatPrice(subtotalCents)}</strong>
            </div>
            <p>
              Paystack charges the subtotal shown above. Delivery and tax fees are not added at
              checkout.
            </p>
          </aside>
        </section>
      )}
      <footer className="catalog-footer">
        <span>ChunknChop</span>
        <span>GOOD MEAT. GOOD LIVING.</span>
        <Link href="/shop">KEEP BROWSING</Link>
      </footer>
    </main>
  );
}