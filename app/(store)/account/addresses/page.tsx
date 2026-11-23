'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import LocationPicker from '@/components/map/location-picker';
import { findDeliveryZone } from '@/lib/delivery-geometry';
import Link from 'next/link';
import {
  ArrowLeft,
  MapPin,
  Plus,
  Pencil,
  Trash2,
  Home,
  BriefcaseBusiness,
  MapPinned,
  Phone,
  CheckCircle2,
  Star,
  RefreshCw,
  AlertCircle,
  X,
  Save,
  Navigation,
} from 'lucide-react';

type Address = {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string | null;
  area: string;
  city: string;
  state: string;
  postalCode?: string | null;
  instructions?: string | null;
  isDefault: boolean;
  latitude?: number | null;
  longitude?: number | null;
  deliveryZoneId?: string | null;
};

type Form = Omit<Address, 'id'>;

type DeliveryZone = {
  id: string;
  name: string;
  city: string;
  state: string;
  deliveryFeeCents: number;
  latitude?: number | null;
  longitude?: number | null;
  radiusMeters?: number | null;
};

const findZone = findDeliveryZone;

function money(cents: number) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

const blank: Form = {
  label: 'Home',
  fullName: '',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  area: '',
  city: 'Abeokuta',
  state: 'Ogun',
  postalCode: '',
  instructions: '',
  isDefault: false,
  latitude: null,
  longitude: null,
  deliveryZoneId: null,
};

const PRESET_LABELS = ['Home', 'Office'];

const inputClass =
  'w-full rounded-lg border border-[#e8e2d9] bg-white px-3.5 py-2.5 text-[11px] font-medium text-[#393129] outline-none transition placeholder:font-normal placeholder:text-[#b1aaa0] focus:border-[#b18a61] focus:ring-2 focus:ring-[#b18a61]/10';

const labelClass = 'mb-1.5 block text-[10px] font-bold text-[#62594f]';

function getAddressIcon(label: string) {
  const value = label.toLowerCase();

  if (value.includes('home')) return Home;
  if (value.includes('office') || value.includes('work')) {
    return BriefcaseBusiness;
  }

  return MapPinned;
}

export default function AddressesPage() {
  const [items, setItems] = useState<Address[]>([]);
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [form, setForm] = useState<Form>(blank);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/account/addresses', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
        headers: { Accept: 'application/json' },
      });

      const data = await response.json().catch(() => ({}));

      if (response.status === 401) {
        window.location.href = `/sign-in?returnTo=${encodeURIComponent('/account/addresses')}`;
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || 'Unable to load addresses.');
      }

      setItems(Array.isArray(data.addresses) ? data.addresses : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load addresses.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();

    fetch('/api/delivery/zones', { cache: 'no-store' })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => setZones(Array.isArray(data?.zones) ? data.zones : []))
      .catch(() => setZones([]));
  }, [load]);

  function updateField<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function resetForm() {
    setEditingId(null);
    setForm(blank);
    setError('');
    setSuccess('');
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (busy) return;

    setBusy(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(
        editingId ? `/api/account/addresses/${editingId}` : '/api/account/addresses',
        {
          method: editingId ? 'PATCH' : 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(form),
        },
      );

      const data = await response.json().catch(() => ({}));

      if (response.status === 401) {
        window.location.href = `/sign-in?returnTo=${encodeURIComponent('/account/addresses')}`;
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || 'Unable to save address.');
      }

      setSuccess(
        editingId
          ? 'Your delivery address has been updated.'
          : 'Your delivery address has been saved.',
      );

      setForm(blank);
      setEditingId(null);

      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save address.');
    } finally {
      setBusy(false);
    }
  }

  function edit(address: Address) {
    setEditingId(address.id);

    setForm({
      label: address.label,
      fullName: address.fullName,
      phone: address.phone,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 ?? '',
      area: address.area,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode ?? '',
      instructions: address.instructions ?? '',
      isDefault: address.isDefault,
      latitude: address.latitude ?? null,
      longitude: address.longitude ?? null,
      deliveryZoneId: address.deliveryZoneId ?? null,
    });

    setError('');
    setSuccess('');

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function remove(id: string) {
    if (!window.confirm('Are you sure you want to delete this address?')) {
      return;
    }

    setDeletingId(id);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/account/addresses/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { Accept: 'application/json' },
      });

      const data = await response.json().catch(() => ({}));

      if (response.status === 401) {
        window.location.href = `/sign-in?returnTo=${encodeURIComponent('/account/addresses')}`;
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || 'Unable to delete address.');
      }

      if (editingId === id) resetForm();

      setSuccess('Address deleted successfully.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete address.');
    } finally {
      setDeletingId(null);
    }
  }

  function selectAddressPoint(point: { latitude: number; longitude: number }) {
    const zone = findZone(point, zones);

    setForm((current) => ({
      ...current,
      latitude: point.latitude,
      longitude: point.longitude,
      deliveryZoneId: zone?.id ?? null,
      ...(zone ? { area: zone.name, city: zone.city, state: zone.state } : {}),
    }));
  }

  const hasPin = form.latitude != null && form.longitude != null;
  const selectedMapZone = zones.find((zone) => zone.id === form.deliveryZoneId) ?? findZone(form, zones);
  const isOtherLabel = !PRESET_LABELS.includes(form.label);

  const fields: Array<{
    key: keyof Form;
    label: string;
    placeholder: string;
    required?: boolean;
    wide?: boolean;
    type?: string;
    id?: string;
  }> = [
    {
      key: 'fullName',
      label: 'Recipient full name',
      placeholder: 'Enter recipient name',
      required: true,
      id: 'address-recipient',
    },
    {
      key: 'phone',
      label: 'Phone number',
      placeholder: 'e.g. 08012345678',
      required: true,
      type: 'tel',
    },
    {
      key: 'addressLine1',
      label: 'Street address',
      placeholder: 'House number and street name',
      required: true,
      wide: true,
    },
    {
      key: 'addressLine2',
      label: 'Apartment / landmark',
      placeholder: 'Flat number, building or nearby landmark',
      wide: true,
    },
    {
      key: 'area',
      label: 'Area / neighbourhood',
      placeholder: 'e.g. Kuto, Ibara, Oke-Ilewo',
      required: true,
    },
    {
      key: 'city',
      label: 'City',
      placeholder: 'Enter city',
      required: true,
    },
    {
      key: 'state',
      label: 'State',
      placeholder: 'Enter state',
      required: true,
    },
    {
      key: 'postalCode',
      label: 'Postal code',
      placeholder: 'Optional',
    },
  ];

  return (
    <main className="min-h-screen bg-[#faf9f6] px-4 py-7 text-[#29241f] sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl">
        {}
        <Link
          href="/account"
          className="mb-6 inline-flex items-center gap-2 text-[11px] font-semibold text-[#82796e] transition hover:text-[#986735]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to account
        </Link>

        {}
        <header className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#a17443]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#a17443]" />
              ChunkNChop account
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-[#28231e] sm:text-[28px]">
              Delivery addresses
            </h1>

            <p className="mt-1.5 text-[12px] text-[#89837b]">
              Save and manage your delivery locations for a faster checkout.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-[#eae5dc] bg-white px-3.5 py-2.5">
            <MapPin className="h-4 w-4 text-[#a17443]" />
            <span className="text-[10px] font-semibold text-[#6e655a]">
              {items.length} saved {items.length === 1 ? 'address' : 'addresses'}
            </span>
          </div>
        </header>

        {}
        {error && (
          <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-[11px] text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p className="flex-1">{error}</p>
            <button type="button" onClick={() => setError('')} aria-label="Dismiss error">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {success && (
          <div className="mb-5 flex items-center gap-2.5 rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-[11px] text-emerald-700">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <p className="flex-1">{success}</p>
            <button
              type="button"
              onClick={() => setSuccess('')}
              aria-label="Dismiss success message"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="grid items-start gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          {}
          <section className="overflow-hidden rounded-xl border border-[#eae5dc] bg-white shadow-[0_3px_15px_rgba(40,30,20,0.025)]">
            <div className="flex items-center justify-between border-b border-[#f0ece6] px-5 py-4 sm:px-6">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#f7f1e9] text-[#986735]">
                  {editingId ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                </div>

                <div>
                  <h2 className="text-[13px] font-bold text-[#302a24]">
                    {editingId ? 'Edit address' : 'Add a new address'}
                  </h2>
                  <p className="mt-0.5 text-[10px] text-[#928b82]">
                    {editingId
                      ? 'Update your saved delivery details.'
                      : 'Enter the details of your delivery location.'}
                  </p>
                </div>
              </div>

              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-[#91877c] hover:text-[#302a24]"
                >
                  <X className="h-3.5 w-3.5" />
                  Cancel
                </button>
              )}
            </div>

            <form onSubmit={submit} className="space-y-5 p-5 sm:p-6">
              {}
              <div>
                <label className={labelClass}>Address label</label>

                <div className="grid grid-cols-3 gap-2">
                  {['Home', 'Office', 'Other'].map((label) => {
                    const selected = label === 'Other' ? isOtherLabel : form.label === label;
                    const Icon =
                      label === 'Home' ? Home : label === 'Office' ? BriefcaseBusiness : MapPinned;

                    return (
                      <button
                        key={label}
                        type="button"
                        onClick={() => {
                          if (label === 'Other') {
                            if (!isOtherLabel) updateField('label', '');
                          } else {
                            updateField('label', label);
                          }
                        }}
                        className={`flex items-center justify-center gap-2 rounded-lg border px-2 py-2.5 text-[10px] font-semibold transition ${
                          selected
                            ? 'border-[#c5a27d] bg-[#faf5ee] text-[#875d35]'
                            : 'border-[#eae5dc] bg-white text-[#81796f] hover:border-[#d5c4ae]'
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {label}
                      </button>
                    );
                  })}
                </div>

                {isOtherLabel && (
                  <input
                    value={form.label}
                    onChange={(e) => updateField('label', e.target.value)}
                    className={`${inputClass} mt-2`}
                    placeholder="Enter address label"
                    maxLength={30}
                    required
                  />
                )}
              </div>

              {}
              <div className="grid gap-3.5 sm:grid-cols-2">
                {fields.map((field) => (
                  <div key={field.key} className={field.wide ? 'sm:col-span-2' : ''}>
                    <label className={labelClass}>
                      {field.label}
                      {field.required && <span className="ml-1 text-red-500">*</span>}
                    </label>

                    <input
                      id={field.id}
                      type={field.type || 'text'}
                      required={field.required}
                      value={String(form[field.key] ?? '')}
                      placeholder={field.placeholder}
                      onChange={(e) => updateField(field.key, e.target.value)}
                      className={inputClass}
                    />
                  </div>
                ))}
              </div>

              {}
              <div>
                <label className={labelClass}>Delivery zone</label>
                <select
                  value={form.deliveryZoneId ?? selectedMapZone?.id ?? ''}
                  onChange={(event) => {
                    const zone = zones.find((item) => item.id === event.target.value);
                    setForm((current) => ({
                      ...current,
                      deliveryZoneId: zone?.id ?? null,
                      ...(zone ? { area: zone.name, city: zone.city, state: zone.state, latitude: zone.latitude ?? null, longitude: zone.longitude ?? null } : {}),
                    }));
                  }}
                  className={inputClass}
                >
                  <option value="">Choose a delivery zone or use the map</option>
                  {zones.map((zone) => (
                    <option key={zone.id} value={zone.id}>
                      {zone.name} — {zone.city}, {zone.state} ({money(zone.deliveryFeeCents)})
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[10px] text-[#928b82]">Selecting a zone fills the area and zone center. You can fine-tune your pin below.</p>
              </div>

              <div className="space-y-2 rounded-xl border border-[#eee8df] bg-[#fdfbf8] p-3.5">
                <div>
                  <p className="text-[11px] font-bold text-[#51483e]">
                    Pin your exact delivery location
                  </p>
                  <p className="mt-1 text-[10px] text-[#928b82]">
                    Search for a street or landmark, or tap the map to place the pin.
                  </p>
                </div>

                <LocationPicker
                  value={
                    form.latitude != null && form.longitude != null
                      ? { latitude: form.latitude, longitude: form.longitude }
                      : null
                  }
                  onChange={selectAddressPoint}
                />

                <p className="text-[10px] font-semibold text-[#77736d]">
                  {selectedMapZone
                    ? `Delivery fee: ${money(selectedMapZone.deliveryFeeCents)} (${selectedMapZone.name})`
                    : hasPin
                      ? 'No price set yet for this location.'
                      : 'Select a location to see its delivery price.'}
                </p>
              </div>

              {}
              <div>
                <label className={labelClass}>
                  Delivery instructions
                  <span className="ml-1 font-normal text-[#aaa198]">(Optional)</span>
                </label>

                <textarea
                  rows={3}
                  maxLength={500}
                  value={form.instructions ?? ''}
                  onChange={(e) => updateField('instructions', e.target.value)}
                  placeholder="E.g. Call when you arrive, use the second gate..."
                  className={`${inputClass} resize-y`}
                />

                <p className="mt-1 text-right text-[9px] text-[#aaa198]">
                  {(form.instructions ?? '').length}/500
                </p>
              </div>

              {}
              <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-[#eee8df] bg-[#fdfbf8] p-3.5">
                <input
                  type="checkbox"
                  checked={form.isDefault}
                  onChange={(e) => updateField('isDefault', e.target.checked)}
                  className="mt-0.5 h-3.5 w-3.5 accent-[#986735]"
                />

                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5 text-[11px] font-bold text-[#51483e]">
                    <Star className="h-3.5 w-3.5 text-[#a17443]" />
                    Make this my default address
                  </span>
                  <span className="mt-1 block text-[10px] leading-5 text-[#928b82]">
                    Use this address as your preferred delivery location.
                  </span>
                </span>
              </label>

              {}
              <div className="flex flex-col gap-2 border-t border-[#f0ece6] pt-4 sm:flex-row">
                <button
                  type="submit"
                  disabled={busy}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#29231e] px-5 py-3 text-[11px] font-bold text-white transition hover:bg-[#493b2d] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {busy ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Save className="h-3.5 w-3.5" />
                  )}
                  {busy ? 'Saving address...' : editingId ? 'Update address' : 'Save address'}
                </button>

                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    disabled={busy}
                    className="rounded-lg border border-[#e8e2d9] px-5 py-3 text-[11px] font-semibold text-[#6e655a] transition hover:bg-[#faf8f4] disabled:opacity-50"
                  >
                    Cancel editing
                  </button>
                )}
              </div>
            </form>
          </section>

          {}
          <section>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-[14px] font-bold text-[#302a24]">Saved addresses</h2>
                <p className="mt-1 text-[10px] text-[#928b82]">
                  Your available delivery locations.
                </p>
              </div>

              <button
                type="button"
                onClick={() => void load()}
                disabled={loading}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#eae5dc] bg-white text-[#81796f] transition hover:bg-[#f7f4ef] disabled:opacity-50"
                aria-label="Refresh addresses"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-[#eae5dc] bg-white px-5 py-14 text-center">
                <RefreshCw className="h-5 w-5 animate-spin text-[#a17443]" />
                <p className="mt-3 text-[11px] font-semibold text-[#746b61]">
                  Loading saved addresses...
                </p>
              </div>
            ) : items.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#ddd4c8] bg-white px-5 py-12 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#f7f1e9] text-[#a17443]">
                  <MapPin className="h-5 w-5" />
                </div>

                <h3 className="mt-4 text-[12px] font-bold text-[#393129]">
                  No saved addresses yet
                </h3>

                <p className="mx-auto mt-1.5 max-w-[230px] text-[10px] leading-5 text-[#928b82]">
                  Add your home or office address to make your next order easier.
                </p>

                <button
                  type="button"
                  onClick={() => document.getElementById('address-recipient')?.focus()}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#29231e] px-4 py-2.5 text-[10px] font-bold text-white"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add first address
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((address) => {
                  const Icon = getAddressIcon(address.label);

                  return (
                    <article
                      key={address.id}
                      className={`rounded-xl border bg-white p-4 transition ${
                        address.isDefault
                          ? 'border-[#d9c3a8] shadow-[0_3px_12px_rgba(40,30,20,0.035)]'
                          : 'border-[#eae5dc]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-2.5">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#f7f1e9] text-[#986735]">
                            <Icon className="h-4 w-4" />
                          </div>

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-[11px] font-bold text-[#393129]">
                                {address.label}
                              </h3>

                              {address.isDefault && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[8px] font-bold text-emerald-700">
                                  <CheckCircle2 className="h-2.5 w-2.5" />
                                  DEFAULT
                                </span>
                              )}
                            </div>

                            <p className="mt-0.5 text-[9px] text-[#a0988d]">Delivery location</p>
                          </div>
                        </div>

                        <div className="flex shrink-0 gap-1.5">
                          <button
                            type="button"
                            onClick={() => edit(address)}
                            aria-label={`Edit ${address.label} address`}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#eee8df] text-[#81796f] transition hover:border-[#c9aa86] hover:bg-[#faf7f2] hover:text-[#986735]"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => void remove(address.id)}
                            disabled={deletingId === address.id}
                            aria-label={`Delete ${address.label} address`}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-100 text-red-500 transition hover:bg-red-50 disabled:opacity-50"
                          >
                            {deletingId === address.id ? (
                              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="mt-4 border-t border-[#f1ede7] pt-3">
                        <p className="text-[11px] font-bold text-[#51483e]">{address.fullName}</p>

                        <p className="mt-1 flex items-center gap-1.5 text-[10px] text-[#89837b]">
                          <Phone className="h-3 w-3" />
                          {address.phone}
                        </p>

                        <p className="mt-2 flex items-start gap-1.5 text-[10px] leading-[1.8] text-[#71685e]">
                          <Navigation className="mt-0.5 h-3 w-3 shrink-0 text-[#a17443]" />
                          <span>
                            {[
                              address.addressLine1,
                              address.addressLine2,
                              address.area,
                              address.city,
                              address.state,
                              address.postalCode,
                            ]
                              .filter(Boolean)
                              .join(', ')}
                          </span>
                        </p>

                        {address.instructions && (
                          <p className="mt-2 text-[9px] leading-5 text-[#999187]">
                            <span className="font-bold">Instructions:</span> {address.instructions}
                          </p>
                        )}
                      </div>

                      {editingId === address.id && (
                        <div className="mt-3 rounded-md bg-[#faf5ee] px-3 py-2 text-[9px] font-semibold text-[#986735]">
                          You are currently editing this address.
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {}
        <footer className="mt-9 flex flex-col justify-between gap-3 border-t border-[#eae5dc] pt-5 text-[10px] text-[#999187] sm:flex-row sm:items-center">
          <p>
            <span className="font-bold text-[#766b5e]">ChunkNChop</span> — Good food, delivered.
          </p>

          <Link href="/" className="font-semibold text-[#8a6745] transition hover:text-[#51371e]">
            Continue shopping →
          </Link>
        </footer>
      </div>
    </main>
  );
}
