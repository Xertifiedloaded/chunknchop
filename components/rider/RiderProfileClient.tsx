'use client';

import { useEffect, useState } from 'react';
import {
  User,
  Phone,
  MapPin,
  Truck,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from 'lucide-react';

type Profile = {
  phone?: string;
  residentialAddress?: string;
  vehicleType?: string;
  vehicleColor?: string;
  plateNumber?: string;
  verificationStatus?: string;
  isActive?: boolean;
  isAvailable?: boolean;
  zones?: {
    zone?: {
      name?: string;
      city?: string;
    };
  }[];
};

export default function RiderProfileClient() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadProfile() {
    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/rider/profile', {
        cache: 'no-store',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Unable to load rider profile');
      }

      setProfile(
        data.profile ?? data.rider ?? data.data?.profile ?? data.data?.rider ?? data.data ?? null,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load rider profile');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfile();
  }, []);

  const zones = profile?.zones ?? [];

  return (
    <main className="min-h-screen bg-[#faf9f6] px-5 py-10 text-[#29231e]">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[2px] text-[#986735]">
              Rider account
            </p>
            <h1 className="text-3xl font-black tracking-tight">My profile</h1>
            <p className="mt-2 text-sm text-[#81786e]">
              View your personal information and delivery details.
            </p>
          </div>

          <button
            onClick={loadProfile}
            disabled={loading}
            className="flex items-center gap-2 border border-[#eae5dc] bg-white px-4 py-3 text-xs font-bold transition hover:border-[#986735] disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {loading && (
          <div className="border border-[#eae5dc] bg-white p-10 text-center text-sm text-[#81786e]">
            Loading your profile...
          </div>
        )}

        {!loading && error && (
          <div className="border border-red-200 bg-red-50 p-6">
            <p className="text-sm font-semibold text-red-700">{error}</p>
            <button onClick={loadProfile} className="mt-4 text-xs font-bold text-red-700 underline">
              Try again
            </button>
          </div>
        )}

        {!loading && !error && !profile && (
          <div className="border border-[#eae5dc] bg-white p-10 text-center">
            <User className="mx-auto mb-4 text-[#986735]" size={30} />
            <h2 className="font-bold">Profile not found</h2>
            <p className="mt-2 text-sm text-[#81786e]">Your rider profile could not be found.</p>
          </div>
        )}

        {!loading && !error && profile && (
          <div className="grid gap-5">
            <section className="border border-[#eae5dc] bg-white p-6">
              <div className="mb-6 flex items-center gap-3">
                <div className="rounded-full bg-[#f5eee5] p-3">
                  <User className="text-[#986735]" size={20} />
                </div>
                <div>
                  <h2 className="font-bold">Personal information</h2>
                  <p className="text-xs text-[#81786e]">Your registered contact details</p>
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <Info label="Phone number" value={profile.phone} icon={<Phone size={15} />} />
                <Info
                  label="Residential address"
                  value={profile.residentialAddress}
                  icon={<MapPin size={15} />}
                />
              </div>
            </section>

            <section className="border border-[#eae5dc] bg-white p-6">
              <div className="mb-6 flex items-center gap-3">
                <div className="rounded-full bg-[#f5eee5] p-3">
                  <Truck className="text-[#986735]" size={20} />
                </div>
                <div>
                  <h2 className="font-bold">Vehicle information</h2>
                  <p className="text-xs text-[#81786e]">Your registered delivery vehicle</p>
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <Info label="Vehicle type" value={profile.vehicleType} />
                <Info label="Vehicle color" value={profile.vehicleColor} />
                <Info label="Plate number" value={profile.plateNumber} />
              </div>
            </section>

            <section className="border border-[#eae5dc] bg-white p-6">
              <div className="mb-6 flex items-center gap-3">
                <div className="rounded-full bg-[#f5eee5] p-3">
                  <ShieldCheck className="text-[#986735]" size={20} />
                </div>
                <div>
                  <h2 className="font-bold">Account status</h2>
                  <p className="text-xs text-[#81786e]">
                    Your rider account verification and availability
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <Status label="Verification" value={profile.verificationStatus || 'Pending'} />
                <Status
                  label="Account active"
                  value={profile.isActive ? 'Active' : 'Inactive'}
                  active={!!profile.isActive}
                />
                <Status
                  label="Availability"
                  value={profile.isAvailable ? 'Available' : 'Unavailable'}
                  active={!!profile.isAvailable}
                />
              </div>
            </section>

            <section className="border border-[#eae5dc] bg-white p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="rounded-full bg-[#f5eee5] p-3">
                  <MapPin className="text-[#986735]" size={20} />
                </div>
                <div>
                  <h2 className="font-bold">Assigned delivery zones</h2>
                  <p className="text-xs text-[#81786e]">Areas assigned to your rider account</p>
                </div>
              </div>

              {zones.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {zones.map((item, index) => (
                    <span
                      key={`${item.zone?.name}-${index}`}
                      className="border border-[#eae5dc] bg-[#faf9f6] px-4 py-3 text-xs font-semibold"
                    >
                      {item.zone?.name || 'Unnamed zone'}
                      {item.zone?.city ? ` · ${item.zone.city}` : ''}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[#81786e]">No delivery zones have been assigned yet.</p>
              )}
            </section>
          </div>
        )}
      </div>
    </main>
  );
}

function Info({ label, value, icon }: { label: string; value?: string; icon?: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[#988d80]">
        {icon}
        {label}
      </p>
      <p className="text-sm font-semibold">{value || 'Not provided'}</p>
    </div>
  );
}

function Status({ label, value, active }: { label: string; value: string; active?: boolean }) {
  return (
    <div className="border border-[#eae5dc] bg-[#faf9f6] p-4">
      <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-[#988d80]">{label}</p>
      <div className="flex items-center gap-2 text-xs font-bold">
        {active === undefined ? (
          <ShieldCheck size={15} className="text-[#986735]" />
        ) : active ? (
          <CheckCircle2 size={15} className="text-green-600" />
        ) : (
          <XCircle size={15} className="text-red-500" />
        )}
        {value}
      </div>
    </div>
  );
}
