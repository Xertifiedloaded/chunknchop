'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { ArrowDownToLine, ArrowUpFromLine, Copy, Ellipsis, Filter, Grid2X2, List, Loader2, PackageX, Pencil, Plus, Search, Trash2 } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  meatType: string;
  basePrice: number;
  stock: number;
  inStock: boolean;
  rating: number;
  reviewCount: number;
  isNewArrival: boolean;
  isBestSeller: boolean;
}

const MEAT_EMOJI: Record<string, string> = {
  BEEF: '🥩',
  CHICKEN: '🍗',
  GOAT: '🥩',
  TURKEY: '🍗',
  PORK: '🥩',
  SEAFOOD: '🦐',
  SAUSAGE: '🌭',
  BBQ: '🥩',
};

function emojiFor(meatType: string) {
  return MEAT_EMOJI[meatType?.toUpperCase()] ?? '🍖';
}

function formatNaira(amount: number) {
  return `₦${amount.toLocaleString('en-NG')}`;
}

function skuFor(product: Product) {
  return `CNC-${product.meatType?.slice(0, 3).toUpperCase() ?? 'GEN'}-${product.id.replace(/-/g, '').slice(-4).toUpperCase()}`;
}

type AvailabilityType = 'success' | 'warning' | 'danger';

function availabilityFor(product: Product): {
  label: string;
  type: AvailabilityType;
} {
  if (!product.inStock || product.stock <= 0) {
    return {
      label: 'Out of stock',
      type: 'danger',
    };
  }

  if (product.stock <= 20) {
    return {
      label: 'Low stock',
      type: 'warning',
    };
  }

  return {
    label: 'In stock',
    type: 'success',
  };
}

function ProductImage({ emoji, index }: { emoji: string; index: number }) {
  return <div className={`flex h-[28px] w-[28px] shrink-0 items-center justify-center overflow-hidden rounded-[11px] bg-[#f0f0ee] text-[16px] ${index % 2 === 0 ? '-rotate-2' : 'rotate-2'}`}>{emoji}</div>;
}

function AvailabilityBadge({ type, children }: { type: AvailabilityType; children: ReactNode }) {
  const styles: Record<AvailabilityType, string> = {
    success: 'bg-[#e9faf2] text-[#09965c]',
    warning: 'bg-[#fff7df] text-[#d98400]',
    danger: 'bg-[#ffeded] text-[#ed3b3b]',
  };

  const dots: Record<AvailabilityType, string> = {
    success: 'bg-[#12b76a]',
    warning: 'bg-[#f59e0b]',
    danger: 'bg-[#ef4444]',
  };

  return (
    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-[3px] text-[8px] leading-none font-medium whitespace-nowrap ${styles[type]}`}>
      <span className={`h-1 w-1 shrink-0 rounded-full ${dots[type]}`} />
      {children}
    </span>
  );
}

function RatingBadge({ rating, reviewCount }: { rating: number; reviewCount: number }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 text-[8px] leading-none whitespace-nowrap text-[#46433f]">
      <span className="text-[11px] leading-none text-[#f59e0b]">★</span>

      {rating.toFixed(1)}

      <span className="text-[#b7b3ae]">({reviewCount})</span>
    </span>
  );
}

function ActionButton({ children, onClick, disabled, label }: { children: ReactNode; onClick?: () => void; disabled?: boolean; label?: string }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} aria-label={label} className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[#8c8984] transition hover:bg-[#f4f3f1] hover:text-[#333] disabled:cursor-not-allowed disabled:opacity-50">
      {children}
    </button>
  );
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  useEffect(() => {
    async function fetchProducts() {
      setError(null);

      try {
        const response = await fetch('/api/admin/products');
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Could not load products.');
        }

        setProducts(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not load products.');
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  const meatTypes = useMemo(() => Array.from(new Set(products.map((product) => product.meatType))).sort(), [products]);

  const filtered = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(normalizedSearch) || skuFor(product).toLowerCase().includes(normalizedSearch);

      const matchesType = typeFilter === 'ALL' || product.meatType === typeFilter;

      return matchesSearch && matchesType;
    });
  }, [products, search, typeFilter]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This can't be undone.`)) {
      return;
    }

    setDeletingId(id);
    setError(null);

    try {
      const response = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);

        throw new Error(data?.error || 'Could not delete this product.');
      }

      setProducts((prev) => prev.filter((product) => product.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete this product.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-[#f7f8fa] px-3 py-4 font-sans text-[#292929] sm:px-5 sm:py-5 lg:px-6">
      <div className="mx-auto w-full max-w-[1600px]">
        {/* Header */}
        <header className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <h1 className="text-[16px] leading-5 font-semibold tracking-[-0.25px]">Products</h1>

            <p className="mt-1 max-w-[700px] text-[11px] leading-3.5 text-[#99958f]">Manage the ChunkNChop catalogue — cuts, weights, preparation options and storefront visibility.</p>
          </div>

          <div className="grid w-full grid-cols-2 gap-1.5 sm:flex sm:w-auto sm:items-center">
            <button type="button" className="flex h-[29px] items-center justify-center gap-1.5 rounded-[8px] border border-[#dedbd7] bg-white px-2.5 text-[11px] font-medium whitespace-nowrap text-[#343434] shadow-[0_1px_1px_rgba(0,0,0,0.02)] transition hover:bg-[#fafafa]">
              <ArrowUpFromLine size={11} strokeWidth={1.8} />
              Import
            </button>

            <button type="button" className="flex h-[29px] items-center justify-center gap-1.5 rounded-[8px] border border-[#dedbd7] bg-white px-2.5 text-[11px] font-medium whitespace-nowrap text-[#343434] shadow-[0_1px_1px_rgba(0,0,0,0.02)] transition hover:bg-[#fafafa]">
              <ArrowDownToLine size={11} strokeWidth={1.8} />
              Export
            </button>

            <Link href="/admin/products/new" className="bg-brand hover:bg-brand col-span-2 flex h-[29px] items-center justify-center gap-1.5 rounded-[8px] px-2.5 text-[11px] font-medium whitespace-nowrap text-white shadow-[0_2px_4px_rgba(242,101,42,0.2)] transition sm:col-span-1">
              <Plus size={11} strokeWidth={2.5} />
              Create Product
            </Link>
          </div>
        </header>

        {/* Error */}
        {error && <div className="border-brand/30 mb-3 rounded-[11px] border bg-[#fff4ee] px-3 py-2 text-[11px] leading-3.5 text-[#c4491d]">{error}</div>}

        {/* Main card */}
        <section className="w-full overflow-hidden rounded-[14px] border border-[#e7e5e2] bg-white shadow-[0_2px_7px_rgba(0,0,0,0.045)]">
          {/* Toolbar */}
          <div className="border-b border-[#eceae7] p-2.5 sm:p-3">
            <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center">
              {/* Search */}
              <div className="relative min-w-0 flex-1">
                <Search size={11} strokeWidth={1.7} className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-[#aaa]" />

                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products or SKU..." className="h-[28px] w-full rounded-[8px] border border-[#dedbd7] bg-white pr-2.5 pl-7 text-[11px] text-[#333] outline-none placeholder:text-[#a7a7b0] focus:border-[#c8c5c1]" />
              </div>

              {/* Toolbar controls */}
              <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-1.5 sm:flex sm:shrink-0 sm:items-center">
                <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="h-[28px] min-w-0 rounded-[8px] border border-[#dedbd7] bg-white px-2 text-[11px] text-[#454545] outline-none focus:border-[#c8c5c1] sm:w-[120px]">
                  <option value="ALL">All categories</option>

                  {meatTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>

                <button type="button" className="flex h-[28px] shrink-0 items-center justify-center gap-1.25 rounded-[8px] border border-[#dedbd7] bg-white px-2 text-[11px] font-medium whitespace-nowrap text-[#454545] transition hover:bg-[#fafafa]">
                  <Filter size={10} strokeWidth={1.8} />
                  Filters
                </button>

                <div className="flex h-[28px] shrink-0 items-center rounded-[8px] border border-[#dedbd7] bg-white p-0.5">
                  <button type="button" aria-label="List view" className="flex h-[23px] w-[23px] items-center justify-center rounded-[5px] bg-[#292824] text-white">
                    <List size={11} strokeWidth={2} />
                  </button>

                  <button type="button" aria-label="Grid view" className="flex h-[23px] w-[23px] items-center justify-center rounded-[5px] text-[#888]">
                    <Grid2X2 size={10} strokeWidth={1.8} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="w-full overflow-x-auto overscroll-x-contain">
            <table className="w-full min-w-[900px] border-collapse">
              <thead>
                <tr className="h-[26px] border-b border-[#eceae7] bg-[#fcfcfb] text-left">
                  <th className="w-[235px] px-3 text-[7px] leading-none font-medium whitespace-nowrap text-[#77736f]">Product</th>

                  <th className="w-[105px] px-2 text-[7px] leading-none font-medium whitespace-nowrap text-[#77736f]">SKU</th>

                  <th className="w-[80px] px-2 text-[7px] leading-none font-medium whitespace-nowrap text-[#77736f]">Category</th>

                  <th className="w-[90px] px-2 text-[7px] leading-none font-medium whitespace-nowrap text-[#77736f]">Price</th>

                  <th className="w-[55px] px-2 text-[7px] leading-none font-medium whitespace-nowrap text-[#77736f]">Stock</th>

                  <th className="w-[105px] px-2 text-[7px] leading-none font-medium whitespace-nowrap text-[#77736f]">Availability</th>

                  <th className="w-[85px] px-2 text-[7px] leading-none font-medium whitespace-nowrap text-[#77736f]">Rating</th>

                  <th className="w-[110px] px-1.5" />
                </tr>
              </thead>

              <tbody>
                {/* Loading */}
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="h-[48px] border-b border-[#efeeec] last:border-b-0">
                      <td className="px-3" colSpan={8}>
                        <div className="flex items-center gap-2">
                          <div className="h-[28px] w-[28px] animate-pulse rounded-[11px] bg-[#f0f0ee]" />

                          <div className="h-2 w-[180px] animate-pulse rounded bg-[#f0f0ee]" />
                        </div>
                      </td>
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-3 py-10">
                      <div className="flex flex-col items-center gap-2 text-center">
                        <PackageX size={26} strokeWidth={1.5} className="text-[#c8c5c1]" />

                        <p className="text-[10px] font-medium whitespace-nowrap text-[#46433f]">{products.length === 0 ? 'No products yet' : 'No products match your filters'}</p>

                        <p className="text-[8px] whitespace-nowrap text-[#99958f]">{products.length === 0 ? 'Add your first product to get the catalogue started.' : 'Try a different search term or category filter.'}</p>

                        {products.length === 0 && (
                          <Link href="/admin/products/new" className="bg-brand hover:bg-brand mt-1 flex items-center gap-1.5 rounded-[8px] px-2.5 py-1.5 text-[11px] font-medium whitespace-nowrap text-white transition">
                            <Plus size={11} strokeWidth={2.5} />
                            Add product
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((product, index) => {
                    const availability = availabilityFor(product);

                    return (
                      <tr key={product.id} className="h-[48px] border-b border-[#efeeec] last:border-b-0 hover:bg-[#fdfdfc]">
                        {/* Product */}
                        <td className="px-3">
                          <div className="flex min-w-0 items-center gap-2">
                            <ProductImage emoji={emojiFor(product.meatType)} index={index} />

                            <div className="font-sora min-w-0">
                              <div className="flex items-center gap-1 whitespace-nowrap">
                                <span className="max-w-[180px] truncate text-[11px] leading-none font-semibold whitespace-nowrap text-[#292929]">{product.name}</span>

                                {product.isBestSeller && <span className="shrink-0 text-[10px] leading-none text-[#f59e0b]">★</span>}

                                {product.isNewArrival && <span className="shrink-0 rounded-full bg-[#e9faf2] px-1.5 py-[2px] text-[6px] leading-none font-medium whitespace-nowrap text-[#09965c]">New</span>}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-2">
                          <span className="block font-mono text-[7px] leading-none whitespace-nowrap text-[#696661]">{skuFor(product)}</span>
                        </td>

                        <td className="px-2">
                          <span className="block text-[8px] leading-none whitespace-nowrap text-[#46433f]">{product.meatType}</span>
                        </td>

                        <td className="px-2">
                          <span className="font-sora block text-[11px] leading-none font-semibold whitespace-nowrap text-[#343230]">{formatNaira(product.basePrice)}</span>
                        </td>

                        {/* Stock */}
                        <td className="px-2">
                          <span className="block text-[8px] leading-none whitespace-nowrap text-[#55514c]">{product.stock}</span>
                        </td>

                        {/* Availability */}
                        <td className="px-2">
                          <AvailabilityBadge type={availability.type}>{availability.label}</AvailabilityBadge>
                        </td>

                        {/* Rating */}
                        <td className="px-2">
                          <RatingBadge rating={product.rating} reviewCount={product.reviewCount} />
                        </td>

                        {/* Actions */}
                        <td className="px-1.5">
                          <div className="flex items-center justify-end gap-0.5 whitespace-nowrap">
                            <Link href={`/admin/products/${product.id}`}>
                              <ActionButton label={`Edit ${product.name}`}>
                                <Pencil size={12} strokeWidth={1.6} />
                              </ActionButton>
                            </Link>

                            <ActionButton label={`Duplicate ${product.name}`}>
                              <Copy size={12} strokeWidth={1.6} />
                            </ActionButton>

                            <ActionButton label="More options">
                              <Ellipsis size={13} strokeWidth={1.7} />
                            </ActionButton>

                            <ActionButton label={`Delete ${product.name}`} disabled={deletingId === product.id} onClick={() => handleDelete(product.id, product.name)}>
                              {deletingId === product.id ? <Loader2 size={12} strokeWidth={1.6} className="animate-spin" /> : <Trash2 size={12} strokeWidth={1.6} />}
                            </ActionButton>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile hint */}
          {!loading && filtered.length > 0 && <div className="border-t border-[#efeeec] px-3 py-1.5 text-center text-[7px] text-[#aaa] sm:hidden">Swipe horizontally to view all columns</div>}
        </section>
      </div>
    </main>
  );
}
