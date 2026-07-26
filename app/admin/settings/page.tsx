'use client';

import { useState } from 'react';
import { Save } from 'lucide-react';

export default function AdminSettings() {
  const [settings, setSettings] = useState({
    storeName: 'ChunkNChop',
    supportEmail: 'support@chunknchop.com',
    sameDayDeliveryFee: 5.99,
    minimumOrderAmount: 25.0,
    taxRate: 0.08,
  });

  const [saved, setSaved] = useState(false);

  const handleChange = (field: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    try {
      await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-600">Manage system settings and configuration</p>
      </div>

      <div className="max-w-2xl rounded-lg bg-white shadow">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">General Settings</h2>
        </div>

        <div className="space-y-6 p-6">
          {/* Store Name */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-900">Store Name</label>
            <input
              type="text"
              value={settings.storeName}
              onChange={(e) => handleChange('storeName', e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Support Email */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-900">Support Email</label>
            <input
              type="email"
              value={settings.supportEmail}
              onChange={(e) => handleChange('supportEmail', e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Same Day Delivery Fee */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-900">
              Same Day Delivery Fee ($)
            </label>
            <input
              type="number"
              step="0.01"
              value={settings.sameDayDeliveryFee}
              onChange={(e) => handleChange('sameDayDeliveryFee', parseFloat(e.target.value))}
              className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Minimum Order Amount */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-900">
              Minimum Order Amount ($)
            </label>
            <input
              type="number"
              step="0.01"
              value={settings.minimumOrderAmount}
              onChange={(e) => handleChange('minimumOrderAmount', parseFloat(e.target.value))}
              className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Tax Rate */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-900">Tax Rate (%)</label>
            <input
              type="number"
              step="0.01"
              value={settings.taxRate * 100}
              onChange={(e) => handleChange('taxRate', parseFloat(e.target.value) / 100)}
              className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4">
          {saved && (
            <p className="text-sm font-medium text-emerald-600">Settings saved successfully!</p>
          )}
          <button
            onClick={handleSave}
            className="ml-auto flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-2 text-white hover:bg-emerald-700"
          >
            <Save size={18} />
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
