'use client';

import { useEffect, useState } from 'react';
import { fetchWithAuth } from '@/lib/fetchClient';

interface Analytics {
  totalRevenue: number;
  averageOrderValue: number;
  conversionRate: number;
  topProducts: any[];
  salesByMeatType: any[];
}

export default function AdminAnalytics() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const response = await fetchWithAuth('/api/admin/analytics');
        const data = await response.json();
        setAnalytics(data);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, []);

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Analytics</h1>
        <p className="text-slate-600">Business metrics and insights</p>
      </div>

      {/* Key Metrics */}
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-lg bg-white p-6 shadow">
          <p className="text-sm font-medium text-slate-600">Total Revenue</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">${(analytics?.totalRevenue || 0).toFixed(2)}</p>
        </div>
        <div className="rounded-lg bg-white p-6 shadow">
          <p className="text-sm font-medium text-slate-600">Average Order Value</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">${(analytics?.averageOrderValue || 0).toFixed(2)}</p>
        </div>
        <div className="rounded-lg bg-white p-6 shadow">
          <p className="text-sm font-medium text-slate-600">Conversion Rate</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{(analytics?.conversionRate || 0).toFixed(2)}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Top Products */}
        <div className="rounded-lg bg-white shadow">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-slate-900">Top Products</h2>
          </div>
          <div className="divide-y divide-slate-200">
            {analytics?.topProducts?.map((product, index) => (
              <div key={index} className="flex items-center justify-between px-6 py-4">
                <div>
                  <p className="font-medium text-slate-900">{product.name}</p>
                  <p className="text-sm text-slate-600">{product.sales} sales</p>
                </div>
                <p className="font-semibold text-slate-900">${product.revenue.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Sales by Meat Type */}
        <div className="rounded-lg bg-white shadow">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-slate-900">Sales by Meat Type</h2>
          </div>
          <div className="divide-y divide-slate-200">
            {analytics?.salesByMeatType?.map((item, index) => (
              <div key={index} className="px-6 py-4">
                <div className="mb-2 flex items-center justify-between">
                  <p className="font-medium text-slate-900">{item.meatType}</p>
                  <p className="font-semibold text-slate-900">${item.revenue.toFixed(2)}</p>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-200">
                  <div className="h-2 rounded-full bg-emerald-600" style={{ width: `${item.percentage}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
