'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ImagePlus, X } from 'lucide-react';
import { CATEGORIES, PREPARATIONS } from '@/lib/categories';

const MEAT_TYPES = ['BEEF', 'PORK', 'CHICKEN', 'LAMB', 'GOAT', 'FISH', 'SEAFOOD', 'OTHER'];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export interface ProductFormData {
  name: string;
  description: string;
  meatType: string;
  category: string;
  basePrice: string;
  stock: string;
  tags: string;
  preparations: string;
  isNewArrival: boolean;
  isBestSeller: boolean;
  sameDayDelivery: boolean;
}

interface ImageItem {
  id: string;
  url: string;
  file?: File;
  error?: string;
}

const EMPTY_FORM: ProductFormData = {
  name: '',
  description: '',
  meatType: '',
  category: '',
  basePrice: '',
  stock: '',
  tags: '',
  preparations: '',
  isNewArrival: false,
  isBestSeller: false,
  sameDayDelivery: false,
};

interface ProductFormProps {
  mode: 'create' | 'edit';
  productId?: string;
  initial?: Partial<ProductFormData>;
  initialImages?: string[];
}

export function toCsv(value: unknown): string {
  return Array.isArray(value) ? value.join(', ') : '';
}

function fromCsv(value: string): string[] {
  return value
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
}

export default function ProductForm({ mode, productId, initial, initialImages }: ProductFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<ProductFormData>({ ...EMPTY_FORM, ...initial });
  const [images, setImages] = useState<ImageItem[]>(() => (initialImages ?? []).map((url) => ({ id: url, url })));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!initial) return;
    setForm({ ...EMPTY_FORM, ...initial });
  }, [initial]);

  useEffect(() => {
    if (!initialImages) return;
    setImages(initialImages.map((url) => ({ id: url, url })));
  }, [initialImages]);

  const update = <K extends keyof ProductFormData>(key: K, value: ProductFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (files.length === 0) return;

    const newItems: ImageItem[] = files.map((file) => {
      const base = { id: crypto.randomUUID(), url: URL.createObjectURL(file), file };
      if (!file.type.startsWith('image/')) {
        return { ...base, error: 'Not an image' };
      }
      if (file.size > MAX_FILE_SIZE) {
        return { ...base, error: 'Over 5MB' };
      }
      return base;
    });

    setImages((prev) => [...prev, ...newItems]);
  };

  const removeImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.name.trim()) {
      setError('Give the product a name.');
      return;
    }
    if (!form.meatType) {
      setError('Choose a meat type.');
      return;
    }
    const basePrice = Number(form.basePrice);
    const stock = Number(form.stock);
    if (!Number.isFinite(basePrice) || basePrice < 0) {
      setError('Base price needs to be a valid number.');
      return;
    }
    if (!Number.isFinite(stock) || stock < 0 || !Number.isInteger(stock)) {
      setError('Stock needs to be a whole number.');
      return;
    }
    if (images.some((img) => img.error)) {
      setError('Remove the images marked as failed before saving.');
      return;
    }

    setSaving(true);
    try {
      const body = new FormData();
      body.append('name', form.name.trim());
      body.append('description', form.description.trim());
      body.append('meatType', form.meatType);
      body.append('category', form.category.trim());
      body.append('basePrice', String(basePrice));
      body.append('stock', String(stock));
      body.append('tags', JSON.stringify(fromCsv(form.tags)));
      body.append('preparations', JSON.stringify(fromCsv(form.preparations)));
      body.append('isNewArrival', String(form.isNewArrival));
      body.append('isBestSeller', String(form.isBestSeller));
      body.append('sameDayDelivery', String(form.sameDayDelivery));

      const existingImages = images.filter((img) => !img.file).map((img) => img.url);
      body.append('existingImages', JSON.stringify(existingImages));

      images.filter((img): img is ImageItem & { file: File } => Boolean(img.file)).forEach((img) => body.append('images', img.file));

      const url = mode === 'create' ? '/api/admin/products' : `/api/admin/products/${productId}`;
      const method = mode === 'create' ? 'POST' : 'PUT';

      const response = await fetch(url, { method, body });

      if (!response.ok) {
        const responseBody = await response.json().catch(() => ({}));
        throw new Error(responseBody.error || 'Something went wrong saving the product.');
      }

      router.push('/admin/products');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong saving the product.');
      setSaving(false);
    }
  };

  const hasNewFiles = images.some((img) => img.file && !img.error);
  const inputClass = 'w-full rounded-lg border border-ink/20 bg-white px-3 py-2 text-sm text-charcoal placeholder:text-ink/60 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20';
  const labelClass = 'mb-1.5 block text-sm font-medium text-charcoal';

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-3xl">
      {error && <div className="border-brand/30 bg-brand/10 text-brand mb-6 rounded-lg border px-4 py-3 text-sm">{error}</div>}

      <div className="border-sand rounded-2xl border bg-white p-6 shadow-sm sm:p-8">
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="name" className={labelClass}>
              Product name
            </label>
            <input id="name" type="text" value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Dry-Aged Ribeye Steak" className={inputClass} />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="description" className={labelClass}>
              Description
            </label>
            <textarea id="description" value={form.description} onChange={(e) => update('description', e.target.value)} rows={4} placeholder="What makes this cut worth ordering?" className={inputClass} />
          </div>

          <div>
            <label htmlFor="meatType" className={labelClass}>
              Meat type
            </label>
            <select id="meatType" value={form.meatType} onChange={(e) => update('meatType', e.target.value)} className={inputClass}>
              <option value="">Select a type</option>
              {MEAT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type.charAt(0) + type.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="category" className={labelClass}>
              Category
            </label>
            <input
              id="category"
              type="text"
              list="category-options"
              value={form.category}
              onChange={(e) => update('category', e.target.value)}
              placeholder="Steaks"
              className={inputClass}
              autoComplete="off"
            />
            <datalist id="category-options">
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat} />
              ))}
            </datalist>
          </div>

          <div>
            <label htmlFor="basePrice" className={labelClass}>
              Base price (USD)
            </label>
            <input id="basePrice" type="number" min="0" step="0.01" value={form.basePrice} onChange={(e) => update('basePrice', e.target.value)} placeholder="24.99" className={inputClass} />
          </div>

          <div>
            <label htmlFor="stock" className={labelClass}>
              Stock quantity
            </label>
            <input id="stock" type="number" min="0" step="1" value={form.stock} onChange={(e) => update('stock', e.target.value)} placeholder="50" className={inputClass} />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="tags" className={labelClass}>
              Tags <span className="text-ink font-normal">(comma-separated)</span>
            </label>
            <input id="tags" type="text" value={form.tags} onChange={(e) => update('tags', e.target.value)} placeholder="grass-fed, premium, grilling" className={inputClass} />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="preparations" className={labelClass}>
              Preparations <span className="text-ink font-normal">(comma-separated)</span>
            </label>
            <input
              id="preparations"
              type="text"
              list="preparation-options"
              value={form.preparations}
              onChange={(e) => update('preparations', e.target.value)}
              placeholder="whole, sliced, marinated"
              className={inputClass}
              autoComplete="off"
            />
            <datalist id="preparation-options">
              {PREPARATIONS.map((p) => (
                <option key={p} value={p} />
              ))}
            </datalist>
          </div>

          <div className="sm:col-span-2">
            <label className={labelClass}>Product images</label>
            <div className="flex flex-wrap gap-3">
              {images.map((img) => (
                <div key={img.id} className="group border-ink/20 bg-sand relative h-24 w-24 overflow-hidden rounded-lg border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt="" className="h-full w-full object-cover" />
                  {img.error && <div className="bg-brand/85 absolute inset-0 flex items-center justify-center p-1 text-center text-[10px] font-medium text-white">{img.error}</div>}
                  <button type="button" onClick={() => removeImage(img.id)} className="absolute top-1 right-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition group-hover:opacity-100" aria-label="Remove image">
                    <X size={12} />
                  </button>
                </div>
              ))}

              <label className="border-ink/30 text-ink hover:border-brand hover:text-brand flex h-24 w-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed transition">
                <ImagePlus size={20} />
                <span className="text-xs">Add</span>
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleFileSelect} />
              </label>
            </div>
            <p className="text-ink mt-1.5 text-xs">PNG or JPG, up to 5MB each. Uploaded when you save.</p>
          </div>
        </div>

        <div className="border-sand mt-6 flex flex-wrap gap-6 border-t pt-6">
          <label className="text-charcoal flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.isNewArrival} onChange={(e) => update('isNewArrival', e.target.checked)} className="border-ink/40 text-brand focus:ring-brand/30 h-4 w-4 rounded" />
            New arrival
          </label>
          <label className="text-charcoal flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.isBestSeller} onChange={(e) => update('isBestSeller', e.target.checked)} className="border-ink/40 text-brand focus:ring-brand/30 h-4 w-4 rounded" />
            Best seller
          </label>
          <label className="text-charcoal flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.sameDayDelivery} onChange={(e) => update('sameDayDelivery', e.target.checked)} className="border-ink/40 text-brand focus:ring-brand/30 h-4 w-4 rounded" />
            Same-day delivery
          </label>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-end gap-3">
        <button type="button" onClick={() => router.push('/admin/products')} className="text-ink hover:text-charcoal rounded-lg px-4 py-2 text-sm font-medium">
          Cancel
        </button>
        <button type="submit" disabled={saving} className="bg-brand text-brand-foreground flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-semibold transition hover:opacity-90 disabled:opacity-60">
          {saving && <Loader2 size={16} className="animate-spin" />}
          {saving ? (hasNewFiles ? 'Uploading & saving...' : 'Saving...') : mode === 'create' ? 'Add product' : 'Save changes'}
        </button>
      </div>
    </form>
  );
}