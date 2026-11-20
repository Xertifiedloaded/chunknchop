'use client';

import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import {
  Check,
  LoaderCircle,
  MapPin,
  Pencil,
  Plus,
  Search,
  Sun,
  CloudSun,
  Moon,
  Trash2,
  X,
} from 'lucide-react';

import { formatPrice } from '@/lib/catalog';
import LocationPicker from '@/components/map/location-picker';

const ZONES_API = '/api/admin/delivery/zones';
const SCHEDULES_API = '/api/admin/delivery/schedules';

const TZ = 'Africa/Lagos';
const UTC_OFFSET = '+01:00';

type Zone = {
  id: string;
  name: string;
  city: string;
  state: string;
  deliveryFeeCents: number;
  active: boolean;
  latitude?: number | null;
  longitude?: number | null;
  radiusMeters?: number | null;
  _count?: { riders: number };
};

type Schedule = {
  id: string;
  zoneId: string;
  startsAt: string;
  endsAt: string;
  capacity: number;
  bookedCount: number;
  active: boolean;
  zone?: { id: string; name: string; city: string; state: string };
};

type Notice = { kind: 'success' | 'error'; text: string };
type Notify = (kind: Notice['kind'], text: string) => void;

type ApiErrorBody = {
  error?: string;
  issues?: { fieldErrors?: Record<string, string[] | undefined> };
};

const card = 'border border-[#eae7e1] bg-white';

const primaryButton =
  'inline-flex min-h-9 items-center justify-center gap-2 bg-brand px-4 py-2 text-[11px] font-semibold text-white transition-colors hover:bg-[#a9442c] disabled:cursor-not-allowed disabled:opacity-50';

const secondaryButton =
  'inline-flex min-h-9 items-center justify-center gap-2 border border-[#e9e6df] bg-white px-4 py-2 text-[11px] font-semibold text-[#24231f] transition-colors hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-50';

const iconButton =
  'inline-flex h-8 w-8 cursor-pointer items-center justify-center border border-transparent bg-transparent text-[#77736d] transition-colors hover:border-[#e9e6df] hover:text-brand disabled:cursor-not-allowed disabled:opacity-40';

const inputClass =
  'w-full min-w-0 border border-[#e9e6df] bg-white px-3 py-2.5 text-[12px] leading-5 text-[#24231f] outline-none transition-colors placeholder:text-[#aaa69e] focus:border-brand focus:ring-2 focus:ring-brand/10 disabled:bg-[#f8f8f6] disabled:text-[#88847d]';

const labelClass = 'flex min-w-0 flex-col gap-1.5 text-[11px] font-semibold text-[#5c5851]';

const th = 'px-3 py-2.5 text-left text-[11px] font-semibold text-[#88847d]';
const td = 'px-3 py-3 align-middle text-[12px] text-[#24231f]';

function firstFieldError(fields?: Record<string, string[] | undefined>) {
  if (!fields) return undefined;

  for (const [key, value] of Object.entries(fields)) {
    if (value?.[0]) return `${key}: ${value[0]}`;
  }

  return undefined;
}

async function request<T = unknown>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    credentials: 'include',
    cache: 'no-store',
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const body = data as ApiErrorBody | null;
    const detail = firstFieldError(body?.issues?.fieldErrors);
    const message = body?.error || 'Something went wrong. Try again.';

    throw new Error(detail ? `${message} (${detail})` : message);
  }

  return data as T;
}

function errorText(err: unknown) {
  return err instanceof Error ? err.message : 'Something went wrong. Try again.';
}

const dateKey = new Intl.DateTimeFormat('en-CA', {
  timeZone: TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const timeKey = new Intl.DateTimeFormat('en-GB', {
  timeZone: TZ,
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

function lagosDate(value: Date | string) {
  return dateKey.format(new Date(value));
}

function lagosTime(value: Date | string) {
  return timeKey.format(new Date(value));
}

function toIso(date: string, time: string) {
  return new Date(`${date}T${time}:00${UTC_OFFSET}`).toISOString();
}

function addDays(date: string, days: number) {
  const [year, month, day] = date.split('-').map(Number);

  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

function formatDay(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: TZ,
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-NG', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: TZ,
  });
}

function Switch({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-0 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? 'bg-brand' : 'bg-[#d6d2c9]'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-[18px]' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}

function Spinner({ size = 14 }: { size?: number }) {
  return <LoaderCircle size={size} className="animate-spin" aria-hidden="true" />;
}

function EmptyState({ title, text, action }: { title: string; text: string; action?: ReactNode }) {
  return (
    <div className={`${card} flex flex-col items-center px-6 py-10 text-center`}>
      <h3 className="m-0 font-heading text-base font-semibold">{title}</h3>
      <p className="mt-1.5 mb-0 max-w-md text-[12px] leading-5 text-[#77736d]">{text}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

function FormShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <section className={`${card} p-4 sm:p-5`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="m-0 font-heading text-base font-semibold">{title}</h3>

        <button type="button" onClick={onClose} aria-label="Close form" className={iconButton}>
          <X size={15} />
        </button>
      </div>

      {children}
    </section>
  );
}

function FormError({ children }: { children: ReactNode }) {
  return (
    <p
      role="alert"
      className="border border-red-200 bg-red-50 px-3 py-2.5 text-[12px] leading-5 text-red-700"
    >
      {children}
    </p>
  );
}

function ZoneForm({
  zone,
  onClose,
  onSaved,
}: {
  zone?: Zone;
  onClose: () => void;
  onSaved: (text: string) => void;
}) {
  const [name, setName] = useState(zone?.name ?? '');
  const [city, setCity] = useState(zone?.city ?? '');
  const [state, setState] = useState(zone?.state ?? '');
  const [fee, setFee] = useState(zone ? String(zone.deliveryFeeCents / 100) : '');
  const [active, setActive] = useState(zone?.active ?? true);
  const [latitude, setLatitude] = useState<number | null>(zone?.latitude ?? null);
  const [longitude, setLongitude] = useState<number | null>(zone?.longitude ?? null);
  const [radiusMeters, setRadiusMeters] = useState(String(zone?.radiusMeters ?? 1000));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault();

    const feeNaira = Number(fee);

    if (name.trim().length < 2 || city.trim().length < 2 || state.trim().length < 2) {
      setError('Enter a zone name, city and state, at least 2 characters each.');
      return;
    }

    if (latitude === null || longitude === null) {
      setError('Select the zone location on the map.');
      return;
    }

    const radius = Number(radiusMeters);
    if (!Number.isFinite(radius) || radius < 100 || radius > 50000) {
      setError('Set a zone radius between 100 and 50,000 metres.');
      return;
    }

    if (fee.trim() === '' || !Number.isFinite(feeNaira) || feeNaira < 0) {
      setError('Enter a delivery fee of ₦0 or more.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      await request(zone ? `${ZONES_API}/${zone.id}` : ZONES_API, {
        method: zone ? 'PATCH' : 'POST',
        body: JSON.stringify({
          name: name.trim(),
          city: city.trim(),
          state: state.trim(),
          deliveryFeeCents: Math.round(feeNaira * 100),
          active,
          latitude,
          longitude,
          radiusMeters: Math.round(radius),
        }),
      });

      onSaved(zone ? 'Zone saved.' : 'Zone added.');
    } catch (err) {
      setError(errorText(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <FormShell title={zone ? `Edit ${zone.name}` : 'Add a delivery zone'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        {error && <FormError>{error}</FormError>}

        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <label className={`${labelClass} sm:col-span-2`}>
            Zone name
            <input
              className={inputClass}
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={80}
              placeholder="e.g. Kuto"
            />
          </label>

          <label className={labelClass}>
            City
            <input
              className={inputClass}
              value={city}
              onChange={(event) => setCity(event.target.value)}
              maxLength={80}
              placeholder="Abeokuta"
            />
          </label>

          <label className={labelClass}>
            State
            <input
              className={inputClass}
              value={state}
              onChange={(event) => setState(event.target.value)}
              maxLength={80}
              placeholder="Ogun State"
            />
          </label>

          <label className={labelClass}>
            Delivery fee (₦)
            <input
              className={inputClass}
              type="number"
              inputMode="decimal"
              min={0}
              max={1000000}
              step="any"
              value={fee}
              onChange={(event) => setFee(event.target.value)}
              placeholder="1500"
            />
          </label>

          <div className="sm:col-span-2 space-y-3">
            <div className={labelClass}>Delivery location / zone center</div>
            <LocationPicker
              value={latitude !== null && longitude !== null ? { latitude, longitude } : null}
              onChange={(point) => {
                setLatitude(point.latitude);
                setLongitude(point.longitude);
              }}
              radiusMeters={Number(radiusMeters) || 0}
              defaultCenter={[6.5244, 3.3792]}
            />
            <label className={labelClass}>
              Coverage radius (metres)
              <input
                className={inputClass}
                type="number"
                min={100}
                max={50000}
                step={100}
                value={radiusMeters}
                onChange={(event) => setRadiusMeters(event.target.value)}
                placeholder="1000"
              />
              <span className="text-[10px] font-normal text-[#88847d]">
                Customers within this radius will match this fee area. If areas overlap, the closest
                matching zone is used.
              </span>
            </label>
          </div>

          <div className={labelClass}>
            Availability
            <span className="flex min-h-[42px] items-center gap-3 text-[12px] font-normal text-[#5c5851]">
              <Switch checked={active} onChange={setActive} label="Zone is active" />
              {active ? 'Customers can choose this zone' : 'Hidden from checkout'}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button type="submit" disabled={saving} className={primaryButton}>
            {saving ? <Spinner size={12} /> : <Check size={13} />}
            {zone ? 'Save zone' : 'Add zone'}
          </button>

          <button type="button" onClick={onClose} className={secondaryButton}>
            Cancel
          </button>
        </div>
      </form>
    </FormShell>
  );
}

function ZonesPanel({
  zones,
  loading,
  reload,
  notify,
}: {
  zones: Zone[];
  loading: boolean;
  reload: () => Promise<void>;
  notify: Notify;
}) {
  const [query, setQuery] = useState('');
  const [editor, setEditor] = useState<{ zone?: Zone } | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();

    if (!needle) return zones;

    return zones.filter((zone) =>
      [zone.name, zone.city, zone.state].some((value) => value.toLowerCase().includes(needle)),
    );
  }, [zones, query]);

  async function toggleActive(zone: Zone, active: boolean) {
    setBusyId(zone.id);

    try {
      await request(`${ZONES_API}/${zone.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: zone.name,
          city: zone.city,
          state: zone.state,
          deliveryFeeCents: zone.deliveryFeeCents,
          active,
          ...(zone.latitude != null && zone.longitude != null
            ? {
                latitude: zone.latitude,
                longitude: zone.longitude,
                radiusMeters: zone.radiusMeters ?? 1000,
              }
            : {}),
        }),
      });

      await reload();
      notify('success', active ? `${zone.name} is now active.` : `${zone.name} is now hidden.`);
    } catch (err) {
      notify('error', errorText(err));
    } finally {
      setBusyId(null);
    }
  }

  async function remove(zone: Zone) {
    setBusyId(zone.id);

    try {
      await request(`${ZONES_API}/${zone.id}`, { method: 'DELETE' });

      setConfirmId(null);
      await reload();
      notify('success', `${zone.name} deleted.`);
    } catch (err) {
      setConfirmId(null);
      notify('error', errorText(err));
    } finally {
      setBusyId(null);
    }
  }

  const addButton = (
    <button type="button" onClick={() => setEditor({})} className={primaryButton}>
      <Plus size={13} />
      Add zone
    </button>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="relative block w-full sm:w-72">
          <span className="sr-only">Search zones</span>

          <Search
            size={14}
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[#aaa69e]"
          />

          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by zone, city or state"
            className={`${inputClass} pl-9`}
          />
        </label>

        {addButton}
      </div>

      {editor && (
        <ZoneForm
          key={editor.zone?.id ?? 'new'}
          zone={editor.zone}
          onClose={() => setEditor(null)}
          onSaved={(text) => {
            setEditor(null);
            notify('success', text);
            void reload();
          }}
        />
      )}

      {loading ? (
        <div className="flex items-center gap-2 py-6 text-[12px] text-[#77736d]">
          <Spinner />
          Loading zones…
        </div>
      ) : zones.length === 0 ? (
        <EmptyState
          title="No delivery zones yet"
          text="Add the areas you deliver to and a fee for each. Customers pick one of these at checkout."
          action={addButton}
        />
      ) : visible.length === 0 ? (
        <EmptyState
          title="No zones match your search"
          text="Check the spelling, or clear the search to see every zone."
          action={
            <button type="button" onClick={() => setQuery('')} className={secondaryButton}>
              Clear search
            </button>
          }
        />
      ) : (
        <div className={`${card} overflow-x-auto`}>
          <table className="w-full min-w-[720px] border-collapse">
            <thead>
              <tr className="border-b border-[#eae7e1]">
                <th scope="col" className={th}>
                  Zone
                </th>
                <th scope="col" className={th}>
                  City and state
                </th>
                <th scope="col" className={th}>
                  Fee
                </th>
                <th scope="col" className={th}>
                  Riders
                </th>
                <th scope="col" className={th}>
                  Active
                </th>
                <th scope="col" className={`${th} text-right`}>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>

            <tbody>
              {visible.map((zone) => {
                const busy = busyId === zone.id;
                const confirming = confirmId === zone.id;

                return (
                  <tr key={zone.id} className="border-b border-[#f0eee9] last:border-b-0">
                    <td className={td}>
                      <span className="flex items-center gap-2 font-medium">
                        <MapPin size={13} className="shrink-0 text-brand" aria-hidden="true" />
                        {zone.name}
                      </span>
                      <span className="mt-1 block text-[9px] text-[#928b82]">
                        {zone.latitude != null && zone.longitude != null
                          ? `Map pin · ${zone.radiusMeters ?? 1000}m coverage`
                          : 'Location not pinned yet'}
                      </span>
                    </td>

                    <td className={`${td} text-[#77736d]`}>
                      {zone.city}, {zone.state}
                    </td>

                    <td className={td}>{formatPrice(zone.deliveryFeeCents)}</td>

                    <td className={`${td} text-[#77736d]`}>{zone._count?.riders ?? 0}</td>

                    <td className={td}>
                      <Switch
                        checked={zone.active}
                        disabled={busy}
                        label={`${zone.name} is active`}
                        onChange={(next) => void toggleActive(zone, next)}
                      />
                    </td>

                    <td className={`${td} text-right`}>
                      {confirming ? (
                        <span className="inline-flex items-center gap-2 text-[11px]">
                          <span className="text-[#77736d]">Delete this zone?</span>

                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void remove(zone)}
                            className="inline-flex cursor-pointer items-center gap-1 border-0 bg-red-600 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                          >
                            {busy && <Spinner size={11} />}
                            Delete
                          </button>

                          <button
                            type="button"
                            onClick={() => setConfirmId(null)}
                            className="cursor-pointer border-0 bg-transparent p-0 text-[11px] font-semibold text-[#5c5851] hover:text-brand"
                          >
                            Keep
                          </button>
                        </span>
                      ) : (
                        <span className="inline-flex items-center">
                          <button
                            type="button"
                            aria-label={`Edit ${zone.name}`}
                            onClick={() => setEditor({ zone })}
                            className={iconButton}
                          >
                            <Pencil size={14} />
                          </button>

                          <button
                            type="button"
                            aria-label={`Delete ${zone.name}`}
                            onClick={() => setConfirmId(zone.id)}
                            className={`${iconButton} hover:!text-red-600`}
                          >
                            <Trash2 size={14} />
                          </button>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const DELIVERY_PERIODS = {
  morning: { label: 'Morning', startsAt: '08:00', endsAt: '11:00', icon: Sun },
  afternoon: { label: 'Afternoon', startsAt: '12:00', endsAt: '16:00', icon: CloudSun },
  evening: { label: 'Evening', startsAt: '17:00', endsAt: '20:00', icon: Moon },
} as const;
type DeliveryPeriod = keyof typeof DELIVERY_PERIODS;

function periodForTime(time: string): DeliveryPeriod {
  const hour = Number(time.slice(0, 2));
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

function ScheduleForm({
  schedule,
  zones,
  initialZoneId,
  initialPeriod,
  onClose,
  onSaved,
  onPartial,
}: {
  schedule?: Schedule;
  zones: Zone[];
  initialZoneId?: string;
  initialPeriod?: DeliveryPeriod;
  onClose: () => void;
  onSaved: (text: string) => void;
  onPartial: () => void;
}) {
  const activeZones = zones.filter((zone) => zone.active);
  const defaultPeriod =
    initialPeriod ?? (schedule ? periodForTime(lagosTime(schedule.startsAt)) : 'morning');
  const preset = DELIVERY_PERIODS[defaultPeriod];

  const [zoneId, setZoneId] = useState(
    schedule?.zoneId ?? initialZoneId ?? activeZones[0]?.id ?? '',
  );
  const [period, setPeriod] = useState<DeliveryPeriod>(defaultPeriod);
  const [date, setDate] = useState(schedule ? lagosDate(schedule.startsAt) : '');
  const [start, setStart] = useState(schedule ? lagosTime(schedule.startsAt) : preset.startsAt);
  const [end, setEnd] = useState(schedule ? lagosTime(schedule.endsAt) : preset.endsAt);
  const [capacity, setCapacity] = useState(String(schedule?.capacity ?? 10));
  const [repeat, setRepeat] = useState('1');
  const [active, setActive] = useState(schedule?.active ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function choosePeriod(nextPeriod: DeliveryPeriod) {
    setPeriod(nextPeriod);
    setStart(DELIVERY_PERIODS[nextPeriod].startsAt);
    setEnd(DELIVERY_PERIODS[nextPeriod].endsAt);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const cap = Number(capacity);
    const days = Number(repeat);

    if (!schedule && !zoneId) return setError('Choose a delivery zone.');
    if (!date || !start || !end) return setError('Choose a date, start time and end time.');
    if (end <= start) return setError('The end time must be after the start time.');
    if (new Date(toIso(date, start)) <= new Date())
      return setError('The slot must start in the future.');
    if (!Number.isInteger(cap) || cap < 1 || cap > 500)
      return setError('Capacity must be a whole number from 1 to 500.');
    if (!schedule && (!Number.isInteger(days) || days < 1 || days > 30))
      return setError('Repeat must be a whole number of days from 1 to 30.');

    setSaving(true);
    setError('');
    try {
      if (schedule) {
        await request(`${SCHEDULES_API}/${schedule.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            startsAt: toIso(date, start),
            endsAt: toIso(date, end),
            capacity: cap,
          }),
        });
        onSaved('Schedule saved.');
        return;
      }

      let created = 0;
      const skipped: string[] = [];
      for (let index = 0; index < days; index += 1) {
        const day = addDays(date, index);
        try {
          await request(SCHEDULES_API, {
            method: 'POST',
            body: JSON.stringify({
              zoneId,
              startsAt: toIso(day, start),
              endsAt: toIso(day, end),
              capacity: cap,
              active,
            }),
          });
          created += 1;
        } catch (err) {
          skipped.push(`${formatDay(toIso(day, start))}: ${errorText(err)}`);
        }
      }
      if (!skipped.length) {
        onSaved(created === 1 ? 'Schedule added.' : `${created} schedules added.`);
        return;
      }
      if (created) onPartial();
      setError(`Added ${created} of ${days}. Skipped: ${skipped.join('; ')}`);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setSaving(false);
    }
  }

  const today = lagosDate(new Date());
  return (
    <FormShell
      title={schedule ? 'Edit delivery schedule' : 'Add delivery schedule'}
      onClose={onClose}
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        {error && <FormError>{error}</FormError>}
        {!schedule && (
          <div className="space-y-2">
            <span className={labelClass}>Delivery period</span>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Choose delivery period">
              {(Object.keys(DELIVERY_PERIODS) as DeliveryPeriod[]).map((key) => {
                const item = DELIVERY_PERIODS[key];
                const Icon = item.icon;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => choosePeriod(key)}
                    aria-pressed={period === key}
                    className={`inline-flex items-center gap-2 border px-3 py-2 text-xs font-semibold ${period === key ? 'border-brand bg-brand/5 text-brand' : 'border-[#e9e6df] bg-white text-[#5c5851] hover:border-brand'}`}
                  >
                    <Icon size={14} />
                    {item.label}
                    <span className="font-normal text-[#88847d]">
                      {item.startsAt}–{item.endsAt}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          <label className={`${labelClass} sm:col-span-2`}>
            Delivery location
            {schedule ? (
              <input
                className={inputClass}
                value={
                  schedule.zone
                    ? `${schedule.zone.name}, ${schedule.zone.city}`
                    : (zones.find((z) => z.id === schedule.zoneId)?.name ?? 'Unknown location')
                }
                disabled
              />
            ) : (
              <select
                className={inputClass}
                value={zoneId}
                onChange={(e) => setZoneId(e.target.value)}
              >
                {activeZones.map((zone) => (
                  <option key={zone.id} value={zone.id}>
                    {zone.name}, {zone.city}
                  </option>
                ))}
              </select>
            )}
          </label>
          <label className={`${labelClass} sm:col-span-2`}>
            {schedule ? 'Date' : 'First date'}
            <input
              className={inputClass}
              type="date"
              min={today}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>
          <label className={labelClass}>
            Starts
            <input
              className={inputClass}
              type="time"
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
          </label>
          <label className={labelClass}>
            Ends
            <input
              className={inputClass}
              type="time"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
            />
          </label>
          <label className={labelClass}>
            Order capacity
            <input
              className={inputClass}
              type="number"
              inputMode="numeric"
              min={1}
              max={500}
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
            />
          </label>
          {!schedule && (
            <label className={labelClass}>
              Repeat for days
              <input
                className={inputClass}
                type="number"
                inputMode="numeric"
                min={1}
                max={30}
                value={repeat}
                onChange={(e) => setRepeat(e.target.value)}
              />
            </label>
          )}
          {!schedule && (
            <div className={`${labelClass} sm:col-span-2`}>
              Availability
              <span className="flex min-h-[42px] items-center gap-3 text-[12px] font-normal text-[#5c5851]">
                <Switch checked={active} onChange={setActive} label="Schedule is active" />
                {active ? 'Customers can book this schedule' : 'Save as hidden for now'}
              </span>
            </div>
          )}
        </div>
        {!schedule && Number(repeat) > 1 && (
          <p className="m-0 text-[11px] leading-5 text-[#77736d]">
            This creates the same time window on {Number(repeat)} consecutive days. Dates that
            conflict with existing schedules are skipped.
          </p>
        )}
        <p className="m-0 text-[11px] leading-5 text-[#77736d]">All times are Lagos time (WAT).</p>
        <div className="flex flex-wrap items-center gap-2.5">
          <button type="submit" disabled={saving} className={primaryButton}>
            {saving ? <Spinner size={12} /> : <Check size={13} />}
            {schedule ? 'Save schedule' : 'Add schedules'}
          </button>
          <button type="button" onClick={onClose} className={secondaryButton}>
            Cancel
          </button>
        </div>
      </form>
    </FormShell>
  );
}

function SchedulesPanel({ zones, notify }: { zones: Zone[]; notify: Notify }) {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [zoneFilter, setZoneFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState<'upcoming' | 'past' | 'all'>('upcoming');
  const [editor, setEditor] = useState<{
    schedule?: Schedule;
    zoneId?: string;
    period?: DeliveryPeriod;
  } | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const hasActiveZone = zones.some((zone) => zone.active);

  const load = useCallback(async () => {
    try {
      const data = await request<{ schedules: Schedule[] }>(SCHEDULES_API);
      setSchedules(data.schedules);
    } catch (err) {
      notify('error', errorText(err));
    } finally {
      setLoading(false);
    }
  }, [notify]);
  useEffect(() => {
    void load();
  }, [load]);

  const now = Date.now();
  const visible = useMemo(
    () =>
      schedules
        .filter((slot) => {
          if (zoneFilter !== 'all' && slot.zoneId !== zoneFilter) return false;
          const ends = new Date(slot.endsAt).getTime();
          if (timeFilter === 'upcoming') return ends > now;
          if (timeFilter === 'past') return ends <= now;
          return true;
        })
        .sort((a, b) => {
          const delta = new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime();
          return timeFilter === 'past' ? -delta : delta;
        }),
    [schedules, zoneFilter, timeFilter, now],
  );

  async function toggleActive(slot: Schedule, active: boolean) {
    setBusyId(slot.id);
    try {
      await request(`${SCHEDULES_API}/${slot.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ active }),
      });
      await load();
      notify('success', active ? 'Schedule is now bookable.' : 'Schedule hidden.');
    } catch (err) {
      notify('error', errorText(err));
    } finally {
      setBusyId(null);
    }
  }
  async function remove(slot: Schedule) {
    setBusyId(slot.id);
    try {
      await request(`${SCHEDULES_API}/${slot.id}`, { method: 'DELETE' });
      setConfirmId(null);
      await load();
      notify('success', 'Schedule deleted.');
    } catch (err) {
      setConfirmId(null);
      notify('error', errorText(err));
    } finally {
      setBusyId(null);
    }
  }

  const filters: { value: typeof timeFilter; label: string }[] = [
    { value: 'upcoming', label: 'Upcoming' },
    { value: 'past', label: 'Past' },
    { value: 'all', label: 'All' },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <label className="block">
            <span className="sr-only">Filter by delivery location</span>
            <select
              className={`${inputClass} w-auto min-w-[180px]`}
              value={zoneFilter}
              onChange={(e) => setZoneFilter(e.target.value)}
            >
              <option value="all">All locations</option>
              {zones.map((zone) => (
                <option key={zone.id} value={zone.id}>
                  {zone.name}, {zone.city}
                </option>
              ))}
            </select>
          </label>
          <div
            role="group"
            aria-label="Filter schedules by date"
            className="inline-flex border border-[#e9e6df]"
          >
            {filters.map((filter) => (
              <button
                key={filter.value}
                type="button"
                aria-pressed={timeFilter === filter.value}
                onClick={() => setTimeFilter(filter.value)}
                className={`cursor-pointer border-0 px-3.5 py-2.5 text-[11px] font-semibold transition-colors ${timeFilter === filter.value ? 'bg-[#24231f] text-white' : 'bg-white text-[#5c5851] hover:text-brand'}`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
        <button
          type="button"
          disabled={!hasActiveZone}
          onClick={() => setEditor({})}
          className={primaryButton}
        >
          <Plus size={13} />
          Add schedule
        </button>
      </div>
      {!hasActiveZone && !loading && (
        <p className="m-0 border border-amber-200 bg-amber-50 p-3 text-[12px] leading-5 text-amber-800">
          Add or activate a delivery location before creating schedules.
        </p>
      )}
      {editor && (
        <ScheduleForm
          key={`${editor.schedule?.id ?? 'new'}-${editor.zoneId ?? ''}-${editor.period ?? ''}`}
          schedule={editor.schedule}
          zones={zones}
          initialZoneId={editor.zoneId}
          initialPeriod={editor.period}
          onClose={() => setEditor(null)}
          onPartial={() => void load()}
          onSaved={(message) => {
            setEditor(null);
            notify('success', message);
            void load();
          }}
        />
      )}
      {loading ? (
        <div className="flex items-center gap-2 py-6 text-[12px] text-[#77736d]">
          <Spinner />
          Loading schedules…
        </div>
      ) : zones.length === 0 ? (
        <EmptyState
          title="No delivery locations"
          text="Add a delivery zone first, then create schedules for it."
        />
      ) : (
        <div className="space-y-8">
          {zones
            .filter((zone) => zoneFilter === 'all' || zone.id === zoneFilter)
            .map((zone) => {
              const zoneSlots = visible.filter((slot) => slot.zoneId === zone.id);
              const periods: DeliveryPeriod[] = ['morning', 'afternoon', 'evening'];
              return (
                <section key={zone.id} className="space-y-4">
                  <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e9e6df] pb-3">
                    <div className="min-w-0">
                      <h3 className="m-0 text-sm font-semibold text-[#24231f]">{zone.name}</h3>
                      <p className="m-0 mt-1 text-[11px] text-[#77736d]">
                        {zone.city}
                        {zone.state ? `, ${zone.state}` : ''} ·{' '}
                        {zone.active ? 'Active location' : 'Inactive location'}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={!zone.active}
                      onClick={() => setEditor({ zoneId: zone.id })}
                      className="inline-flex items-center gap-1.5 border-0 bg-transparent p-0 text-[11px] font-semibold text-brand hover:underline disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Plus size={13} />
                      Add schedule
                    </button>
                  </header>
                  {periods.map((period) => {
                    const preset = DELIVERY_PERIODS[period];
                    const Icon = preset.icon;
                    const items = zoneSlots.filter(
                      (slot) => periodForTime(lagosTime(slot.startsAt)) === period,
                    );
                    return (
                      <section key={period} className="space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <Icon size={14} className="text-[#77736d]" />
                            <h4 className="m-0 text-xs font-semibold">{preset.label}</h4>
                          </div>
                          <span className="text-[11px] text-[#88847d]">
                            Default {preset.startsAt}–{preset.endsAt}
                          </span>
                        </div>
                        {items.length === 0 ? (
                          <div className="py-1 text-[11px] text-[#aaa69e]">No schedules</div>
                        ) : (
                          <div className="divide-y divide-[#eeeae4]">
                            {items.map((slot) => {
                              const busy = busyId === slot.id;
                              const confirming = confirmId === slot.id;
                              const past = new Date(slot.endsAt).getTime() <= now;
                              const full = slot.capacity > 0 && slot.bookedCount >= slot.capacity;
                              const remaining = Math.max(0, slot.capacity - slot.bookedCount);
                              const percent =
                                slot.capacity > 0
                                  ? Math.min(
                                      100,
                                      Math.round((slot.bookedCount / slot.capacity) * 100),
                                    )
                                  : 0;
                              return (
                                <div
                                  key={slot.id}
                                  className={`flex flex-wrap items-center justify-between gap-3 py-3 ${past ? 'opacity-60' : ''}`}
                                >
                                  <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className="text-xs font-medium">
                                        {formatDay(slot.startsAt)}
                                      </span>
                                      <span className="text-[11px] text-[#77736d]">
                                        {formatTime(slot.startsAt)}–{formatTime(slot.endsAt)}
                                      </span>
                                      {past && (
                                        <span className="text-[10px] text-[#88847d]">Ended</span>
                                      )}
                                    </div>
                                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-[#77736d]">
                                      <span>
                                        {slot.bookedCount}/{slot.capacity} booked
                                      </span>
                                      <span>·</span>
                                      <span>{remaining} remaining</span>
                                      <span className="h-1.5 w-20 overflow-hidden bg-[#eae7e1]">
                                        <span
                                          className={`block h-full ${full ? 'bg-red-500' : 'bg-brand'}`}
                                          style={{ width: `${percent}%` }}
                                        />
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex shrink-0 items-center gap-2">
                                    {confirming ? (
                                      <div className="flex items-center gap-2 text-[11px]">
                                        <span>Delete?</span>
                                        <button
                                          type="button"
                                          disabled={busy}
                                          onClick={() => void remove(slot)}
                                          className="border-0 bg-red-600 px-2.5 py-1.5 text-[11px] font-semibold text-white disabled:opacity-50"
                                        >
                                          {busy && <Spinner size={11} />}Delete
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setConfirmId(null)}
                                          className="border-0 bg-transparent p-0 text-[11px] font-semibold text-[#77736d]"
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    ) : (
                                      <>
                                        <span
                                          className={`text-[11px] font-semibold ${slot.active ? 'text-emerald-600' : 'text-[#88847d]'}`}
                                        >
                                          {slot.active ? (full ? 'Full' : 'Active') : 'Inactive'}
                                        </span>
                                        {!past && (
                                          <Switch
                                            checked={slot.active}
                                            disabled={busy}
                                            label={`Schedule in ${zone.name} is active`}
                                            onChange={(next) => void toggleActive(slot, next)}
                                          />
                                        )}
                                        <button
                                          type="button"
                                          disabled={past}
                                          aria-label="Edit schedule"
                                          title={
                                            past
                                              ? 'Past schedules cannot be edited'
                                              : 'Edit schedule'
                                          }
                                          onClick={() => setEditor({ schedule: slot })}
                                          className={iconButton}
                                        >
                                          <Pencil size={13} />
                                        </button>
                                        <button
                                          type="button"
                                          disabled={slot.bookedCount > 0}
                                          title={
                                            slot.bookedCount > 0
                                              ? 'Has bookings, hide instead'
                                              : 'Delete schedule'
                                          }
                                          aria-label="Delete schedule"
                                          onClick={() => setConfirmId(slot.id)}
                                          className={`${iconButton} hover:!text-red-600`}
                                        >
                                          <Trash2 size={13} />
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </section>
                    );
                  })}
                </section>
              );
            })}
        </div>
      )}
    </div>
  );
}

export default function DeliveryAdminClient() {
  const [tab, setTab] = useState<'zones' | 'schedules'>('zones');
  const [zones, setZones] = useState<Zone[]>([]);
  const [zonesLoading, setZonesLoading] = useState(true);
  const [notice, setNotice] = useState<Notice | null>(null);

  const notify = useCallback<Notify>((kind, text) => setNotice({ kind, text }), []);

  useEffect(() => {
    if (!notice) return;

    const timer = setTimeout(() => setNotice(null), 5000);

    return () => clearTimeout(timer);
  }, [notice]);

  const loadZones = useCallback(async () => {
    try {
      const data = await request<{ zones: Zone[] }>(ZONES_API);

      setZones(data.zones);
    } catch (err) {
      notify('error', errorText(err));
    } finally {
      setZonesLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    void loadZones();
  }, [loadZones]);

  const tabs: { id: typeof tab; label: string; count?: number }[] = [
    { id: 'zones', label: 'Delivery zones', count: zones.length },
    { id: 'schedules', label: 'Delivery slots' },
  ];

  return (
    <main className="min-h-screen bg-[#f8f8f6] text-[#24231f]">
      <div className="mx-auto w-full max-w-300 py-6 sm:px-6 sm:py-8 lg:px-8">
        <header className="mb-6">
          <h1 className="m-0 font-heading text-[23px] leading-tight font-semibold tracking-tight sm:text-[27px]">
            Delivery
          </h1>

          <p className="mt-1.5 mb-0 max-w-xl text-[12px] leading-5 text-[#77736d]">
            Set where you deliver and what each area costs, then open the dates and times customers
            can book.
          </p>
        </header>

        {notice && (
          <div
            role={notice.kind === 'error' ? 'alert' : 'status'}
            className={`mb-4 flex items-start justify-between gap-3 border px-3 py-2.5 text-[12px] leading-5 ${
              notice.kind === 'error'
                ? 'border-red-200 bg-red-50 text-red-700'
                : 'border-green-200 bg-green-50 text-green-800'
            }`}
          >
            <span>{notice.text}</span>

            <button
              type="button"
              aria-label="Dismiss message"
              onClick={() => setNotice(null)}
              className="shrink-0 cursor-pointer border-0 bg-transparent p-0.5 text-current opacity-70 hover:opacity-100"
            >
              <X size={13} />
            </button>
          </div>
        )}

        <div
          role="tablist"
          aria-label="Delivery settings"
          className="mb-5 flex gap-6 border-b border-[#e9e6df]"
        >
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              id={`tab-${item.id}`}
              aria-selected={tab === item.id}
              aria-controls={`panel-${item.id}`}
              onClick={() => setTab(item.id)}
              className={`-mb-px cursor-pointer border-0 border-b-2 bg-transparent px-0.5 pb-3 text-[12px] font-semibold transition-colors ${
                tab === item.id
                  ? 'border-brand text-[#24231f]'
                  : 'border-transparent text-[#88847d] hover:text-[#24231f]'
              }`}
            >
              {item.label}
              {item.count !== undefined && !zonesLoading && (
                <span className="ml-1.5 font-normal text-[#88847d]">{item.count}</span>
              )}
            </button>
          ))}
        </div>

        <div
          role="tabpanel"
          id={`panel-${tab}`}
          aria-labelledby={`tab-${tab}`}
          tabIndex={0}
          className="outline-none"
        >
          {tab === 'zones' ? (
            <ZonesPanel zones={zones} loading={zonesLoading} reload={loadZones} notify={notify} />
          ) : (
            <SchedulesPanel zones={zones} notify={notify} />
          )}
        </div>
      </div>
    </main>
  );
}
