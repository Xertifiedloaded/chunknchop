'use client';

import { useMemo, useState, type FormEvent } from 'react';
import useSWR from 'swr';
import {
  ArrowUpRight,
  LoaderCircle,
  PackagePlus,
  Pencil,
  Trash2,
  X,
  Search,
  ImagePlus,
  Package,
  Check,
  ChevronDown,
  Eye,
  EyeOff,
} from 'lucide-react';

import {
  productCategories,
  type CatalogProduct,
  formatPrice,
  koboToNairaInput,
} from '@/lib/catalog';

type ProductDraft = {
  slug: string;
  name: string;
  description: string;
  cut: string;
  price: string;
  unit: string;
  imageUrl: string;
  badge: string;
  category: CatalogProduct['category'];
  published: boolean;
};

type AdminProductResponse = {
  products: CatalogProduct[];
};

const emptyDraft: ProductDraft = {
  slug: '',
  name: '',
  description: '',
  cut: '',
  price: '',
  unit: '',
  imageUrl: '',
  badge: '',
  category: 'Beef',
  published: false,
};

/**
 * Always resolves to `{ products: [...] }`, whether the API returns
 * a bare array or `{ products: [...] }`. Prevents `undefined.length` crashes.
 */
async function fetchProducts(url: string): Promise<AdminProductResponse> {
  const response = await fetch(url, { cache: 'no-store' });

  if (!response.ok) {
    throw new Error('Could not load products.');
  }

  const json = await response.json().catch(() => null);
  const list = Array.isArray(json) ? json : json?.products;

  return { products: Array.isArray(list) ? list : [] };
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function slugifyWhileTyping(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-/, '');
}

const inputClass =
  'w-full rounded-lg border border-[#e8e6e1] bg-[#fcfcfa] px-3.5 py-3 text-sm text-[#24231f] outline-none transition placeholder:text-[#aaa69e] focus:border-[#e86b3e] focus:ring-2 focus:ring-[#e86b3e]/10';

const labelClass = 'flex flex-col gap-2 text-xs font-semibold text-[#332925]';

const buttonClass =
  'inline-flex items-center justify-center gap-2 rounded-lg border border-[#e8e6e1] bg-white px-4 py-2.5 text-xs font-semibold text-[#55514a] transition hover:border-[#e86b3e] hover:text-[#e86b3e] disabled:cursor-not-allowed disabled:opacity-50';

export default function AdminProducts({
  initialProducts = [],
}: {
  initialProducts?: CatalogProduct[];
}) {
  const safeInitial = Array.isArray(initialProducts) ? initialProducts : [];

  const {
    data,
    error: loadError,
    mutate,
    isLoading,
  } = useSWR<AdminProductResponse>('/api/admin/products', fetchProducts, {
    fallbackData: { products: safeInitial },
  });

  const products: CatalogProduct[] = Array.isArray(data?.products) ? data.products : safeInitial;

  const [modalOpen, setModalOpen] = useState(false);
  const [draft, setDraft] = useState<ProductDraft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);

  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [visibilityFilter, setVisibilityFilter] = useState('All');

  const [actionId, setActionId] = useState<string | null>(null);

  const filteredProducts = useMemo(() => {
    const term = search.toLowerCase();

    return products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(term) || product.slug.toLowerCase().includes(term);

      const matchesCategory = categoryFilter === 'All' || product.category === categoryFilter;

      const matchesVisibility =
        visibilityFilter === 'All' ||
        (visibilityFilter === 'Published' ? product.published : !product.published);

      return matchesSearch && matchesCategory && matchesVisibility;
    });
  }, [products, search, categoryFilter, visibilityFilter]);

  const publishedCount = products.filter((p) => p.published).length;
  const draftCount = products.length - publishedCount;

  function openCreateModal() {
    setEditingId(null);
    setDraft(emptyDraft);
    setUploadedImageUrl(null);
    setMessage('');
    setModalOpen(true);
  }

  function editProduct(product: CatalogProduct) {
    setEditingId(product.id);

    setDraft({
      slug: product.slug,
      name: product.name,
      description: product.description,
      cut: product.cut,
      price: koboToNairaInput(product.priceCents),
      unit: product.unit,
      imageUrl: product.imageUrl,
      badge: product.badge ?? '',
      category: product.category,
      published: product.published,
    });

    setUploadedImageUrl(null);
    setMessage('');
    setModalOpen(true);
  }

  function discardStagedImage(url: string | null) {
    if (url) {
      void fetch(`/api/admin/product-images?url=${encodeURIComponent(url)}`, {
        method: 'DELETE',
      });
    }
  }

  function closeModal() {
    if (submitting || uploadingImage) return;

    discardStagedImage(uploadedImageUrl);

    setUploadedImageUrl(null);
    setEditingId(null);
    setDraft(emptyDraft);
    setMessage('');
    setModalOpen(false);
  }

  async function uploadImage(file: File | undefined) {
    if (!file) return;

    setUploadingImage(true);
    setMessage('');

    try {
      const formData = new FormData();
      formData.set('file', file);

      const response = await fetch('/api/admin/product-images', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.error || 'Unable to upload this image.');
      }

      discardStagedImage(uploadedImageUrl);

      setUploadedImageUrl(result.url);

      setDraft((current) => ({
        ...current,
        imageUrl: result.url,
      }));

      setMessage('Image uploaded successfully. Save to keep it.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to upload this image.');
    } finally {
      setUploadingImage(false);
    }
  }

  async function saveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (uploadingImage) {
      setMessage('Wait for the image upload to finish.');
      return;
    }

    setSubmitting(true);
    setMessage('');

    const priceKobo = Math.round(Number(draft.price) * 100);

    if (!Number.isSafeInteger(priceKobo) || priceKobo < 1) {
      setMessage('Enter a valid price in naira greater than zero.');
      setSubmitting(false);
      return;
    }

    const payload = {
      slug: slugify(draft.slug),
      name: draft.name.trim(),
      description: draft.description.trim(),
      cut: draft.cut.trim(),
      priceCents: priceKobo,
      unit: draft.unit.trim(),
      imageUrl: draft.imageUrl.trim(),
      badge: draft.badge.trim() || null,
      category: draft.category,
      published: draft.published,
    };

    try {
      const response = await fetch(
        editingId ? `/api/admin/products/${editingId}` : '/api/admin/products',
        {
          method: editingId ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        const fieldErrors = result?.details?.fieldErrors as Record<string, string[]> | undefined;

        const firstField = fieldErrors && Object.entries(fieldErrors)[0];

        const detail = firstField
          ? `${firstField[0]}: ${firstField[1][0]}`
          : result?.details?.formErrors?.[0];

        throw new Error(
          detail
            ? `${result?.error || 'Unable to save'} (${detail})`
            : result?.error || 'Unable to save this product.',
        );
      }

      await mutate();

      setUploadedImageUrl(null);
      setEditingId(null);
      setDraft(emptyDraft);
      setModalOpen(false);

      setMessage(editingId ? 'Product updated successfully.' : 'Product created successfully.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to save this product.');
    } finally {
      setSubmitting(false);
    }
  }

  async function togglePublished(product: CatalogProduct) {
    setActionId(product.id);
    setMessage('');

    try {
      const response = await fetch(`/api/admin/products/${product.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: !product.published }),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.error || 'Unable to update product visibility.');
      }

      await mutate();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to update product.');
    } finally {
      setActionId(null);
    }
  }

  async function deleteProduct(product: CatalogProduct) {
    if (!window.confirm(`Delete ${product.name}? This cannot be undone.`)) {
      return;
    }

    setActionId(product.id);
    setMessage('');

    try {
      const response = await fetch(`/api/admin/products/${product.id}`, {
        method: 'DELETE',
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.error || 'Unable to delete this product.');
      }

      await mutate();

      if (editingId === product.id) {
        closeModal();
      }

      setMessage('Product deleted successfully.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to delete this product.');
    } finally {
      setActionId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#88847d]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#e86b3e]" />
            Inventory management
          </div>

          <h2 className="font-heading text-2xl font-semibold tracking-tight text-[#24231f]">
            Products
          </h2>

          <p className="mt-1 text-sm text-[#88847d]">
            Manage your product catalogue and inventory listings.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#e86b3e] px-5 text-xs font-bold tracking-wide text-white transition hover:bg-[#a9442c]"
        >
          <PackagePlus size={17} />
          ADD NEW PRODUCT
          <ArrowUpRight size={16} />
        </button>
      </div>

      {/* Feedback */}
      {message && !modalOpen && (
        <div
          role="status"
          className="flex items-center justify-between rounded-lg border border-[#e6e4de] bg-white px-4 py-3 text-sm text-[#55514a]"
        >
          {message}
          <button onClick={() => setMessage('')} aria-label="Dismiss message">
            <X size={15} />
          </button>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-[#e8e6e1] bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#88847d]">Total products</span>
            <Package size={19} className="text-[#e86b3e]" />
          </div>

          <p className="mt-3 text-3xl font-semibold text-[#24231f]">{products.length}</p>

          <p className="mt-1 text-[11px] text-[#99958d]">Products in catalogue</p>
        </div>

        <div className="rounded-xl border border-[#e8e6e1] bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#88847d]">Published</span>
            <Eye size={19} className="text-emerald-600" />
          </div>

          <p className="mt-3 text-3xl font-semibold text-[#24231f]">{publishedCount}</p>

          <p className="mt-1 text-[11px] text-[#99958d]">Visible in your shop</p>
        </div>

        <div className="rounded-xl border border-[#e8e6e1] bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#88847d]">Draft products</span>
            <EyeOff size={19} className="text-amber-600" />
          </div>

          <p className="mt-3 text-3xl font-semibold text-[#24231f]">{draftCount}</p>

          <p className="mt-1 text-[11px] text-[#99958d]">Not visible in your shop</p>
        </div>
      </div>

      {/* Products table */}
      <section className="overflow-hidden rounded-xl border border-[#e8e6e1] bg-white">
        <div className="flex flex-col gap-4 border-b border-[#e8e6e1] p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="font-heading text-lg font-semibold text-[#24231f]">All products</h3>
            <p className="mt-1 text-xs text-[#88847d]">
              Showing {filteredProducts.length} of {products.length} products
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#99958d]"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products..."
                className="h-10 w-full rounded-lg border border-[#e8e6e1] bg-[#fcfcfa] pl-9 pr-3 text-xs outline-none focus:border-[#e86b3e] sm:w-52"
              />
            </div>

            <div className="relative">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="h-10 w-full appearance-none rounded-lg border border-[#e8e6e1] bg-[#fcfcfa] px-3 pr-9 text-xs outline-none focus:border-[#e86b3e] sm:w-36"
              >
                <option value="All">All categories</option>
                {productCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#88847d]"
              />
            </div>

            <div className="relative">
              <select
                value={visibilityFilter}
                onChange={(e) => setVisibilityFilter(e.target.value)}
                className="h-10 w-full appearance-none rounded-lg border border-[#e8e6e1] bg-[#fcfcfa] px-3 pr-9 text-xs outline-none focus:border-[#e86b3e] sm:w-36"
              >
                <option value="All">All status</option>
                <option value="Published">Published</option>
                <option value="Draft">Draft</option>
              </select>
              <ChevronDown
                size={14}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#88847d]"
              />
            </div>
          </div>
        </div>

        {loadError ? (
          <div className="p-8 text-center text-sm text-red-600">
            Could not load products. Refresh the page to try again.
          </div>
        ) : isLoading && !data ? (
          <div className="flex items-center justify-center gap-2 p-12 text-sm text-[#88847d]">
            <LoaderCircle size={18} className="animate-spin" />
            Loading products...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#f5f3ee]">
              <PackagePlus size={25} className="text-[#aaa69e]" />
            </div>

            <h3 className="text-sm font-semibold text-[#332925]">
              {products.length === 0 ? 'No products yet' : 'No matching products'}
            </h3>

            <p className="mt-2 max-w-xs text-xs leading-5 text-[#88847d]">
              {products.length === 0
                ? 'Start building your catalogue by adding your first product.'
                : 'Try changing your search or filter.'}
            </p>

            {products.length === 0 && (
              <button
                onClick={openCreateModal}
                className="mt-5 rounded-lg bg-[#e86b3e] px-5 py-3 text-xs font-bold text-white hover:bg-[#a9442c]"
              >
                ADD FIRST PRODUCT
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left">
                <thead className="bg-[#faf9f6]">
                  <tr className="text-[10px] font-bold uppercase tracking-wider text-[#88847d]">
                    <th className="px-6 py-4">Product</th>
                    <th className="px-4 py-4">Category</th>
                    <th className="px-4 py-4">Price</th>
                    <th className="px-4 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#efede8]">
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="transition hover:bg-[#fcfbf9]">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="h-12 w-12 rounded-lg border border-[#e8e6e1] bg-[#faf9f6] object-cover"
                          />

                          <div className="min-w-0">
                            <p className="max-w-[220px] truncate text-sm font-semibold text-[#24231f]">
                              {product.name}
                            </p>
                            <p className="mt-1 max-w-[220px] truncate text-[11px] text-[#99958d]">
                              {product.slug}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <span className="rounded-md bg-[#f5f3ee] px-2.5 py-1.5 text-[11px] font-medium text-[#55514a]">
                          {product.category}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <p className="text-sm font-semibold text-[#24231f]">
                          {formatPrice(product.priceCents)}
                        </p>
                        <p className="mt-1 text-[10px] text-[#99958d]">/ {product.unit}</p>
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[10px] font-semibold ${
                            product.published
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              product.published ? 'bg-emerald-500' : 'bg-amber-500'
                            }`}
                          />
                          {product.published ? 'Published' : 'Draft'}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            title={product.published ? 'Unpublish' : 'Publish'}
                            disabled={actionId === product.id}
                            onClick={() => void togglePublished(product)}
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#e8e6e1] text-[#77736d] transition hover:border-[#e86b3e] hover:text-[#e86b3e] disabled:opacity-50"
                          >
                            {actionId === product.id ? (
                              <LoaderCircle size={15} className="animate-spin" />
                            ) : product.published ? (
                              <EyeOff size={15} />
                            ) : (
                              <Eye size={15} />
                            )}
                          </button>

                          <button
                            type="button"
                            title="Edit product"
                            onClick={() => editProduct(product)}
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#e8e6e1] text-[#77736d] transition hover:border-[#e86b3e] hover:text-[#e86b3e]"
                          >
                            <Pencil size={15} />
                          </button>

                          <button
                            type="button"
                            title="Delete product"
                            disabled={actionId === product.id}
                            onClick={() => void deleteProduct(product)}
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#e8e6e1] text-[#a9442c] transition hover:border-red-300 hover:bg-red-50 disabled:opacity-50"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile product list */}
            <div className="divide-y divide-[#efede8] md:hidden">
              {filteredProducts.map((product) => (
                <article key={product.id} className="p-4">
                  <div className="flex gap-3">
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="h-16 w-16 shrink-0 rounded-lg border border-[#e8e6e1] object-cover"
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] text-[#88847d]">{product.category}</span>
                        <span
                          className={`rounded-full px-2 py-1 text-[9px] font-semibold ${
                            product.published
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {product.published ? 'Published' : 'Draft'}
                        </span>
                      </div>

                      <h3 className="mt-1 truncate text-sm font-semibold text-[#24231f]">
                        {product.name}
                      </h3>

                      <p className="mt-1 text-xs font-medium text-[#55514a]">
                        {formatPrice(product.priceCents)} / {product.unit}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => editProduct(product)}
                      className={`${buttonClass} flex-1`}
                    >
                      <Pencil size={14} /> Edit
                    </button>

                    <button
                      onClick={() => void togglePublished(product)}
                      disabled={actionId === product.id}
                      className={`${buttonClass} flex-1`}
                    >
                      {product.published ? 'Unpublish' : 'Publish'}
                    </button>

                    <button
                      onClick={() => void deleteProduct(product)}
                      disabled={actionId === product.id}
                      className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#e8e6e1] text-red-600 hover:bg-red-50"
                      aria-label={`Delete ${product.name}`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>

      {/* Add/Edit product modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#171613]/60 p-3 backdrop-blur-[3px] sm:p-6"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-modal-title"
            className="flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
          >
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-[#e8e6e1] px-5 py-5 sm:px-7">
              <div>
                <div className="mb-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#88847d]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#e86b3e]" />
                  Product catalogue
                </div>

                <h2
                  id="product-modal-title"
                  className="font-heading text-xl font-semibold text-[#24231f]"
                >
                  {editingId ? 'Edit product' : 'Add new product'}
                </h2>

                <p className="mt-1 text-xs text-[#88847d]">
                  {editingId
                    ? 'Update your product information.'
                    : 'Enter the details for your new product.'}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={submitting || uploadingImage}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#e8e6e1] text-[#77736d] transition hover:bg-[#f5f3ee]"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal form */}
            <form onSubmit={saveProduct} className="overflow-y-auto">
              <div className="grid grid-cols-1 gap-x-5 gap-y-5 p-5 sm:grid-cols-2 sm:p-7">
                <label className={labelClass}>
                  Product name *
                  <input
                    className={inputClass}
                    value={draft.name}
                    onChange={(e) =>
                      setDraft((current) => ({
                        ...current,
                        name: e.target.value,
                        slug: current.slug || slugify(e.target.value),
                      }))
                    }
                    required
                    maxLength={100}
                    placeholder="e.g. Premium Beef"
                  />
                </label>

                <label className={labelClass}>
                  URL slug *
                  <input
                    className={inputClass}
                    value={draft.slug}
                    onChange={(e) =>
                      setDraft((current) => ({
                        ...current,
                        slug: slugifyWhileTyping(e.target.value),
                      }))
                    }
                    onBlur={() =>
                      setDraft((current) => ({
                        ...current,
                        slug: slugify(current.slug),
                      }))
                    }
                    required
                    minLength={2}
                    maxLength={80}
                    pattern="[a-z0-9]+(-[a-z0-9]+)*"
                    placeholder="premium-beef"
                  />
                </label>

                <label className={labelClass}>
                  Category *
                  <select
                    className={inputClass}
                    value={draft.category}
                    onChange={(e) =>
                      setDraft((current) => ({
                        ...current,
                        category: e.target.value as ProductDraft['category'],
                      }))
                    }
                  >
                    {productCategories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </label>

                <label className={labelClass}>
                  Cut details *
                  <input
                    className={inputClass}
                    value={draft.cut}
                    onChange={(e) =>
                      setDraft((current) => ({
                        ...current,
                        cut: e.target.value,
                      }))
                    }
                    required
                    maxLength={120}
                    placeholder="e.g. Boneless, diced"
                  />
                </label>

                <label className={labelClass}>
                  Price (₦ NGN) *
                  <input
                    className={inputClass}
                    type="number"
                    inputMode="decimal"
                    min="0.01"
                    step="0.01"
                    value={draft.price}
                    onChange={(e) =>
                      setDraft((current) => ({
                        ...current,
                        price: e.target.value,
                      }))
                    }
                    required
                    placeholder="20000"
                  />
                </label>

                <label className={labelClass}>
                  Unit *
                  <input
                    className={inputClass}
                    value={draft.unit}
                    onChange={(e) =>
                      setDraft((current) => ({
                        ...current,
                        unit: e.target.value,
                      }))
                    }
                    required
                    maxLength={40}
                    placeholder="Per kg, per pack, 500g"
                  />
                </label>

                {/* Image upload */}
                <div className="flex flex-col gap-3 sm:col-span-2">
                  <label className={labelClass}>
                    Product image
                    <div className="relative flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-[#dcd8cf] bg-[#fcfcfa] px-5 py-7 text-center transition hover:border-[#e86b3e] hover:bg-[#fffaf7]">
                      <ImagePlus size={25} className="mb-3 text-[#e86b3e]" />

                      <span className="text-xs font-semibold text-[#332925]">
                        {uploadingImage ? 'Uploading image...' : 'Click to upload an image'}
                      </span>

                      <span className="mt-1 text-[10px] text-[#99958d]">
                        JPEG, PNG or WebP · 2 MB maximum
                      </span>

                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        disabled={uploadingImage || submitting}
                        onChange={(e) => void uploadImage(e.currentTarget.files?.[0])}
                        className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-not-allowed"
                      />
                    </div>
                  </label>

                  <label className={labelClass}>
                    Or use an HTTPS image URL
                    <input
                      className={inputClass}
                      type="url"
                      value={
                        draft.imageUrl.startsWith('/api/product-images/') ? '' : draft.imageUrl
                      }
                      onChange={(e) => {
                        if (uploadedImageUrl) {
                          discardStagedImage(uploadedImageUrl);
                          setUploadedImageUrl(null);
                        }

                        setDraft((current) => ({
                          ...current,
                          imageUrl: e.target.value,
                        }));
                      }}
                      placeholder="https://example.com/image.jpg"
                    />
                  </label>

                  {draft.imageUrl && (
                    <div className="flex items-center gap-4 rounded-lg border border-[#e8e6e1] bg-[#fcfcfa] p-3">
                      <img
                        src={draft.imageUrl}
                        alt="Product preview"
                        className="h-20 w-20 rounded-lg border border-[#e8e6e1] object-cover"
                      />

                      <div>
                        <p className="text-xs font-semibold text-[#332925]">Image preview</p>
                        <p className="mt-1 text-[10px] text-[#88847d]">
                          {draft.imageUrl.includes('res.cloudinary.com')
                            ? 'Cloudinary image'
                            : 'Product image URL'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <label className={labelClass}>
                  Badge
                  <input
                    className={inputClass}
                    value={draft.badge}
                    onChange={(e) =>
                      setDraft((current) => ({
                        ...current,
                        badge: e.target.value,
                      }))
                    }
                    maxLength={40}
                    placeholder="e.g. Best Seller"
                  />
                </label>

                <div className="flex items-center gap-3 self-end rounded-lg border border-[#e8e6e1] bg-[#fcfcfa] px-4 py-3">
                  <input
                    id="publish-product"
                    type="checkbox"
                    className="h-4 w-4 accent-[#e86b3e]"
                    checked={draft.published}
                    onChange={(e) =>
                      setDraft((current) => ({
                        ...current,
                        published: e.target.checked,
                      }))
                    }
                  />

                  <label
                    htmlFor="publish-product"
                    className="cursor-pointer text-xs font-semibold text-[#332925]"
                  >
                    Publish this product
                  </label>
                </div>

                <label className={`${labelClass} sm:col-span-2`}>
                  Description *
                  <textarea
                    className={`${inputClass} min-h-[120px] resize-y leading-6`}
                    value={draft.description}
                    onChange={(e) =>
                      setDraft((current) => ({
                        ...current,
                        description: e.target.value,
                      }))
                    }
                    rows={4}
                    required
                    maxLength={2000}
                    placeholder="Describe this product..."
                  />
                </label>
              </div>

              {/* API feedback */}
              {message && (
                <div
                  role="status"
                  className="mx-5 mb-4 rounded-lg border border-[#e8e6e1] bg-[#fcfcfa] px-4 py-3 text-xs leading-5 text-[#55514a] sm:mx-7"
                >
                  {message}
                </div>
              )}

              {/* Footer */}
              <div className="sticky bottom-0 flex flex-col-reverse gap-3 border-t border-[#e8e6e1] bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={submitting || uploadingImage}
                  className={buttonClass}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting || uploadingImage}
                  className="inline-flex h-11 items-center justify-center gap-3 rounded-lg bg-[#e86b3e] px-6 text-xs font-bold tracking-wide text-white transition hover:bg-[#a9442c] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting || uploadingImage ? (
                    <LoaderCircle size={16} className="animate-spin" />
                  ) : (
                    <Check size={16} />
                  )}

                  {uploadingImage
                    ? 'UPLOADING IMAGE...'
                    : submitting
                      ? 'SAVING...'
                      : editingId
                        ? 'SAVE CHANGES'
                        : 'CREATE PRODUCT'}

                  {!submitting && !uploadingImage && <ArrowUpRight size={16} />}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
