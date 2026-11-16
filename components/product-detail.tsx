'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Check, Heart, Minus, Plus } from 'lucide-react';
import type { CatalogProduct } from '@/lib/catalog';
import { formatPrice } from '@/lib/catalog';
import { useCart } from '@/components/cart-provider';

export default function ProductDetail({ product }: { product: CatalogProduct }) {
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [favorite, setFavorite] = useState(false);
  const { addProduct, cartCount, error: cartError } = useCart();

  function addToBag() {
    addProduct(product, quantity);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1600);
  }

  return (
    <main className="detail-page">
      <header className="catalog-top">
        <Link href="/shop" className="catalog-back">
          <ArrowLeft size={15} /> SHOP ALL
        </Link>
        <Link href="/" className="catalog-wordmark">
ChunknChop
        </Link>
        <Link href="/cart" className="catalog-bag">
          YOUR BAG <span>{cartCount}</span>
        </Link>
      </header>
      <div className="detail-breadcrumb">
        <Link href="/">Home</Link>
        <span>/</span>
        <Link href="/shop">Shop all</Link>
        <span>/</span>
        <span>{product.name}</span>
      </div>
      <section className="detail-layout">
        <div className="detail-image">
          <img src={product.imageUrl} alt={product.name} />
          {product.badge && <span className="detail-badge">{product.badge}</span>}
        </div>
        <div className="detail-copy">
          <p className="eyebrow">
            <span /> {product.category.toUpperCase()} · ChunknChop
          </p>
          <h1>{product.name}</h1>
          <p className="detail-price">
            {formatPrice(product.priceCents)}
            <small>{` / ${product.unit}`}</small>
          </p>
          <p className="detail-description">{product.description}</p>
          <div className="detail-divider" />
          <div className="detail-cut">
            <span>YOUR CUT</span>
            <strong>{product.cut}</strong>
          </div>
          <div className="detail-quantity">
            <span>QUANTITY</span>
            <div>
              <button
                onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                aria-label="Decrease quantity"
              >
                <Minus size={15} />
              </button>
              <strong>{quantity}</strong>
              <button
                onClick={() => setQuantity((value) => Math.min(99, value + 1))}
                aria-label="Increase quantity"
                disabled={quantity >= 99}
              >
                <Plus size={15} />
              </button>
            </div>
          </div>
          <div className="detail-actions">
            <button className={`detail-add ${added ? 'added' : ''}`} onClick={addToBag}>
              {added ? (
                <>
                  <Check size={17} /> ADDED TO BAG
                </>
              ) : (
                <>
                  ADD TO BAG · {formatPrice(product.priceCents * quantity)} <ArrowRight size={16} />
                </>
              )}
            </button>
            <button
              className={`detail-favorite ${favorite ? 'selected' : ''}`}
              onClick={() => setFavorite(!favorite)}
              aria-label={favorite ? 'Remove from favorites' : 'Add to favorites'}
              aria-pressed={favorite}
            >
              <Heart size={18} fill={favorite ? 'currentColor' : 'none'} />
            </button>
          </div>
          {cartError && (
            <p className="cart-error" role="alert">
              {cartError}
            </p>
          )}
          <div className="detail-delivery">
            <span>Product information</span>
            <div>
              <strong>Availability and details</strong>
              <span>Product information is provided by ChunknChop.</span>
            </div>
          </div>
        </div>
      </section>
      <footer className="detail-bottom">
        <Link href="/shop">
          <ArrowLeft size={14} /> BACK TO THE COUNTER
        </Link>
        <span>ChunknChop · GOOD MEAT. GOOD LIVING.</span>
      </footer>
    </main>
  );
}
