'use client';

import { useEffect, useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { fetchWithAuth } from '@/lib/fetchClient';
import ProductForm, { toCsv } from './ProductForm';
import type { ProductFormData } from '@/lib/types';

interface ProductModalProps {
  mode: 'create' | 'edit';
  productId?: string;
  onClose: () => void;
  onSaved: () => void;
}

export default function ProductModal({ mode, productId, onClose, onSaved }: ProductModalProps) {
  const [initial, setInitial] = useState<Partial<ProductFormData> | undefined>(undefined);
  const [initialImages, setInitialImages] = useState<string[] | undefined>(undefined);
  const [loading, setLoading] = useState(mode === 'edit');
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (mode !== 'edit' || !productId) return;
    let cancelled = false;

    async function loadProduct() {
      setLoading(true);
      setLoadError(null);
      try {
        const response = await fetchWithAuth(`/api/admin/products/${productId}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Could not load this product.');
        if (cancelled) return;

        // NOTE: field names assumed from the GET response — double check these
        // against your actual /api/admin/products/[id] route handler.
        setInitial({
          name: data.name ?? '',
          description: data.description ?? '',
          // Show the category name as the displayed meat type label (do not use the stored enum directly)
          meatType: data.category ?? data.categoryRef?.name ?? '',
          categoryId: data.categoryId ?? data.category?.id ?? '',
          basePrice: data.basePrice != null ? String(data.basePrice) : '',
          stock: data.stock != null ? String(data.stock) : '',
          unit: data.unit ?? 'kg',
          reorderPoint: data.reorderPoint != null ? String(data.reorderPoint) : '',
          locationId: data.locationId ?? '',
          tags: toCsv(data.tags),
          preparations: toCsv(data.preparations),
          isNewArrival: Boolean(data.isNewArrival),
          isBestSeller: Boolean(data.isBestSeller),
          sameDayDelivery: Boolean(data.sameDayDelivery),
        });
        setInitialImages(data.images ?? []);
      } catch (err) {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : 'Could not load this product.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadProduct();
    return () => {
      cancelled = true;
    };
  }, [mode, productId]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 px-3 py-6 sm:items-center sm:px-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="max-h-[calc(100vh-3rem)] w-full max-w-[640px] overflow-y-auto rounded-[14px] bg-white shadow-[0_12px_40px_rgba(0,0,0,0.18)]">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#eceae7] bg-white px-4 py-3">
          <h2 className="text-[13px] leading-4 font-semibold tracking-[-0.2px] text-[#292929]">{mode === 'create' ? 'Add product' : 'Edit product'}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="flex h-6 w-6 items-center justify-center rounded-md text-[#8c8984] transition hover:bg-[#f4f3f1] hover:text-[#333]">
            <X size={14} strokeWidth={1.8} />
          </button>
        </div>

        <div className="p-4 sm:p-5">
          {mode === 'edit' && loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={20} className="animate-spin text-[#99958f]" />
            </div>
          ) : mode === 'edit' && loadError ? (
            <div className="rounded-[10px] border border-[#f2652a4d] bg-[#fff4ee] px-3 py-2 text-[11px] text-[#c4491d]">{loadError}</div>
          ) : (
            <ProductForm mode={mode} productId={productId} initial={initial} initialImages={initialImages} onSuccess={onSaved} onCancel={onClose} />
          )}
        </div>
      </div>
    </div>
  );
}
