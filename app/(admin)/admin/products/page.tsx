"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Inter } from "next/font/google";
import { ArrowDownToLine, ArrowUpFromLine, Copy, Ellipsis, Filter, Grid2X2, List, Loader2, PackageX, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { fetchWithAuth } from "@/lib/http/fetchClient";
import ProductModal from "@/features/catalog/components/ProductModal";

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

type AvailabilityType = "success" | "warning" | "danger";
type ViewMode = "list" | "grid";
type ModalState = { mode: "create" | "edit"; productId?: string } | null;

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

const LOW_STOCK_THRESHOLD = 20;

const MEAT_EMOJI: Record<string, string> = {
  BEEF: "🥩",
  CHICKEN: "🍗",
  GOAT: "🥩",
  TURKEY: "🍗",
  PORK: "🥩",
  SEAFOOD: "🦐",
  SAUSAGE: "🌭",
  BBQ: "🥩",
};

const BADGE_STYLES: Record<AvailabilityType, { pill: string; dot: string }> = {
  success: { pill: "bg-[#e9faf2] text-[#09965c]", dot: "bg-[#12b76a]" },
  warning: { pill: "bg-[#fff7df] text-[#d98400]", dot: "bg-[#f59e0b]" },
  danger: { pill: "bg-[#ffeded] text-[#ed3b3b]", dot: "bg-[#ef4444]" },
};

const TABLE_HEADERS = ["Product", "SKU", "Category", "Price", "Stock", "Availability", "Rating", ""];

const OUTLINE_BUTTON =
  "flex h-9 items-center justify-center gap-1.5 rounded-lg border border-[#dedbd7] bg-white px-3 text-xs font-medium whitespace-nowrap text-[#343434] transition hover:bg-[#fafafa]";

const FIELD = "h-9 rounded-lg border border-[#dedbd7] bg-white text-xs text-[#333] outline-none focus:border-[#c8c5c1]";

const emojiFor = (meatType: string) => MEAT_EMOJI[meatType?.toUpperCase()] ?? "🍖";

const formatNaira = (amount: number) => `₦${amount.toLocaleString("en-NG")}`;

const skuFor = (product: Product) => `CNC-${product.meatType?.slice(0, 3).toUpperCase() ?? "GEN"}-${product.id.replace(/-/g, "").slice(-4).toUpperCase()}`;

function availabilityFor(product: Product): {
  label: string;
  type: AvailabilityType;
} {
  if (!product.inStock || product.stock <= 0) return { label: "Out of stock", type: "danger" };
  if (product.stock <= LOW_STOCK_THRESHOLD) return { label: "Low stock", type: "warning" };
  return { label: "In stock", type: "success" };
}

function ProductImage({ emoji, index }: { emoji: string; index: number }) {
  return <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f0f0ee] text-lg ${index % 2 === 0 ? "-rotate-2" : "rotate-2"}`}>{emoji}</div>;
}

function AvailabilityBadge({ type, children }: { type: AvailabilityType; children: ReactNode }) {
  const { pill, dot } = BADGE_STYLES[type];

  return (
    <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-1 text-[11px] leading-none font-medium whitespace-nowrap ${pill}`}>
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} />
      {children}
    </span>
  );
}

function RatingBadge({ rating, reviewCount }: { rating: number; reviewCount: number }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 text-xs leading-none whitespace-nowrap text-[#46433f]">
      <span className="text-sm leading-none text-[#f59e0b]">★</span>
      {rating.toFixed(1)}
      <span className="text-[#b7b3ae]">({reviewCount})</span>
    </span>
  );
}

function ActionButton({ children, onClick, disabled, label }: { children: ReactNode; onClick?: () => void; disabled?: boolean; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[#8c8984] transition hover:bg-[#f4f3f1] hover:text-[#333] disabled:cursor-not-allowed disabled:opacity-50"
    >
      {children}
    </button>
  );
}

function ProductName({ product }: { product: Product }) {
  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <span className="truncate text-sm font-semibold text-[#292929]">{product.name}</span>
      {product.isBestSeller && <span className="shrink-0 text-xs leading-none text-[#f59e0b]">★</span>}
      {product.isNewArrival && <span className="shrink-0 rounded-full bg-[#e9faf2] px-1.5 py-0.5 text-[11px] leading-none font-medium text-[#09965c]">New</span>}
    </div>
  );
}

function RowActions({ product, deleting, onEdit, onDelete }: { product: Product; deleting: boolean; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex items-center justify-end gap-0.5">
      <ActionButton label={`Edit ${product.name}`} onClick={onEdit}>
        <Pencil size={14} strokeWidth={1.7} />
      </ActionButton>
      <ActionButton label={`Duplicate ${product.name}`}>
        <Copy size={14} strokeWidth={1.7} />
      </ActionButton>
      <ActionButton label="More options">
        <Ellipsis size={15} strokeWidth={1.7} />
      </ActionButton>
      <ActionButton label={`Delete ${product.name}`} disabled={deleting} onClick={onDelete}>
        {deleting ? <Loader2 size={14} strokeWidth={1.7} className="animate-spin" /> : <Trash2 size={14} strokeWidth={1.7} />}
      </ActionButton>
    </div>
  );
}

function EmptyState({ hasProducts, onCreate }: { hasProducts: boolean; onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
      <PackageX size={28} strokeWidth={1.5} className="text-[#c8c5c1]" />
      <p className="text-sm font-medium text-[#46433f]">{hasProducts ? "No products match your filters" : "No products yet"}</p>
      <p className="text-xs text-[#99958f]">{hasProducts ? "Try a different search term or category filter." : "Add your first product to get the catalogue started."}</p>
      {!hasProducts && (
        <button type="button" onClick={onCreate} className="mt-1 flex h-9 items-center gap-1.5 rounded-lg bg-brand px-3 text-xs font-medium text-white transition hover:opacity-90">
          <Plus size={14} strokeWidth={2.5} />
          Add product
        </button>
      )}
    </div>
  );
}

function SkeletonRows() {
  return (
    <div className="divide-y divide-[#efeeec]">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3">
          <div className="h-9 w-9 animate-pulse rounded-xl bg-[#f0f0ee]" />
          <div className="h-3 w-40 animate-pulse rounded bg-[#f0f0ee]" />
        </div>
      ))}
    </div>
  );
}

function ProductCard({ product, index, deleting, onEdit, onDelete }: { product: Product; index: number; deleting: boolean; onEdit: () => void; onDelete: () => void }) {
  const availability = availabilityFor(product);

  return (
    <article className="flex flex-col gap-3 rounded-xl border border-[#e7e5e2] bg-white p-3.5">
      <div className="flex items-center gap-3">
        <ProductImage emoji={emojiFor(product.meatType)} index={index} />
        <div className="min-w-0 flex-1">
          <ProductName product={product} />
          <p className="mt-1 truncate font-mono text-[11px] text-[#696661]">{skuFor(product)}</p>
        </div>
      </div>

      <dl className="grid grid-cols-3 gap-2 text-xs">
        <div>
          <dt className="text-[11px] text-[#99958f]">Category</dt>
          <dd className="mt-0.5 text-[#46433f]">{product.meatType}</dd>
        </div>
        <div>
          <dt className="text-[11px] text-[#99958f]">Price</dt>
          <dd className="mt-0.5 font-semibold text-[#343230]">{formatNaira(product.basePrice)}</dd>
        </div>
        <div>
          <dt className="text-[11px] text-[#99958f]">Stock</dt>
          <dd className="mt-0.5 text-[#46433f]">{product.stock}</dd>
        </div>
      </dl>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <AvailabilityBadge type={availability.type}>{availability.label}</AvailabilityBadge>
        <RatingBadge rating={product.rating} reviewCount={product.reviewCount} />
      </div>

      <div className="border-t border-[#efeeec] pt-2">
        <RowActions product={product} deleting={deleting} onEdit={onEdit} onDelete={onDelete} />
      </div>
    </article>
  );
}

export default function AdminProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [modal, setModal] = useState<ModalState>(null);

  const fetchProducts = useCallback(async () => {
    setError(null);

    try {
      const response = await fetchWithAuth("/api/admin/products");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load products.");
      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load products.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    const editId = new URLSearchParams(window.location.search).get("edit");
    if (!editId) return;
    setModal({ mode: "edit", productId: editId });
    router.replace("/admin/products", { scroll: false });
  }, [router]);

  const meatTypes = useMemo(() => Array.from(new Set(products.map((p) => p.meatType))).sort(), [products]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(query) || skuFor(product).toLowerCase().includes(query);
      const matchesType = typeFilter === "ALL" || product.meatType === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [products, search, typeFilter]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This can't be undone.`)) return;

    setDeletingId(id);
    setError(null);

    try {
      const response = await fetchWithAuth(`/api/admin/products/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || "Could not delete this product.");
      }

      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete this product.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleSaved = () => {
    setModal(null);
    fetchProducts();
  };

  const openCreate = () => setModal({ mode: "create" });
  const openEdit = (productId: string) => setModal({ mode: "edit", productId });

  const showCards = (
    <div className={`grid grid-cols-1 gap-3 p-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 ${viewMode === "list" ? "md:hidden" : ""}`}>
      {filtered.map((product, index) => (
        <ProductCard
          key={product.id}
          product={product}
          index={index}
          deleting={deletingId === product.id}
          onEdit={() => openEdit(product.id)}
          onDelete={() => handleDelete(product.id, product.name)}
        />
      ))}
    </div>
  );

  return (
    <main className={`${inter.className} min-h-screen w-full overflow-x-hidden bg-[#f7f8fa] px-3 py-4 text-[#292929] sm:px-5 lg:px-6`}>
      <div className="mx-auto w-full max-w-[1600px]">
        <header className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <h1 className="text-lg font-semibold tracking-tight sm:text-xl">Products</h1>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-[#8d8984]">Manage the ChunkNChop catalogue — cuts, weights, preparation options and storefront visibility.</p>
          </div>

          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:items-center">
            <button type="button" className={OUTLINE_BUTTON}>
              <ArrowUpFromLine size={14} strokeWidth={1.8} />
              Import
            </button>
            <button type="button" className={OUTLINE_BUTTON}>
              <ArrowDownToLine size={14} strokeWidth={1.8} />
              Export
            </button>
            <button
              type="button"
              onClick={openCreate}
              className="col-span-2 flex h-9 items-center justify-center gap-1.5 rounded-lg bg-brand px-3 text-xs font-medium whitespace-nowrap text-white shadow-sm transition hover:opacity-90 sm:col-span-1"
            >
              <Plus size={14} strokeWidth={2.5} />
              Create Product
            </button>
          </div>
        </header>

        {error && (
          <div role="alert" className="mb-3 rounded-lg border border-brand/30 bg-[#fff4ee] px-3 py-2.5 text-xs text-[#c4491d]">
            {error}
          </div>
        )}

        <section className="w-full overflow-hidden rounded-xl border border-[#e7e5e2] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="border-b border-[#eceae7] p-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative min-w-0 flex-1">
                <Search size={14} strokeWidth={1.8} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[#aaa]" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search products or SKU..."
                  className={`${FIELD} w-full pr-3 pl-9 placeholder:text-[#a7a7b0]`}
                />
              </div>

              <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-2 sm:flex sm:shrink-0 sm:items-center">
                <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className={`${FIELD} min-w-0 px-2.5 sm:w-40`}>
                  <option value="ALL">All categories</option>
                  {meatTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>

                <button type="button" className={OUTLINE_BUTTON}>
                  <Filter size={13} strokeWidth={1.8} />
                  <span className="hidden sm:inline">Filters</span>
                </button>

                <div className="flex h-9 shrink-0 items-center rounded-lg border border-[#dedbd7] bg-white p-0.5">
                  {(
                    [
                      { mode: "list", label: "List view", icon: List },
                      { mode: "grid", label: "Grid view", icon: Grid2X2 },
                    ] as const
                  ).map(({ mode, label, icon: Icon }) => (
                    <button
                      key={mode}
                      type="button"
                      aria-label={label}
                      aria-pressed={viewMode === mode}
                      onClick={() => setViewMode(mode)}
                      className={`flex h-7 w-7 items-center justify-center rounded-md transition ${viewMode === mode ? "bg-[#292824] text-white" : "text-[#888] hover:bg-[#f4f3f1]"}`}
                    >
                      <Icon size={14} strokeWidth={1.9} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <SkeletonRows />
          ) : filtered.length === 0 ? (
            <EmptyState hasProducts={products.length > 0} onCreate={openCreate} />
          ) : (
            <>
              {showCards}

              {viewMode === "list" && (
                <div className="hidden w-full overflow-x-auto overscroll-x-contain md:block">
                  <table className="w-full min-w-[820px] border-collapse">
                    <thead>
                      <tr className="h-10 border-b border-[#eceae7] bg-[#fcfcfb] text-left">
                        {TABLE_HEADERS.map((header, i) => (
                          <th key={i} className={`px-3 text-[11px] font-medium tracking-wide whitespace-nowrap text-[#77736f] uppercase ${i === 0 ? "pl-4" : ""}`}>
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>

                    <tbody>
                      {filtered.map((product, index) => {
                        const availability = availabilityFor(product);

                        return (
                          <tr key={product.id} className="h-16 border-b border-[#efeeec] last:border-b-0 hover:bg-[#fdfdfc]">
                            <td className="max-w-[260px] pr-3 pl-4">
                              <div className="flex min-w-0 items-center gap-3">
                                <ProductImage emoji={emojiFor(product.meatType)} index={index} />
                                <ProductName product={product} />
                              </div>
                            </td>

                            <td className="px-3">
                              <span className="font-mono text-[11px] whitespace-nowrap text-[#696661]">{skuFor(product)}</span>
                            </td>

                            <td className="px-3 text-xs whitespace-nowrap text-[#46433f]">{product.meatType}</td>

                            <td className="px-3 text-xs font-semibold whitespace-nowrap text-[#343230]">{formatNaira(product.basePrice)}</td>

                            <td className="px-3 text-xs text-[#55514c]">{product.stock}</td>

                            <td className="px-3">
                              <AvailabilityBadge type={availability.type}>{availability.label}</AvailabilityBadge>
                            </td>

                            <td className="px-3">
                              <RatingBadge rating={product.rating} reviewCount={product.reviewCount} />
                            </td>

                            <td className="px-3">
                              <RowActions product={product} deleting={deletingId === product.id} onEdit={() => openEdit(product.id)} onDelete={() => handleDelete(product.id, product.name)} />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </section>
      </div>

      {modal && <ProductModal mode={modal.mode} productId={modal.productId} onClose={() => setModal(null)} onSaved={handleSaved} />}
    </main>
  );
}
