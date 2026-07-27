'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Plus, Trash2, Pencil, Search, PackageX, Loader2 } from 'lucide-react';

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

export default function AdminProducts() {
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

  const meatTypes = useMemo(() => Array.from(new Set(products.map((p) => p.meatType))).sort(), [products]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(search.trim().toLowerCase());
      const matchesType = typeFilter === 'ALL' || p.meatType === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [products, search, typeFilter]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This can't be undone.`)) return;

    setDeletingId(id);
    setError(null);
    try {
      const response = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Could not delete this product.');
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete this product.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="bg-sand min-h-screen p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-charcoal text-3xl font-bold">Products</h1>
          <p className="text-ink">Manage everything in your catalog</p>
        </div>
        <Link href="/admin/products/new" className="bg-brand text-brand-foreground flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition hover:opacity-90">
          <Plus size={18} />
          Add product
        </Link>
      </div>

      {error && <div className="border-brand/30 bg-brand/10 text-brand mb-4 rounded-lg border px-4 py-3 text-sm">{error}</div>}

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative">
          <Search size={16} className="text-ink pointer-events-none absolute top-1/2 left-3 -translate-y-1/2" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products..." className="border-ink/20 text-charcoal placeholder:text-ink/60 focus:border-brand focus:ring-brand/20 w-64 rounded-lg border bg-white py-2 pr-3 pl-9 text-sm focus:ring-2 focus:outline-none" />
        </div>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="border-ink/20 text-charcoal focus:border-brand focus:ring-brand/20 rounded-lg border bg-white px-3 py-2 text-sm focus:ring-2 focus:outline-none">
          <option value="ALL">All types</option>
          {meatTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      <div className="border-sand overflow-hidden rounded-2xl border bg-white shadow-sm">
        {loading ? (
          <div className="divide-sand divide-y">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4">
                <div className="bg-sand h-4 w-40 animate-pulse rounded" />
                <div className="bg-sand h-4 w-20 animate-pulse rounded" />
                <div className="bg-sand h-4 w-16 animate-pulse rounded" />
                <div className="bg-sand h-4 w-24 animate-pulse rounded" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <PackageX size={36} className="text-ink/40" />
            <p className="text-charcoal font-medium">{products.length === 0 ? 'No products yet' : 'No products match your filters'}</p>
            <p className="text-ink text-sm">{products.length === 0 ? 'Add your first product to get the catalog started.' : 'Try a different search term or type filter.'}</p>
            {products.length === 0 && (
              <Link href="/admin/products/new" className="bg-brand text-brand-foreground mt-2 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition hover:opacity-90">
                <Plus size={16} />
                Add product
              </Link>
            )}
          </div>
        ) : (
          <table className="w-full">
            <thead className="border-sand bg-sand/50 border-b">
              <tr>
                <th className="text-charcoal px-6 py-3 text-left text-xs font-semibold tracking-wide uppercase">Name</th>
                <th className="text-charcoal px-6 py-3 text-left text-xs font-semibold tracking-wide uppercase">Type</th>
                <th className="text-charcoal px-6 py-3 text-left text-xs font-semibold tracking-wide uppercase">Price</th>
                <th className="text-charcoal px-6 py-3 text-left text-xs font-semibold tracking-wide uppercase">Stock</th>
                <th className="text-charcoal px-6 py-3 text-left text-xs font-semibold tracking-wide uppercase">Rating</th>
                <th className="text-charcoal px-6 py-3 text-left text-xs font-semibold tracking-wide uppercase">Badges</th>
                <th className="text-charcoal px-6 py-3 text-right text-xs font-semibold tracking-wide uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-sand divide-y">
              {filtered.map((product) => (
                <tr key={product.id} className="transition hover:bg-[var(--color-cream)]/30">
                  <td className="text-charcoal px-6 py-3 text-sm font-medium">{product.name}</td>
                  <td className="text-ink px-6 py-3 text-sm">{product.meatType}</td>
                  <td className="text-charcoal px-6 py-3 text-sm">${product.basePrice.toFixed(2)}</td>
                  <td className="px-6 py-3 text-sm">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${product.inStock ? 'bg-[var(--color-slate-custom)]/10 text-[var(--color-slate-custom)]' : 'bg-brand/10 text-brand'}`}>{product.stock} in stock</span>
                  </td>
                  <td className="text-charcoal px-6 py-3 text-sm">
                    ⭐ {product.rating.toFixed(1)} ({product.reviewCount})
                  </td>
                  <td className="px-6 py-3 text-sm">
                    <div className="flex gap-1.5">
                      {product.isNewArrival && <span className="rounded bg-[var(--color-slate-custom)]/10 px-2 py-1 text-xs font-medium text-[var(--color-slate-custom)]">New</span>}
                      {product.isBestSeller && <span className="bg-brand/10 text-brand rounded px-2 py-1 text-xs font-medium">Best seller</span>}
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex justify-end gap-3">
                      <Link href={`/admin/products/${product.id}`} className="text-ink hover:text-brand" aria-label={`Edit ${product.name}`}>
                        <Pencil size={17} />
                      </Link>
                      <button onClick={() => handleDelete(product.id, product.name)} disabled={deletingId === product.id} className="text-ink hover:text-brand disabled:opacity-50" aria-label={`Delete ${product.name}`}>
                        {deletingId === product.id ? <Loader2 size={17} className="animate-spin" /> : <Trash2 size={17} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
