
'use client';

import { useState, type FormEvent } from 'react';
import useSWR from 'swr';
import {
  ArrowUpRight,
  LoaderCircle,
  PackagePlus,
  Pencil,
  Trash2,
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

type AdminProductResponse = { products: CatalogProduct[] };

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

async function fetchProducts(url: string): Promise<AdminProductResponse> {
  const response = await fetch(url);
  if (!response.ok) throw new Error('Could not load products.');
  return response.json();
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

const fieldClass =
  'h-11 w-full rounded-sm border border-[#e6e4de] bg-[#fcfcfa] px-3 text-sm text-[#24231f] outline-none transition-colors placeholder:text-[#aaa69e] focus:border-[#e86b3e]';

const labelClass = 'flex flex-col gap-2 text-xs font-semibold text-[#332925]';

const secondaryButtonClass =
  'inline-flex min-h-9 items-center justify-center border border-[#e6e4de] bg-white px-3 text-xs font-semibold text-[#55514a] transition-colors hover:border-[#e86b3e] hover:text-[#e86b3e] disabled:cursor-not-allowed disabled:opacity-50';

export default function AdminProducts({
  initialProducts,
}: {
  initialProducts: CatalogProduct[];
}) {
  const {
    data,
    error: loadError,
    mutate,
  } = useSWR<AdminProductResponse>('/api/admin/products', fetchProducts, {
    fallbackData: { products: initialProducts },
  });

  const [draft, setDraft] = useState<ProductDraft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const products = data?.products ?? initialProducts;

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
    setMessage('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function discardStagedImage(url: string | null) {
    if (url) {
      void fetch(`/api/admin/product-images?url=${encodeURIComponent(url)}`, {
        method: 'DELETE',
      });
    }
  }

  function cancelEdit() {
    discardStagedImage(uploadedImageUrl);
    setUploadedImageUrl(null);
    setEditingId(null);
    setDraft(emptyDraft);
    setMessage('');
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
      setUploadedImageUrl(result.url as string);
      setDraft((current) => ({
        ...current,
        imageUrl: result.url as string,
      }));

      setMessage('Image uploaded to Cloudinary. Save the product to keep it.');
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Unable to upload this image.',
      );
    } finally {
      setUploadingImage(false);
    }
  }

  async function saveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (uploadingImage) {
      setMessage('Wait for the image upload to finish before saving.');
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
        const fieldErrors = result?.details?.fieldErrors as
          | Record<string, string[]>
          | undefined;

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
      setDraft(emptyDraft);
      setEditingId(null);
      setUploadedImageUrl(null);
      setMessage(editingId ? 'Product updated.' : 'Product created.');
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Unable to save this product.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function togglePublished(product: CatalogProduct) {
    setMessage('');

    const response = await fetch(`/api/admin/products/${product.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ published: !product.published }),
    });

    if (!response.ok) {
      const result = await response.json().catch(() => null);
      setMessage(result?.error || 'Unable to update product visibility.');
      return;
    }

    await mutate();
  }

  async function deleteProduct(product: CatalogProduct) {
    if (!window.confirm(`Delete ${product.name}? This cannot be undone.`)) return;

    setMessage('');

    const response = await fetch(`/api/admin/products/${product.id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const result = await response.json().catch(() => null);
      setMessage(result?.error || 'Unable to delete this product.');
      return;
    }

    await mutate();

    if (editingId === product.id) cancelEdit();

    setMessage('Product deleted.');
  }

  return (
    <div className="grid grid-cols-1 gap-6">
      {/* Product editor */}
      <section
        className="rounded-sm border border-[#e6e4de] bg-white p-5 shadow-[0_2px_12px_rgba(36,35,31,0.03)] sm:p-7"
        aria-labelledby="product-editor-title"
      >
        <div className="mb-7 flex items-center justify-between gap-4 border-b border-[#e6e4de] pb-5">
          <div>
            <p className="mb-2 flex items-center gap-2 text-[10px] font-bold tracking-[0.16em] text-[#88847d]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#e86b3e]" />
              CATALOGUE
            </p>

            <h2
              id="product-editor-title"
              className="font-heading text-2xl font-semibold tracking-tight text-[#24231f]"
            >
              {editingId ? 'Edit product' : 'Add a product'}
            </h2>
          </div>

          <PackagePlus className="shrink-0 text-[#e86b3e]" size={22} />
        </div>

        <form
          className="grid grid-cols-1 gap-x-5 gap-y-5 sm:grid-cols-2"
          onSubmit={saveProduct}
        >
          <label className={labelClass}>
            Product name
            <input
              className={fieldClass}
              value={draft.name}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  name: event.target.value,
                  slug: current.slug || slugify(event.target.value),
                }))
              }
              required
              maxLength={100}
            />
          </label>

          <label className={labelClass}>
            URL slug
            <input
              className={fieldClass}
              value={draft.slug}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  slug: slugifyWhileTyping(event.target.value),
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
            />
          </label>

          <label className={labelClass}>
            Category
            <select
              className={fieldClass}
              value={draft.category}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  category: event.target.value as ProductDraft['category'],
                }))
              }
            >
              {productCategories.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
          </label>

          <label className={labelClass}>
            Cut details
            <input
              className={fieldClass}
              value={draft.cut}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  cut: event.target.value,
                }))
              }
              required
              maxLength={120}
            />
          </label>

          <label className={labelClass}>
            Price (₦ NGN)
            <input
              className={fieldClass}
              type="number"
              inputMode="decimal"
              min="0.01"
              step="0.01"
              value={draft.price}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  price: event.target.value,
                }))
              }
              placeholder="e.g. 20000"
              required
            />
          </label>

          <label className={labelClass}>
            Unit
            <input
              className={fieldClass}
              value={draft.unit}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  unit: event.target.value,
                }))
              }
              placeholder="per kg, per package, 200g"
              required
              maxLength={40}
            />
          </label>

          <label className={`${labelClass} sm:col-span-2`}>
            Upload product image
            <input
              className="w-full cursor-pointer rounded-sm border border-[#e6e4de] bg-[#fcfcfa] text-xs text-[#77736d] file:mr-4 file:border-0 file:bg-[#f0eee9] file:px-4 file:py-3 file:text-xs file:font-semibold file:text-[#332925] hover:file:bg-[#e9e6df] disabled:cursor-not-allowed disabled:opacity-50"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) =>
                void uploadImage(event.currentTarget.files?.[0])
              }
              disabled={uploadingImage || submitting}
            />
            <span className="text-[11px] font-normal text-[#88847d]">
              JPEG, PNG, or WebP · 2 MB max
            </span>
          </label>

          <label className={`${labelClass} sm:col-span-2`}>
            Or use an HTTPS image URL
            <input
              className={fieldClass}
              type="url"
              value={
                draft.imageUrl.startsWith('/api/product-images/')
                  ? ''
                  : draft.imageUrl
              }
              onChange={(event) => {
                if (uploadedImageUrl) {
                  discardStagedImage(uploadedImageUrl);
                  setUploadedImageUrl(null);
                }

                setDraft((current) => ({
                  ...current,
                  imageUrl: event.target.value,
                }));
              }}
              placeholder="https://…"
            />
          </label>

          {draft.imageUrl && (
            <div className="flex items-center gap-4 rounded-sm border border-[#e6e4de] bg-[#fcfcfa] p-3 sm:col-span-2">
              <img
                src={draft.imageUrl}
                alt="Product image preview"
                className="h-20 w-20 shrink-0 rounded-sm border border-[#e6e4de] bg-white object-cover"
              />

              <span className="text-xs text-[#77736d]">
                {draft.imageUrl.startsWith('/api/product-images/')
                  ? 'Previously uploaded image'
                  : draft.imageUrl.includes('res.cloudinary.com')
                    ? 'Stored in Cloudinary'
                    : 'External image URL'}
              </span>
            </div>
          )}

          <label className={labelClass}>
            Badge <span className="font-normal text-[#88847d]">(optional)</span>
            <input
              className={fieldClass}
              value={draft.badge}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  badge: event.target.value,
                }))
              }
              maxLength={40}
            />
          </label>

          <label className="flex min-h-[44px] items-center gap-3 self-end text-xs font-semibold text-[#332925]">
            <input
              type="checkbox"
              className="h-4 w-4 accent-[#e86b3e]"
              checked={draft.published}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  published: event.target.checked,
                }))
              }
            />
            Publish this product
          </label>

          <label className={`${labelClass} sm:col-span-2`}>
            Description
            <textarea
              className="min-h-[120px] w-full resize-y rounded-sm border border-[#e6e4de] bg-[#fcfcfa] px-3 py-3 text-sm leading-6 text-[#24231f] outline-none transition-colors focus:border-[#e86b3e]"
              value={draft.description}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              rows={4}
              required
              maxLength={2000}
            />
          </label>

          <div className="flex flex-wrap items-center gap-3 border-t border-[#e6e4de] pt-5 sm:col-span-2">
            <button
              className="inline-flex h-11 items-center justify-between gap-5 bg-[#e86b3e] px-5 text-[10px] font-bold tracking-[0.12em] text-white transition-colors hover:bg-[#a9442c] disabled:cursor-not-allowed disabled:opacity-50"
              type="submit"
              disabled={submitting || uploadingImage}
            >
              {submitting || uploadingImage ? (
                <LoaderCircle className="animate-spin" size={16} />
              ) : editingId ? (
                'SAVE CHANGES'
              ) : (
                'ADD PRODUCT'
              )}
              <ArrowUpRight size={16} />
            </button>

            {editingId && (
              <button
                className={secondaryButtonClass}
                type="button"
                onClick={cancelEdit}
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        {message && (
          <p
            className="mt-5 border border-[#e6e4de] bg-[#fcfcfa] px-4 py-3 text-xs leading-5 text-[#77736d]"
            role="status"
            aria-live="polite"
          >
            {message}
          </p>
        )}
      </section>

      {/* Product list */}
      <section
        className="rounded-sm border border-[#e6e4de] bg-white p-5 shadow-[0_2px_12px_rgba(36,35,31,0.03)] sm:p-7"
        aria-labelledby="products-title"
      >
        <div className="mb-6 flex items-center justify-between border-b border-[#e6e4de] pb-5">
          <div>
            <p className="mb-2 flex items-center gap-2 text-[10px] font-bold tracking-[0.16em] text-[#88847d]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#e86b3e]" />
              LIVE DATA
            </p>

            <h2
              id="products-title"
              className="flex items-center gap-3 font-heading text-2xl font-semibold tracking-tight text-[#24231f]"
            >
              Products
              <span className="rounded-full bg-[#f0eee9] px-2.5 py-1 text-xs font-semibold text-[#77736d]">
                {products.length}
              </span>
            </h2>
          </div>
        </div>

        {loadError ? (
          <p className="border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">
            Could not load products. Refresh the page to try again.
          </p>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-5 py-12 text-center">
            <PackagePlus className="mb-4 text-[#c5c0b6]" size={32} />
            <p className="text-sm font-semibold text-[#332925]">
              No products are stored yet.
            </p>
            <span className="mt-2 text-xs text-[#88847d]">
              Add a product above; nothing is preloaded or seeded.
            </span>
          </div>
        ) : (
          <div className="divide-y divide-[#e6e4de]">
            {products.map((product) => (
              <article
                className="flex flex-col gap-4 py-5 first:pt-0 last:pb-0 sm:flex-row sm:items-center"
                key={product.id}
              >
                <img
                  src={product.imageUrl}
                  alt=""
                  className="h-20 w-20 shrink-0 rounded-sm border border-[#e6e4de] bg-[#fcfcfa] object-cover"
                />

                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#88847d]">
                    {product.category} · {product.published ? 'Published' : 'Draft'}
                  </span>

                  <h3 className="mt-1 truncate font-heading text-base font-semibold text-[#24231f]">
                    {product.name}
                  </h3>

                  <p className="mt-1 break-all text-xs text-[#77736d]">
                    {product.slug} · {formatPrice(product.priceCents)} / {product.unit}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  <button
                    type="button"
                    className={secondaryButtonClass}
                    onClick={() => void togglePublished(product)}
                  >
                    {product.published ? 'Unpublish' : 'Publish'}
                  </button>

                  <button
                    type="button"
                    className="flex h-9 w-9 items-center justify-center border border-[#e6e4de] text-[#77736d] transition-colors hover:border-[#e86b3e] hover:text-[#e86b3e]"
                    onClick={() => editProduct(product)}
                    aria-label={`Edit ${product.name}`}
                  >
                    <Pencil size={16} />
                  </button>

                  <button
                    type="button"
                    className="flex h-9 w-9 items-center justify-center border border-[#e6e4de] text-[#a9442c] transition-colors hover:border-[#a9442c] hover:bg-red-50"
                    onClick={() => void deleteProduct(product)}
                    aria-label={`Delete ${product.name}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
