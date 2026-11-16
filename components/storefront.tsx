'use client';

import { useMemo, useState, type FormEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/components/cart-provider';
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  Heart,
  Menu,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Truck,
  X,
} from 'lucide-react';
import { productCategories, type CatalogProduct } from '@/lib/catalog';

function Header({ cartCount }: { cartCount: number }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <>
      <div className="topline">
        <span>GOOD FOOD STARTS WITH GOOD SOURCING.</span>
        <span className="topline-right">
          <Truck size={14} /> THOUGHTFULLY SOURCED, CAREFULLY CUT
        </span>
      </div>
      <header className="site-header">
        <Link href="/" className="wordmark" aria-label="ChunknChop home">
          <span className="brand-name">
            ChunknChop
          </span>
        </Link>
        <nav className={`main-nav ${menuOpen ? 'is-open' : ''}`} aria-label="Main navigation">
          <Link href="/shop" onClick={() => setMenuOpen(false)}>
            Shop all
          </Link>
          <Link href="#categories" onClick={() => setMenuOpen(false)}>
            Our cuts <ChevronDown size={13} />
          </Link>
          <Link href="#story" onClick={() => setMenuOpen(false)}>
            Our story
          </Link>
        </nav>
        <div className="header-actions">
          <Link href="#shop" className="search-link" aria-label="Search products">
            <Search size={19} />
          </Link>
          <Link href="/account" className="account-link">
            Account
          </Link>
          <Link
            href="/cart"
            className="bag-link"
            aria-label={`Shopping bag, ${cartCount} ${cartCount === 1 ? 'item' : 'items'}`}
          >
            <ShoppingBag size={19} />
            <span className="bag-count">{cartCount}</span>
          </Link>
          <button
            className="mobile-menu"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </header>
    </>
  );
}

function ProductCard({
  product,
  onAdd,
  added,
  isFavorite,
  onToggleFavorite,
}: {
  product: CatalogProduct;
  onAdd: (product: CatalogProduct) => void;
  added: boolean;
  isFavorite: boolean;
  onToggleFavorite: (slug: string) => void;
}) {
  return (
    <article className="product-card">
      <div className="product-image-wrap">
        <img src={product.imageUrl} alt={product.name} className="product-image" />
        {product.badge && <span className="product-badge">{product.badge}</span>}
        <button
          className="favorite-button"
          aria-label={`${isFavorite ? 'Remove' : 'Save'} ${product.name} ${isFavorite ? 'from' : 'to'} favorites`}
          aria-pressed={isFavorite}
          onClick={() => onToggleFavorite(product.slug)}
        >
          <Heart size={17} fill={isFavorite ? 'currentColor' : 'none'} />
        </button>
        <button
          className={`quick-add ${added ? 'is-added' : ''}`}
          onClick={() => onAdd(product)}
          aria-label={`Add ${product.name} to bag`}
        >
          {added ? <Check size={17} /> : <span>+</span>}
        </button>
      </div>
      <div className="product-info">
        <div className="product-category">{product.category}</div>
        <div className="product-name-row">
          <h3>
            <Link href={`/products/${product.slug}`}>{product.name}</Link>
          </h3>
          <strong>
            ₦{(product.priceCents / 100).toLocaleString("en-NG", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
            <small>{` / ${product.unit}`}</small>
          </strong>
        </div>
        <p>{product.cut}</p>
      </div>
    </article>
  );
}

function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function subscribe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setStatus('');
    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, website: '' }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to subscribe right now.');
      setEmail('');
      setStatus(result.message);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to subscribe right now.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="newsletter-form" onSubmit={subscribe}>
      <label htmlFor="newsletter-email">Leave your email for recipes and seasonal updates.</label>
      <div>
        <input
          id="newsletter-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="Your email address"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <button type="submit" disabled={submitting} aria-label="Subscribe to newsletter">
          <ArrowRight size={19} />
        </button>
      </div>
      <small>Your email is stored securely. Email delivery is not configured yet.</small>
      <p className="newsletter-status" role="status" aria-live="polite">
        {status}
      </p>
    </form>
  );
}

export default function Storefront({ products }: { products: CatalogProduct[] }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All cuts');
  const { cartCount, addProduct, error: cartError } = useCart();
  const [lastAdded, setLastAdded] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(() => new Set());
  const filteredProducts = useMemo(
    () =>
      products.filter(
        (product) =>
          (category === 'All cuts' || product.category === category) &&
          `${product.name} ${product.category} ${product.cut}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [products, category, query],
  );
  const categories = productCategories.flatMap((name, index) => {
    const matching = products.filter((product) => product.category === name);
    return matching.length
      ? [
        {
          name,
          count: `${matching.length} ${matching.length === 1 ? 'cut' : 'cuts'}`,
          image: matching[0].imageUrl,
          index,
        },
      ]
      : [];
  });
  const addToCart = (product: CatalogProduct) => {
    addProduct(product);
    setLastAdded(product.slug);
    window.setTimeout(
      () => setLastAdded((current) => (current === product.slug ? null : current)),
      1200,
    );
  };
  const toggleFavorite = (slug: string) =>
    setFavorites((current) => {
      const updated = new Set(current);
      if (updated.has(slug)) updated.delete(slug);
      else updated.add(slug);
      return updated;
    });

  return (
    <main id="home">
      <Header cartCount={cartCount} />
      <section className="hero">
        <Image
          src="/images/market-hero.png"
          alt="Freshly prepared cuts from the butcher"
          fill
          priority
          className="hero-image"
        />
        <div className="hero-shade" />
        <div className="hero-content">
          <p className="eyebrow light">
            <span /> THE GOOD STUFF, FROM THE SOURCE
          </p>
          <h1>
            Better meat.
            <br />
            <em>Better moments.</em>
          </h1>
          <p className="hero-copy">
            Thoughtfully sourced, carefully cut, and ready to make more of the meals you love.
          </p>
          <Link href="#shop" className="button-light">
            SHOP THE COLLECTION <ArrowUpRight size={16} />
          </Link>
          <div className="hero-proof">
            <span>ChunknChop</span>
            <span>Good meat. Good people. Good living.</span>
          </div>
        </div>
        <a href="#categories" className="hero-scroll">
          SCROLL TO DISCOVER <ArrowDown size={14} />
        </a>
      </section>
      <section className="promise-strip" aria-label="Our promises">
        <div>
          <span className="promise-mark">01</span>
          <p>
            Responsibly raised<span>No shortcuts. Ever.</span>
          </p>
        </div>
        <div>
          <span className="promise-mark">02</span>
          <p>
            Cut by our butchers<span>Craft you can taste.</span>
          </p>
        </div>
        <div>
          <span className="promise-mark">03</span>
          <p>
            Thoughtfully packed<span>Care from our counter.</span>
          </p>
        </div>
        <div className="promise-end">
          A better kind of butcher shop <ArrowRight size={16} />
        </div>
      </section>
      <section className="category-section section-pad" id="categories">
        <div className="section-heading">
          <div>
            <p className="eyebrow">
              <span /> FIND YOUR FAVOURITE
            </p>
            <h2>
              Good things,
              <br />
              <em>by the cut.</em>
            </h2>
          </div>
          <Link href="/shop" className="text-link">
            EXPLORE ALL CUTS <ArrowUpRight size={15} />
          </Link>
        </div>
        {categories.length ? (
          <div className="category-grid">
            {categories.map((item) => (
              <Link
                href="#shop"
                className="category-card"
                key={item.name}
                onClick={() => setCategory(item.name)}
              >
                <img src={item.image} alt="" />
                <span className="category-number">{String(item.index + 1).padStart(2, '0')}</span>
                <div className="category-label">
                  <div>
                    <h3>{item.name}</h3>
                    <p>{item.count}</p>
                  </div>
                  <span className="category-arrow">
                    <ArrowUpRight size={17} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="catalog-empty">
            Our counter is being stocked. Check back soon for available cuts.
          </p>
        )}
      </section>
      <section className="shop-section section-pad" id="shop">
        <div className="shop-heading">
          <div>
            <p className="eyebrow">
              <span /> FROM OUR COUNTER
            </p>
            <h2>
              The <em>good cuts.</em>
            </h2>
            <p className="section-subtitle">
              Browse the cuts currently available from ChunknChop.
            </p>
          </div>
          <Link href="/shop" className="text-link">
            VIEW THE FULL RANGE <ArrowUpRight size={15} />
          </Link>
        </div>
        <div className="catalog-toolbar">
          <div className="category-tabs" role="group" aria-label="Filter by category">
            {['All cuts', ...productCategories].map((item) => (
              <button
                key={item}
                className={category === item ? 'active' : ''}
                onClick={() => setCategory(item)}
              >
                {item}
              </button>
            ))}
          </div>
          <label className="catalog-search">
            <Search size={16} />
            <span className="sr-only">Search products</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Find your cut"
            />
            <SlidersHorizontal size={16} />
          </label>
        </div>
        <div className="product-grid">
          {filteredProducts.length ? (
            filteredProducts
              .slice(0, 4)
              .map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAdd={addToCart}
                  added={lastAdded === product.slug}
                  isFavorite={favorites.has(product.slug)}
                  onToggleFavorite={toggleFavorite}
                />
              ))
          ) : (
            <p className="no-results">
              {products.length
                ? 'No cuts match your search. Try another filter.'
                : 'No products are available yet. Please check back soon.'}
            </p>
          )}
        </div>
      </section>
      <section className="story-section" id="story">
        <div className="story-image">
          <img
            src="https://images.unsplash.com/photo-1551028150-64b9f398f678?auto=format&fit=crop&w=1200&q=85"
            alt="A butcher carefully preparing a fresh cut"
          />
          <span className="story-stamp">
            GOOD
            <br />
            BY
            <br />
            NATURE
          </span>
        </div>
        <div className="story-copy">
          <p className="eyebrow">
            <span /> A LITTLE ABOUT US
          </p>
          <h2>
            Know your
            <br />
            <em>butcher.</em>
          </h2>
          <p>
            We believe the best meals begin long before the kitchen. That&apos;s why we work with
            small farms who care for their animals and our planet — then bring every cut to you with
            the care it deserves.
          </p>
          <Link href="#story" className="text-link">
            THE ChunknChop WAY <ArrowUpRight size={15} />
          </Link>
          <div className="story-signoff">Good meat. Good people. Good living.</div>
        </div>
      </section>
      <section className="newsletter">
        <div>
          <p className="eyebrow light">
            <span /> NOTES FROM THE FARM
          </p>
          <h2>
            A little goodness,
            <br />
            <em>in your inbox.</em>
          </h2>
        </div>
        <NewsletterForm />
      </section>
      <footer className="site-footer">
        <div className="footer-top">
          <Link href="/" className="wordmark">

            <span className="brand-name">
              ChunknChop
            </span>
          </Link>

          <div className="footer-links">
            <Link href="/shop">Shop</Link>
            <Link href="#story">Our story</Link>
            <Link href="/account">Account</Link>
            <Link href="/admin">Admin</Link>
          </div>
          <div className="footer-social">
            <span>FOLLOW ALONG</span>
            <a href="#social" aria-label="Instagram">
              IG
            </a>
            <a href="#social" aria-label="Pinterest">
              P
            </a>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 ChunknChop. MADE WITH CARE.</span>
          <div>
            <Link href="#privacy">PRIVACY</Link>
            <Link href="#terms">TERMS</Link>
          </div>
          <span>GOOD MEAT, GOOD MOOD.</span>
        </div>
      </footer>
      {cartError && (
        <div className="cart-toast cart-error-toast" role="alert">
          {cartError}
        </div>
      )}
      {lastAdded && !cartError && (
        <div className="cart-toast" role="status">
          <Check size={16} /> Added to your bag{' '}
          <span>
            {cartCount} {cartCount === 1 ? 'item' : 'items'}
          </span>
        </div>
      )}
    </main>
  );
}
