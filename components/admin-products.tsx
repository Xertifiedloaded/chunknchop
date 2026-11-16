'use client';

import { useState, type FormEvent } from 'react';
import useSWR from 'swr';
import { ArrowUpRight, ImagePlus, LoaderCircle, PackagePlus, Pencil, Trash2 } from 'lucide-react';
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
  price: string; // naira, as typed by the admin (UI only, never sent to the API)
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

// Full cleanup (used on blur and when auto-generating from the name)
function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// Light cleanup while typing: keeps a trailing hyphen so "rib-eye" can be typed
function slugifyWhileTyping(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-/, '');
}

export default function AdminProducts({ initialProducts }: { initialProducts: CatalogProduct[] }) {
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
      price: koboToNairaInput(product.priceCents), // kobo -> naira, e.g. 2000000 -> "20000"
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
    if (url)
      void fetch(`/api/admin/product-images?url=${encodeURIComponent(url)}`, { method: 'DELETE' });
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
      const response = await fetch('/api/admin/product-images', { method: 'POST', body: formData });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.error || 'Unable to upload this image.');
      discardStagedImage(uploadedImageUrl);
      setUploadedImageUrl(result.url as string);
      setDraft((current) => ({ ...current, imageUrl: result.url as string }));
      setMessage('Image uploaded to Cloudinary. Save the product to keep it.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to upload this image.');
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

    // Naira -> kobo (₦1 = 100 kobo). Stored in the `priceCents` field.
    const priceKobo = Math.round(Number(draft.price) * 100);
    if (!Number.isSafeInteger(priceKobo) || priceKobo < 1) {
      setMessage('Enter a valid price in naira greater than zero.');
      setSubmitting(false);
      return;
    }

    // Build the payload explicitly. Do NOT spread `draft`: it contains `price`,
    // which the server's strict schema rejects.
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
        // In development the API returns details.fieldErrors / details.formErrors
        const fieldErrors = result?.details?.fieldErrors as Record<string, string[]> | undefined;
        const firstField = fieldErrors && Object.entries(fieldErrors)[0];
        const detail = firstField
          ? `${firstField[0]}: ${firstField[1][0]}`
          : result?.details?.formErrors?.[0];
        throw new Error(
          detail ? `${result?.error || 'Unable to save'} (${detail})` : result?.error || 'Unable to save this product.',
        );
      }
      await mutate();
      setDraft(emptyDraft);
      setEditingId(null);
      setUploadedImageUrl(null);
      setMessage(editingId ? 'Product updated.' : 'Product created.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to save this product.');
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
    const response = await fetch(`/api/admin/products/${product.id}`, { method: 'DELETE' });
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
    <div className="admin-workspace">
      <section className="admin-card" aria-labelledby="product-editor-title">
        <div className="admin-section-heading">
          <div>
            <p className="eyebrow">
              <span /> CATALOGUE
            </p>
            <h2 id="product-editor-title">{editingId ? 'Edit product' : 'Add a product'}</h2>
          </div>
          <PackagePlus size={22} />
        </div>
        <form className="admin-product-form" onSubmit={saveProduct}>
          <label>
            Product name
            <input
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
          <label>
            URL slug
            <input
              value={draft.slug}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  slug: slugifyWhileTyping(event.target.value),
                }))
              }
              onBlur={() => setDraft((current) => ({ ...current, slug: slugify(current.slug) }))}
              required
              minLength={2}
              maxLength={80}
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
            />
          </label>
          <label>
            Category
            <select
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
          <label>
            Cut details
            <input
              value={draft.cut}
              onChange={(event) => setDraft((current) => ({ ...current, cut: event.target.value }))}
              required
              maxLength={120}
            />
          </label>
          <label>
            Price (₦ NGN)
            <input
              type="number"
              inputMode="decimal"
              min="0.01"
              step="0.01"
              value={draft.price}
              onChange={(event) =>
                setDraft((current) => ({ ...current, price: event.target.value }))
              }
              placeholder="e.g. 20000"
              required
            />
          </label>
          <label>
            Unit
            <input
              value={draft.unit}
              onChange={(event) =>
                setDraft((current) => ({ ...current, unit: event.target.value }))
              }
              placeholder="per kg, per package, 200g"
              required
              maxLength={40}
            />
          </label>
          <label className="admin-field-wide">
            Upload product image
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => void uploadImage(event.currentTarget.files?.[0])}
              disabled={uploadingImage || submitting}
            />
            <span className="admin-field-hint">JPEG, PNG, or WebP · 2 MB max</span>
          </label>
          <label className="admin-field-wide">
            Or use an HTTPS image URL
            <input
              type="url"
              value={draft.imageUrl.startsWith('/api/product-images/') ? '' : draft.imageUrl}
              onChange={(event) => {
                if (uploadedImageUrl) {
                  discardStagedImage(uploadedImageUrl);
                  setUploadedImageUrl(null);
                }
                setDraft((current) => ({ ...current, imageUrl: event.target.value }));
              }}
              placeholder="https://…"
            />
          </label>
          {draft.imageUrl && (
            <div className="admin-image-preview admin-field-wide">
              <img src={draft.imageUrl} alt="Product image preview" />
              <span>
                {draft.imageUrl.startsWith('/api/product-images/')
                  ? 'Previously uploaded image'
                  : draft.imageUrl.includes('res.cloudinary.com')
                    ? 'Stored in Cloudinary'
                    : 'External image URL'}
              </span>
            </div>
          )}
          <label>
            Badge <span className="admin-field-hint">(optional)</span>
            <input
              value={draft.badge}
              onChange={(event) =>
                setDraft((current) => ({ ...current, badge: event.target.value }))
              }
              maxLength={40}
            />
          </label>
          <label className="admin-publish-toggle">
            <input
              type="checkbox"
              checked={draft.published}
              onChange={(event) =>
                setDraft((current) => ({ ...current, published: event.target.checked }))
              }
            />{' '}
            Publish this product
          </label>
          <label className="admin-field-wide">
            Description
            <textarea
              value={draft.description}
              onChange={(event) =>
                setDraft((current) => ({ ...current, description: event.target.value }))
              }
              rows={4}
              required
              maxLength={2000}
            />
          </label>
          <div className="admin-form-actions">
            <button
              className="admin-primary-button"
              type="submit"
              disabled={submitting || uploadingImage}
            >
              {submitting || uploadingImage ? (
                <LoaderCircle className="auth-spinner" size={16} />
              ) : editingId ? (
                'SAVE CHANGES'
              ) : (
                'ADD PRODUCT'
              )}
              <ArrowUpRight size={16} />
            </button>
            {editingId && (
              <button className="admin-secondary-button" type="button" onClick={cancelEdit}>
                Cancel
              </button>
            )}
          </div>
        </form>
        <p className="admin-message" role="status" aria-live="polite">
          {message}
        </p>
      </section>
      <section className="admin-card" aria-labelledby="products-title">
        <div className="admin-section-heading">
          <div>
            <p className="eyebrow">
              <span /> LIVE DATA
            </p>
            <h2 id="products-title">
              Products <span className="admin-count">{products.length}</span>
            </h2>
          </div>
        </div>
        {loadError ? (
          <p className="admin-feedback">Could not load products. Refresh the page to try again.</p>
        ) : products.length === 0 ? (
          <div className="admin-empty">
            <p>No products are stored yet.</p>
            <span>Add a product above; nothing is preloaded or seeded.</span>
          </div>
        ) : (
          <div className="admin-product-list">
            {products.map((product) => (
              <article className="admin-product-row" key={product.id}>
                <img src={product.imageUrl} alt="" />
                <div className="admin-product-copy">
                  <span>
                    {product.category} · {product.published ? 'Published' : 'Draft'}
                  </span>
                  <h3>{product.name}</h3>
                  <p>
                    {product.slug} · {formatPrice(product.priceCents)} / {product.unit}
                  </p>
                </div>
                <div className="admin-product-actions">
                  <button
                    type="button"
                    className="admin-secondary-button"
                    onClick={() => void togglePublished(product)}
                  >
                    {product.published ? 'Unpublish' : 'Publish'}
                  </button>
                  <button
                    type="button"
                    className="admin-icon-button"
                    onClick={() => editProduct(product)}
                    aria-label={`Edit ${product.name}`}
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    type="button"
                    className="admin-icon-button admin-delete-button"
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