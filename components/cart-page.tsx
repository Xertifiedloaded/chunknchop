'use client';

import Link from 'next/link';
import { ArrowLeft, ArrowRight, Minus, Plus, Trash2 } from 'lucide-react';
import { useCart } from '@/components/cart-provider';
import { formatPrice } from '@/lib/catalog';

export default function CartPage() {
  const {
    items,
    subtotalCents,
    cartCount,
    setQuantity,
    removeProduct,
    isSignedIn,
    isLoading,
    error,
  } = useCart();
  const checkoutHref = isSignedIn ? '/checkout' : '/sign-in?returnTo=/checkout';

  return (
    <main className="cart-page">
      <header className="catalog-top">
        <Link href="/shop" className="catalog-back">
          <ArrowLeft size={15} /> CONTINUE SHOPPING
        </Link>
        <Link href="/" className="catalog-wordmark">
ChunknChop
        </Link>
        <span className="catalog-bag">
          YOUR BAG <span>{cartCount}</span>
        </span>
      </header>
      <section className="cart-content">
        <div className="cart-heading">
          <p className="eyebrow">
            <span /> YOUR SELECTION
          </p>
          <h1>
            Your <em>bag.</em>
          </h1>
          <p>
            {isSignedIn
              ? 'Your bag is saved to your ChunknChop account.'
              : 'Sign in to save your bag to your account. Guest items stay in memory only and aren’t stored in your browser.'}
          </p>
        </div>
        {error && (
          <p className="cart-error" role="alert">
            {error}
          </p>
        )}
        {isLoading ? (
          <div className="cart-empty">
            <p>Loading your saved bag…</p>
          </div>
        ) : items.length === 0 ? (
          <div className="cart-empty">
            <span className="cart-empty-mark">
              F<span>&</span>
            </span>
            <h2>Your bag is taking a breather.</h2>
            <p>Find something good for the table.</p>
            <Link href="/shop" className="cart-continue">
              EXPLORE THE CUTS <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <div className="cart-layout">
            <div className="cart-items">
              {items.map(({ product, quantity }) => (
                <article className="cart-line" key={product.slug}>
                  <Link href={`/products/${product.slug}`} className="cart-line-image">
                    <img src={product.imageUrl} alt={product.name} />
                  </Link>
                  <div className="cart-line-info">
                    <span>{product.category.toUpperCase()}</span>
                    <h2>
                      <Link href={`/products/${product.slug}`}>{product.name}</Link>
                    </h2>
                    <p>{product.cut}</p>
                    <div className="cart-quantity">
                      <button
                        onClick={() => setQuantity(product.slug, quantity - 1)}
                        aria-label={`Decrease ${product.name} quantity`}
                      >
                        <Minus size={13} />
                      </button>
                      <span>{quantity}</span>
                      <button
                        onClick={() => setQuantity(product.slug, quantity + 1)}
                        aria-label={`Increase ${product.name} quantity`}
                        disabled={quantity >= 99}
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                  </div>
                  <div className="cart-line-price">
                    <strong>{formatPrice(product.priceCents * quantity)}</strong>
                    <button
                      onClick={() => removeProduct(product.slug)}
                      aria-label={`Remove ${product.name}`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
            <aside className="cart-summary">
              <p>ORDER SUMMARY</p>
              <div>
                <span>Subtotal</span>
                <strong>{formatPrice(subtotalCents)}</strong>
              </div>
              <div>
                <span>Delivery and taxes</span>
                <strong>Confirmed later</strong>
              </div>
              <div className="cart-total">
                <span>Estimated subtotal</span>
                <strong>{formatPrice(subtotalCents)}</strong>
              </div>
              <Link className="cart-checkout" href={checkoutHref}>
                {isSignedIn ? 'CONTINUE TO CHECKOUT' : 'SIGN IN TO CHECK OUT'}{' '}
                <ArrowRight size={15} />
              </Link>
              <small>Payment is arranged after we receive your order request.</small>
            </aside>
          </div>
        )}
      </section>
      <footer className="catalog-footer">
        <span>ChunknChop</span>
        <span>GOOD MEAT. GOOD LIVING.</span>
        <Link href="/shop">KEEP BROWSING</Link>
      </footer>
    </main>
  );
}
