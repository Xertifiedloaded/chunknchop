'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowUpRight, Search, SlidersHorizontal } from 'lucide-react';
import { useCart } from '@/components/cart-provider';
import { formatPrice, productCategories, type CatalogProduct } from '@/lib/catalog';

export default function CatalogPage({ products }: { products: CatalogProduct[] }) {
  const [category, setCategory] = useState('All cuts');
  const [query, setQuery] = useState('');
  const { cartCount } = useCart();
  const visibleProducts = useMemo(
    () =>
      products.filter(
        (product) =>
          (category === 'All cuts' || product.category === category) &&
          `${product.name} ${product.cut} ${product.category}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [products, category, query],
  );

  return (
    <main className="catalog-page">
      <header className="catalog-top">
        <Link href="/" className="catalog-back">
          <ArrowLeft size={15} /> BACK HOME
        </Link>
        <Link href="/" className="catalog-wordmark">
          FIELD <i>&</i> FABLE
        </Link>
        <Link href="/cart" className="catalog-bag">
          YOUR BAG <span>{cartCount}</span>
        </Link>
      </header>
      <section className="catalog-intro">
        <p className="eyebrow">
          <span /> FROM OUR COUNTER
        </p>
        <h1>
          Find your <em>good cut.</em>
        </h1>
        <p>Browse the cuts currently available from ChunknChop.</p>
        <div className="catalog-breadcrumb">
          <Link href="/">Home</Link>
          <span>/</span>
          <span>Shop all</span>
        </div>
      </section>
      <section className="catalog-content" aria-label="Product catalogue">
        <aside className="catalog-sidebar">
          <p className="sidebar-label">SHOP BY CUT</p>
          {['All cuts', ...productCategories].map((item) => (
            <button
              key={item}
              className={category === item ? 'selected' : ''}
              onClick={() => setCategory(item)}
            >
              {item}
              <span>
                {item === 'All cuts'
                  ? products.length
                  : products.filter((product) => product.category === item).length}
              </span>
            </button>
          ))}
          <div className="catalog-note">
            <span>GOOD TO KNOW</span>
            <p>Product details and availability come directly from our current counter.</p>
          </div>
        </aside>
        <div className="catalog-results">
          <div className="catalog-controls">
            <div>
              <span>
                {visibleProducts.length} {visibleProducts.length === 1 ? 'cut' : 'cuts'}
              </span>
              <span className="result-divider">·</span>
              <span>Available now</span>
            </div>
            <label className="catalog-search">
              <Search size={16} />
              <span className="sr-only">Search cuts</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search cuts"
              />
              <SlidersHorizontal size={16} />
            </label>
          </div>
          <div className="catalog-product-grid">
            {visibleProducts.map((product) => (
              <Link className="catalog-product" href={`/products/${product.slug}`} key={product.id}>
                <div className="catalog-product-image">
                  <img src={product.imageUrl} alt={product.name} />
                  {product.badge && <span>{product.badge}</span>}
                  <i>
                    <ArrowUpRight size={17} />
                  </i>
                </div>
                <div className="catalog-product-meta">
                  <span>{product.category.toUpperCase()}</span>
                </div>
                <div className="catalog-product-title">
                  <h2 className='capitalize'>{product.name}</h2>
                  <strong>
                    {formatPrice(product.priceCents)}
                    <small>{` / ${product.unit}`}</small>
                  </strong>
                </div>
                <p>{product.cut}</p>
              </Link>
            ))}
            {visibleProducts.length === 0 && (
              <div className="catalog-empty">
                <Search size={21} />
                <h2>{products.length ? 'No cuts found' : 'No cuts available yet'}</h2>
                <p>
                  {products.length
                    ? 'Try a different search or category.'
                    : 'New products will appear here once they are published.'}
                </p>
                {products.length > 0 && (
                  <button
                    onClick={() => {
                      setQuery('');
                      setCategory('All cuts');
                    }}
                  >
                    CLEAR FILTERS
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
      <footer className="catalog-footer">
        <span>ChunknChop</span>
        <span>GOOD MEAT. GOOD LIVING.</span>
        <Link href="/">
          RETURN HOME <ArrowUpRight size={14} />
        </Link>
      </footer>
    </main>
  );
}
