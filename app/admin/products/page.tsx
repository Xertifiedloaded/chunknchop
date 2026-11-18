'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
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
  Plus,
} from 'lucide-react';

import { type CatalogProduct, formatPrice, koboToNairaInput } from '@/lib/catalog';

type ProductDraft = {
  slug: string;
  name: string;
  description: string;
  cut: string;
  price: string;
  unit: string;
  imageUrl: string;
  badge: string;
  category: string;
  productType: 'standard' | 'meatbox';
  bundleItemsText: string;
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
  productType: 'standard',
  bundleItemsText: '',
  published: false,
};

async function fetchProducts(url: string): Promise<AdminProductResponse> {
  const response = await fetch(url, { cache: 'no-store' });

  if (!response.ok) {
    throw new Error('Could not load products.');
  }

  const json = await response.json().catch(() => null);
  const list = Array.isArray(json) ? json : json?.products;

  return { products: Array.isArray(list) ? list : [] };
}

function readBundleRows(value: string) {
  const rows = value
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const match = line.trim().match(/^(.*?)\s*\((\d+)\)$/);
      return { name: match?.[1]?.trim() ?? line.trim(), quantity: Number(match?.[2] ?? 1) };
    });
  return rows.length ? rows : [{ name: '', quantity: 1 }];
}

function writeBundleRows(rows: Array<{ name: string; quantity: number }>) {
  return rows
    .map((row) => `${row.name.trim()} (${Math.max(1, Number(row.quantity) || 1)})`)
    .join('\n');
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
  'w-full rounded-lg border border-[#e8e6e1] bg-[#fcfcfa] px-3 py-2.5 text-xs text-[#24231f] outline-none transition placeholder:text-[#aaa69e] focus:border-brand focus:ring-2 focus:ring-brand/10';

const labelClass = 'flex flex-col gap-1.5 text-[11px] font-semibold text-[#332925]';

const buttonClass =
  'inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-[#e8e6e1] bg-white px-3.5 text-[11px] font-semibold text-[#55514a] transition hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-50';

const iconButtonClass =
  'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#e8e6e1] bg-white text-[#77736d] transition hover:border-brand hover:text-brand disabled:opacity-50';

const selectClass =
  'h-9 w-full appearance-none rounded-lg border border-[#e8e6e1] bg-[#fcfcfa] pl-3 pr-8 text-[11px] text-[#24231f] outline-none focus:border-brand';

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
  const [categories, setCategories] = useState<string[]>(['Beef', 'Poultry', 'Pork', 'Lamb']);

  useEffect(() => {
    fetch('/api/admin/categories', { cache: 'no-store' })
      .then((r) => r.json())
      .then((j) => {
        if (Array.isArray(j.categories) && j.categories.length) setCategories(j.categories);
      })
      .catch(() => undefined);
  }, []);

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
      productType: product.productType ?? 'standard',
      bundleItemsText: Array.isArray(product.bundleItems)
        ? product.bundleItems
            .map((x: { name: string; quantity: number }) => `${x.name} (${x.quantity})`)
            .join('\n')
        : '',
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

    const bundleRows = draft.productType === 'meatbox' ? readBundleRows(draft.bundleItemsText) : [];
    if (
      draft.productType === 'meatbox' &&
      (!bundleRows.length || bundleRows.some((row) => !row.name.trim()))
    ) {
      setMessage('Enter a meat type and quantity for every meatbox row.');
      setSubmitting(false);
      return;
    }

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
      productType: draft.productType,
      bundleItems:
        draft.productType === 'meatbox'
          ? bundleRows.map((row) => ({ name: row.name.trim(), quantity: row.quantity }))
          : [],
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

  const bundleRows = readBundleRows(draft.bundleItemsText);

  return (
    <div className="space-y-4 sm:space-y-5">
      {}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-1.5 flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.18em] text-[#88847d]">
            <span className="h-1.5 w-1.5 rounded-full bg-brand" />
            Inventory management
          </div>

          <h2 className="font-heading text-xl font-semibold tracking-tight text-[#24231f] sm:text-2xl">
            Products
          </h2>

          <p className="mt-0.5 text-xs text-[#88847d]">
            Manage your product catalogue and inventory listings.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-brand px-4 text-[11px] font-bold tracking-wide text-white transition hover:bg-[#a9442c] sm:w-auto"
        >
          <PackagePlus size={15} />
          ADD NEW PRODUCT
          <ArrowUpRight size={14} />
        </button>
      </div>

      {}
      {message && !modalOpen && (
        <div
          role="status"
          className="flex items-center justify-between gap-3 rounded-lg border border-[#e6e4de] bg-white px-3.5 py-2.5 text-xs text-[#55514a]"
        >
          <span>{message}</span>
          <button
            type="button"
            onClick={() => setMessage('')}
            aria-label="Dismiss message"
            className="shrink-0 text-[#99958d] hover:text-[#24231f]"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <div className="rounded-xl border border-[#e8e6e1] bg-white p-3 sm:p-4">
          <div className="flex items-center justify-between gap-1">
            <span className="truncate text-[10px] font-medium text-[#88847d] sm:text-[11px]">
              Total
            </span>
            <Package size={15} className="shrink-0 text-brand" />
          </div>
          <p className="mt-2 text-xl font-semibold leading-none text-[#24231f] sm:text-2xl">
            {products.length}
          </p>
          <p className="mt-1.5 hidden text-[10px] text-[#99958d] sm:block">Products in catalogue</p>
        </div>

        <div className="rounded-xl border border-[#e8e6e1] bg-white p-3 sm:p-4">
          <div className="flex items-center justify-between gap-1">
            <span className="truncate text-[10px] font-medium text-[#88847d] sm:text-[11px]">
              Published
            </span>
            <Eye size={15} className="shrink-0 text-emerald-600" />
          </div>
          <p className="mt-2 text-xl font-semibold leading-none text-[#24231f] sm:text-2xl">
            {publishedCount}
          </p>
          <p className="mt-1.5 hidden text-[10px] text-[#99958d] sm:block">Visible in your shop</p>
        </div>

        <div className="rounded-xl border border-[#e8e6e1] bg-white p-3 sm:p-4">
          <div className="flex items-center justify-between gap-1">
            <span className="truncate text-[10px] font-medium text-[#88847d] sm:text-[11px]">
              Drafts
            </span>
            <EyeOff size={15} className="shrink-0 text-amber-600" />
          </div>
          <p className="mt-2 text-xl font-semibold leading-none text-[#24231f] sm:text-2xl">
            {draftCount}
          </p>
          <p className="mt-1.5 hidden text-[10px] text-[#99958d] sm:block">
            Not visible in your shop
          </p>
        </div>
      </div>

      {}
      <section className="overflow-hidden rounded-xl border border-[#e8e6e1] bg-white">
        <div className="flex flex-col gap-3 border-b border-[#e8e6e1] p-3.5 sm:p-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="font-heading text-sm font-semibold text-[#24231f] sm:text-base">
              All products
            </h3>
            <p className="mt-0.5 text-[11px] text-[#88847d]">
              Showing {filteredProducts.length} of {products.length} products
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
            <div className="relative col-span-2 sm:col-span-1">
              <Search
                size={14}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#99958d]"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products..."
                className="h-9 w-full rounded-lg border border-[#e8e6e1] bg-[#fcfcfa] pl-8 pr-3 text-[11px] outline-none placeholder:text-[#aaa69e] focus:border-brand sm:w-48"
              />
            </div>

            <div className="relative sm:w-36">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className={selectClass}
              >
                <option value="All">All categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={13}
                className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#88847d]"
              />
            </div>

            <div className="relative sm:w-32">
              <select
                value={visibilityFilter}
                onChange={(e) => setVisibilityFilter(e.target.value)}
                className={selectClass}
              >
                <option value="All">All status</option>
                <option value="Published">Published</option>
                <option value="Draft">Draft</option>
              </select>
              <ChevronDown
                size={13}
                className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#88847d]"
              />
            </div>
          </div>
        </div>

        {loadError ? (
          <div className="p-8 text-center text-xs text-red-600">
            Could not load products. Refresh the page to try again.
          </div>
        ) : isLoading && !data ? (
          <div className="flex items-center justify-center gap-2 p-10 text-xs text-[#88847d]">
            <LoaderCircle size={16} className="animate-spin" />
            Loading products...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-5 py-12 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#f5f3ee]">
              <PackagePlus size={22} className="text-[#aaa69e]" />
            </div>

            <h3 className="text-xs font-semibold text-[#332925]">
              {products.length === 0 ? 'No products yet' : 'No matching products'}
            </h3>

            <p className="mt-1.5 max-w-xs text-[11px] leading-5 text-[#88847d]">
              {products.length === 0
                ? 'Start building your catalogue by adding your first product.'
                : 'Try changing your search or filter.'}
            </p>

            {products.length === 0 && (
              <button
                type="button"
                onClick={openCreateModal}
                className="mt-4 h-9 rounded-lg bg-brand px-4 text-[11px] font-bold text-white hover:bg-[#a9442c]"
              >
                ADD FIRST PRODUCT
              </button>
            )}
          </div>
        ) : (
          <>
            {}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left">
                <thead className="bg-[#faf9f6]">
                  <tr className="text-[9px] font-bold uppercase tracking-wider text-[#88847d]">
                    <th className="px-5 py-3">Product</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Price</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#efede8]">
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="transition hover:bg-[#fcfbf9]">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="h-10 w-10 shrink-0 rounded-lg border border-[#e8e6e1] bg-[#faf9f6] object-cover"
                          />

                          <div className="min-w-0">
                            <p className="max-w-[240px] truncate text-xs font-semibold text-[#24231f]">
                              {product.name}
                            </p>
                            <p className="mt-0.5 max-w-[240px] truncate text-[10px] text-[#99958d]">
                              {product.slug}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <span className="rounded-md bg-[#f5f3ee] px-2 py-1 text-[10px] font-medium text-[#55514a]">
                          {product.category}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <p className="text-xs font-semibold text-[#24231f]">
                          {formatPrice(product.priceCents)}
                        </p>
                        <p className="mt-0.5 text-[10px] text-[#99958d]">/ {product.unit}</p>
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[10px] font-semibold ${
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

                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            title={product.published ? 'Unpublish' : 'Publish'}
                            disabled={actionId === product.id}
                            onClick={() => void togglePublished(product)}
                            className={iconButtonClass}
                          >
                            {actionId === product.id ? (
                              <LoaderCircle size={14} className="animate-spin" />
                            ) : product.published ? (
                              <EyeOff size={14} />
                            ) : (
                              <Eye size={14} />
                            )}
                          </button>

                          <button
                            type="button"
                            title="Edit product"
                            onClick={() => editProduct(product)}
                            className={iconButtonClass}
                          >
                            <Pencil size={14} />
                          </button>

                          <button
                            type="button"
                            title="Delete product"
                            disabled={actionId === product.id}
                            onClick={() => void deleteProduct(product)}
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#e8e6e1] bg-white text-[#a9442c] transition hover:border-red-300 hover:bg-red-50 disabled:opacity-50"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {}
            <div className="divide-y divide-[#efede8] md:hidden">
              {filteredProducts.map((product) => (
                <article key={product.id} className="p-3.5">
                  <div className="flex gap-3">
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="h-14 w-14 shrink-0 rounded-lg border border-[#e8e6e1] object-cover"
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="rounded bg-[#f5f3ee] px-1.5 py-0.5 text-[9px] font-medium text-[#55514a]">
                          {product.category}
                        </span>
                        <span
                          className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${
                            product.published
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {product.published ? 'Published' : 'Draft'}
                        </span>
                      </div>

                      <h3 className="mt-1 truncate text-xs font-semibold text-[#24231f]">
                        {product.name}
                      </h3>

                      <p className="mt-0.5 text-[11px] font-medium text-[#55514a]">
                        {formatPrice(product.priceCents)}{' '}
                        <span className="font-normal text-[#99958d]">/ {product.unit}</span>
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => editProduct(product)}
                      className={`${buttonClass} flex-1`}
                    >
                      <Pencil size={13} /> Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => void togglePublished(product)}
                      disabled={actionId === product.id}
                      className={`${buttonClass} flex-1`}
                    >
                      {actionId === product.id ? (
                        <LoaderCircle size={13} className="animate-spin" />
                      ) : product.published ? (
                        <>
                          <EyeOff size={13} /> Unpublish
                        </>
                      ) : (
                        <>
                          <Eye size={13} /> Publish
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => void deleteProduct(product)}
                      disabled={actionId === product.id}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#e8e6e1] text-red-600 hover:bg-red-50 disabled:opacity-50"
                      aria-label={`Delete ${product.name}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>

      {}
      {modalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-[#171613]/60 backdrop-blur-[3px] sm:items-center sm:p-6"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-modal-title"
            className="flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-h-[90dvh] sm:rounded-xl"
          >
            {}
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[#e8e6e1] px-4 py-3.5 sm:px-6 sm:py-4">
              <div className="min-w-0">
                <div className="mb-1 flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.16em] text-[#88847d]">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                  Product catalogue
                </div>

                <h2
                  id="product-modal-title"
                  className="font-heading text-base font-semibold text-[#24231f] sm:text-lg"
                >
                  {editingId ? 'Edit product' : 'Add new product'}
                </h2>

                <p className="mt-0.5 text-[11px] text-[#88847d]">
                  {editingId
                    ? 'Update your product information.'
                    : 'Enter the details for your new product.'}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={submitting || uploadingImage}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#e8e6e1] text-[#77736d] transition hover:bg-[#f5f3ee] disabled:opacity-50"
                aria-label="Close modal"
              >
                <X size={16} />
              </button>
            </div>

            {}
            <form onSubmit={saveProduct} className="flex min-h-0 flex-1 flex-col">
              <div className="min-h-0 flex-1 overflow-y-auto">
                <div className="grid grid-cols-1 gap-x-4 gap-y-4 p-4 sm:grid-cols-2 sm:p-6">
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
                      onChange={async (e) => {
                        const value = e.target.value;
                        if (value === '__add_category__') {
                          const name = window.prompt('Enter new category name');
                          if (!name?.trim()) return;
                          const response = await fetch('/api/admin/categories', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ name }),
                          });
                          const result = await response.json();
                          if (!response.ok) {
                            setMessage(result.error || 'Could not add category');
                            return;
                          }
                          setCategories((current) =>
                            [...new Set([...current, result.category])].sort(),
                          );
                          setDraft((current) => ({ ...current, category: result.category }));
                        } else setDraft((current) => ({ ...current, category: value }));
                      }}
                    >
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                      <option value="__add_category__">+ Add a new category…</option>
                    </select>
                  </label>

                  <label className={labelClass}>
                    Product type *
                    <select
                      className={inputClass}
                      value={draft.productType}
                      onChange={(e) =>
                        setDraft((current) => ({
                          ...current,
                          productType: e.target.value as 'standard' | 'meatbox',
                        }))
                      }
                    >
                      <option value="standard">Regular product</option>
                      <option value="meatbox">Meatbox / bundle</option>
                    </select>
                  </label>

                  {draft.productType === 'meatbox' && (
                    <div className="rounded-xl border border-[#eee8e2] bg-[#fcfbf9] p-3 sm:col-span-2">
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-[11px] font-bold text-[#332925]">
                            What is inside this meatbox?
                          </p>
                          <p className="mt-0.5 text-[10px] font-normal text-[#88847d]">
                            Add each meat type separately and set the quantity included.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setDraft((current) => ({
                              ...current,
                              bundleItemsText: writeBundleRows([
                                ...readBundleRows(current.bundleItemsText),
                                { name: '', quantity: 1 },
                              ]),
                            }))
                          }
                          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#e8e2dc] bg-white px-3 text-[10px] font-semibold text-[#a64e31] hover:bg-[#fff5ef]"
                        >
                          <Plus size={12} /> Add meat type
                        </button>
                      </div>

                      <div className="space-y-2">
                        {bundleRows.map((row, index) => (
                          <div
                            key={index}
                            className="grid grid-cols-[minmax(0,1fr)_72px_32px] items-end gap-2 sm:grid-cols-[minmax(0,1fr)_92px_32px]"
                          >
                            <label className="min-w-0 text-[10px] font-semibold text-[#6b6259]">
                              Meat type
                              <input
                                value={row.name}
                                onChange={(event) => {
                                  const rows = readBundleRows(draft.bundleItemsText);
                                  rows[index] = { ...rows[index], name: event.target.value };
                                  setDraft((current) => ({
                                    ...current,
                                    bundleItemsText: writeBundleRows(rows),
                                  }));
                                }}
                                placeholder="e.g. Beef"
                                className="mt-1 h-9 w-full rounded-lg border border-[#e8e6e1] bg-white px-3 text-[11px] font-normal text-[#24231f] outline-none focus:border-brand"
                              />
                            </label>

                            <label className="text-[10px] font-semibold text-[#6b6259]">
                              Qty
                              <input
                                type="number"
                                min={1}
                                max={999}
                                step={1}
                                value={row.quantity}
                                onChange={(event) => {
                                  const rows = readBundleRows(draft.bundleItemsText);
                                  rows[index] = {
                                    ...rows[index],
                                    quantity: Number(event.target.value),
                                  };
                                  setDraft((current) => ({
                                    ...current,
                                    bundleItemsText: writeBundleRows(rows),
                                  }));
                                }}
                                className="mt-1 h-9 w-full rounded-lg border border-[#e8e6e1] bg-white px-2 text-center text-[11px] font-normal text-[#24231f] outline-none focus:border-brand"
                              />
                            </label>

                            <button
                              type="button"
                              aria-label={`Remove meat type ${index + 1}`}
                              disabled={bundleRows.length === 1}
                              onClick={() => {
                                const rows = readBundleRows(draft.bundleItemsText).filter(
                                  (_, rowIndex) => rowIndex !== index,
                                );
                                setDraft((current) => ({
                                  ...current,
                                  bundleItemsText: writeBundleRows(rows),
                                }));
                              }}
                              className="grid h-9 w-8 place-items-center rounded-lg text-[#a34c37] hover:bg-red-50 disabled:opacity-30"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        ))}
                      </div>

                      <p className="mt-3 rounded-lg bg-[#f6f0e9] px-3 py-2 text-[10px] leading-4 text-[#786b5d]">
                        Example: Beef × 6, Chicken laps × 2, Liver × 10. Set the final selling price
                        yourself in the Price field below.
                      </p>
                    </div>
                  )}

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

                  {}
                  <div className="flex flex-col gap-3 sm:col-span-2">
                    <div className={labelClass}>
                      Product image
                      <div className="relative flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-[#dcd8cf] bg-[#fcfcfa] px-4 py-5 text-center transition hover:border-brand hover:bg-[#fffaf7]">
                        <ImagePlus size={22} className="mb-2 text-brand" />

                        <span className="text-[11px] font-semibold text-[#332925]">
                          {uploadingImage ? 'Uploading image...' : 'Click to upload an image'}
                        </span>

                        <span className="mt-0.5 text-[10px] font-normal text-[#99958d]">
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
                    </div>

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
                      <div className="flex items-center gap-3 rounded-lg border border-[#e8e6e1] bg-[#fcfcfa] p-2.5">
                        <img
                          src={draft.imageUrl}
                          alt="Product preview"
                          className="h-16 w-16 shrink-0 rounded-lg border border-[#e8e6e1] object-cover"
                        />

                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold text-[#332925]">Image preview</p>
                          <p className="mt-0.5 truncate text-[10px] text-[#88847d]">
                            {draft.imageUrl.includes('res.cloudinary.com')
                              ? 'Cloudinary image'
                              : 'Product image URL'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2.5 rounded-lg border border-[#e8e6e1] bg-[#fcfcfa] px-3.5 py-2.5 sm:col-span-2">
                    <input
                      id="publish-product"
                      type="checkbox"
                      className="h-3.5 w-3.5 accent-brand"
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
                      className="cursor-pointer text-[11px] font-semibold text-[#332925]"
                    >
                      Publish this product
                    </label>
                  </div>

                  <label className={`${labelClass} sm:col-span-2`}>
                    Description *
                    <textarea
                      className={`${inputClass} min-h-[96px] resize-y leading-5`}
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

                {message && (
                  <div
                    role="status"
                    className="mx-4 mb-4 rounded-lg border border-[#e8e6e1] bg-[#fcfcfa] px-3.5 py-2.5 text-[11px] leading-5 text-[#55514a] sm:mx-6"
                  >
                    {message}
                  </div>
                )}
              </div>

              {}
              <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-[#e8e6e1] bg-white px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:flex-row sm:items-center sm:justify-between sm:px-6">
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
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-brand px-5 text-[11px] font-bold tracking-wide text-white transition hover:bg-[#a9442c] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting || uploadingImage ? (
                    <LoaderCircle size={14} className="animate-spin" />
                  ) : (
                    <Check size={14} />
                  )}

                  {uploadingImage
                    ? 'UPLOADING IMAGE...'
                    : submitting
                      ? 'SAVING...'
                      : editingId
                        ? 'SAVE CHANGES'
                        : 'CREATE PRODUCT'}

                  {!submitting && !uploadingImage && <ArrowUpRight size={14} />}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
