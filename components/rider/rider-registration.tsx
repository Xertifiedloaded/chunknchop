'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ImagePlus, Loader2, X } from 'lucide-react';

type Zone = { id: string; name: string; city: string; state?: string | null };

export type RiderFormInitial = Partial<{
  phone: string;
  residentialAddress: string;
  vehicleType: string;
  vehicleBrand: string | null;
  vehicleModel: string | null;
  vehicleColor: string;
  plateNumber: string;
  licenseNumber: string | null;
  photoUrl: string | null;
  licenseImageUrl: string | null;
  zoneIds: string[];
}>;

const LABELS: Record<string, string> = {
  phone: 'Phone number',
  residentialAddress: 'Residential address',
  vehicleBrand: 'Vehicle brand',
  vehicleModel: 'Vehicle model',
  vehicleColor: 'Vehicle colour',
  plateNumber: 'Plate number',
  licenseNumber: 'Licence number',
};
const IMAGE_KEYS = ['photoUrl', 'licenseImageUrl'] as const;
const ALL_KEYS = [...Object.keys(LABELS), ...IMAGE_KEYS];
const REQUIRED = ['phone', 'residentialAddress', 'vehicleColor', 'plateNumber'];

function ImageField({
  label,
  hint,
  value,
  onChange,
  onUploading,
  onError,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (url: string) => void;
  onUploading: (busy: boolean) => void;
  onError: (message: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState('');
  const [broken, setBroken] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setBroken(false), [value]);

  async function pick(file: File | undefined) {
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type))
      return onError('Only JPG, PNG or WebP images are allowed');
    if (file.size > 5 * 1024 * 1024) return onError('Image must be smaller than 5 MB');
    onError('');
    const local = URL.createObjectURL(file);
    setPreview(local);
    setBusy(true);
    onUploading(true);
    try {
      const body = new FormData();
      body.set('file', file);
      const r = await fetch('/api/rider/upload', { method: 'POST', credentials: 'include', body });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.url) {
        setPreview('');
        onError(d.error ?? 'Upload failed. Please try again.');
        return;
      }
      onChange(d.url);
      setPreview('');
    } catch {
      setPreview('');
      onError('Network error while uploading. Please try again.');
    } finally {
      URL.revokeObjectURL(local);
      setBusy(false);
      onUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  const shown = preview || value;

  return (
    <div className="grid gap-2 text-[11px] font-semibold text-[#51483e]">
      <span>{label}</span>
      <div className="flex items-start gap-3">
        <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-dashed border-[#e4ddd2] bg-[#faf9f6] text-[#b8afa4]">
          {shown && !broken ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={shown}
              alt={`${label} preview`}
              className="h-full w-full object-cover"
              onError={() => setBroken(true)}
            />
          ) : (
            <ImagePlus className="h-6 w-6" />
          )}
          {busy && (
            <span className="absolute inset-0 flex items-center justify-center bg-white/70">
              <Loader2 className="h-5 w-5 animate-spin text-[#986735]" />
            </span>
          )}
        </div>
        <div className="grid min-w-0 flex-1 gap-2">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
              className="rounded-lg border border-[#e9e4dc] px-3 py-2 text-[11px] font-semibold text-[#51483e] hover:bg-[#faf7f2] disabled:opacity-50"
            >
              {busy ? 'Uploading…' : value ? 'Replace image' : 'Upload image'}
            </button>
            {value && !busy && (
              <button
                type="button"
                onClick={() => onChange('')}
                className="rounded-lg px-3 py-2 text-[11px] font-semibold text-red-600 hover:bg-red-50"
              >
                Remove
              </button>
            )}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => void pick(e.target.files?.[0])}
          />
          <input
            type="url"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="…or paste an image link (https://)"
            className="rounded-lg border border-[#e4ddd2] px-3 py-2 text-[11px] font-normal"
          />
          <span className="text-[10px] font-normal text-[#928b82]">{hint}</span>
        </div>
      </div>
    </div>
  );
}

export default function RiderRegisterModal({
  open,
  onClose,
  onSuccess,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initial?: RiderFormInitial | null;
}) {
  const [zones, setZones] = useState<Zone[]>([]);
  const [zoneIds, setZoneIds] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [vehicleType, setVehicleType] = useState('motorcycle');
  const [f, setF] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const isUploading = Object.values(uploading).some(Boolean);
  const firstField = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setError('');
    setUploading({});
    setVehicleType(initial?.vehicleType ?? 'motorcycle');
    setZoneIds(initial?.zoneIds ?? []);
    setF(
      Object.fromEntries(
        ALL_KEYS.map((k) => [k, ((initial as Record<string, unknown>)?.[k] as string) ?? '']),
      ),
    );
    fetch('/api/delivery/zones')
      .then((r) => r.json())
      .then((d) => setZones(d.zones ?? []))
      .catch(() => setError('Unable to load delivery zones'));
    setTimeout(() => firstField.current?.focus(), 0);
  }, [open, initial]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !busy && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, busy, onClose]);

  if (!open) return null;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const payload = Object.fromEntries(Object.entries(f).filter(([, v]) => v.trim() !== ''));
      const r = await fetch('/api/rider/register', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, vehicleType, zoneIds }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        setError(d.error ?? 'Unable to submit application');
        return;
      }
      onSuccess();
      onClose();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  const input = 'rounded-lg border border-[#e4ddd2] px-3 py-2.5 text-[12px] font-normal';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="rider-register-title"
        className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl sm:rounded-2xl"
      >
        <div className="flex items-start justify-between border-b border-[#f0ece6] px-5 py-4 sm:px-6">
          <div>
            <h2 id="rider-register-title" className="text-[16px] font-bold text-[#28231e]">
              {initial?.phone ? 'Edit rider details' : 'Rider registration'}
            </h2>
            <p className="mt-1 text-[11px] text-[#89837b]">
              {initial?.phone
                ? 'Saving sends your details back for administrator approval.'
                : 'Submit your details for administrator verification.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Close"
            className="rounded-lg p-1.5 text-[#89837b] hover:bg-[#f7f4ef]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <div className="grid gap-4 overflow-y-auto px-5 py-5 sm:grid-cols-2 sm:px-6">
            {Object.keys(LABELS).map((key, i) => (
              <label key={key} className="grid gap-1 text-[11px] font-semibold text-[#51483e]">
                {LABELS[key]}
                {REQUIRED.includes(key) && <span className="sr-only"> (required)</span>}
                <input
                  ref={i === 0 ? firstField : undefined}
                  type={key === 'phone' ? 'tel' : 'text'}
                  required={REQUIRED.includes(key)}
                  value={f[key] ?? ''}
                  onChange={(e) => setF((prev) => ({ ...prev, [key]: e.target.value }))}
                  className={input}
                />
              </label>
            ))}
            <label className="grid gap-1 text-[11px] font-semibold text-[#51483e]">
              Vehicle type
              <select
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
                className={input}
              >
                <option value="motorcycle">Motorcycle</option>
                <option value="car">Car</option>
                <option value="van">Van</option>
                <option value="other">Other</option>
              </select>
            </label>

            <div className="sm:col-span-2 grid gap-4 sm:grid-cols-2">
              <ImageField
                label="Your photo"
                hint="JPG, PNG or WebP, up to 5 MB."
                value={f.photoUrl ?? ''}
                onChange={(url) => setF((prev) => ({ ...prev, photoUrl: url }))}
                onUploading={(b) => setUploading((u) => ({ ...u, photoUrl: b }))}
                onError={setError}
              />
              <ImageField
                label="Licence image"
                hint="A clear photo of your driver's licence."
                value={f.licenseImageUrl ?? ''}
                onChange={(url) => setF((prev) => ({ ...prev, licenseImageUrl: url }))}
                onUploading={(b) => setUploading((u) => ({ ...u, licenseImageUrl: b }))}
                onError={setError}
              />
            </div>

            <fieldset className="sm:col-span-2">
              <legend className="mb-2 text-[11px] font-semibold text-[#51483e]">
                Delivery zones you can serve
              </legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {zones.map((z) => (
                  <label key={z.id} className="flex gap-2 text-[12px]">
                    <input
                      type="checkbox"
                      checked={zoneIds.includes(z.id)}
                      onChange={(e) =>
                        setZoneIds(
                          e.target.checked ? [...zoneIds, z.id] : zoneIds.filter((x) => x !== z.id),
                        )
                      }
                    />
                    {z.name}, {z.city}
                  </label>
                ))}
                {!zones.length && !error && (
                  <p className="text-[11px] text-[#928b82]">Loading zones…</p>
                )}
              </div>
            </fieldset>
          </div>

          <div className="flex flex-col gap-3 border-t border-[#f0ece6] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p role="alert" className="min-h-4 text-[11px] text-red-600">
              {error}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={busy}
                className="rounded-lg border border-[#e9e4dc] px-4 py-2.5 text-[11px] font-semibold text-[#51483e]"
              >
                Cancel
              </button>
              <button
                disabled={busy || isUploading || !zoneIds.length}
                className="rounded-lg bg-[#29231e] px-4 py-2.5 text-[11px] font-semibold text-white disabled:opacity-50"
              >
                {busy ? 'Submitting…' : initial?.phone ? 'Save & resubmit' : 'Submit application'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
