'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Button } from '@/components/ui/button';

interface ReportData {
  period: string;
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  totalCustomers: number;
  newCustomers: number;
  topProducts: Array<{
    name: string;
    sold: number;
    revenue: number;
  }>;
  salesByMeatType: Array<{
    type: string;
    sales: number;
  }>;
  ordersByStatus: Array<{
    status: string;
    count: number;
  }>;
}

export default function ReportsPage() {
  const [period, setPeriod] = useState('monthly');
  const { data: reports } = useSWR(`/api/admin/reports?period=${period}`);

  const handleExport = async (format: 'csv' | 'pdf') => {
    try {
      const res = await fetch(`/api/admin/reports/export?period=${period}&format=${format}`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${period}.${format === 'csv' ? 'csv' : 'pdf'}`;
      a.click();
    } catch (error) {
      console.error('Export failed');
    }
  };

  if (!reports) {
    return <div className="py-8 text-center">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-foreground text-3xl font-bold">Reports & Analytics</h1>
        <div className="flex gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="border-border bg-background text-foreground rounded-lg border px-3 py-2"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="yearly">Yearly</option>
          </select>
          <Button onClick={() => handleExport('csv')} variant="outline">
            📥 CSV
          </Button>
          <Button onClick={() => handleExport('pdf')} variant="outline">
            📄 PDF
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="bg-card border-border rounded-lg border p-6">
          <p className="text-muted-foreground mb-2 text-sm">Total Orders</p>
          <p className="text-foreground text-3xl font-bold">{reports.totalOrders}</p>
        </div>
        <div className="bg-card border-border rounded-lg border p-6">
          <p className="text-muted-foreground mb-2 text-sm">Total Revenue</p>
          <p className="text-foreground text-3xl font-bold">${reports.totalRevenue.toFixed(2)}</p>
        </div>
        <div className="bg-card border-border rounded-lg border p-6">
          <p className="text-muted-foreground mb-2 text-sm">Average Order Value</p>
          <p className="text-foreground text-3xl font-bold">
            ${reports.averageOrderValue.toFixed(2)}
          </p>
        </div>
        <div className="bg-card border-border rounded-lg border p-6">
          <p className="text-muted-foreground mb-2 text-sm">New Customers</p>
          <p className="text-foreground text-3xl font-bold">{reports.newCustomers}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top Products */}
        <div className="bg-card border-border rounded-lg border p-6">
          <h2 className="text-foreground mb-4 text-lg font-semibold">Top Products</h2>
          <div className="space-y-3">
            {reports.topProducts && reports.topProducts.length > 0 ? (
              reports.topProducts.map((product: any, idx: number) => (
                <div key={idx} className="bg-muted flex items-center justify-between rounded p-3">
                  <div>
                    <p className="text-foreground font-medium">{product.name}</p>
                    <p className="text-muted-foreground text-sm">{product.sold} sold</p>
                  </div>
                  <p className="text-foreground font-semibold">${product.revenue.toFixed(2)}</p>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">No data available</p>
            )}
          </div>
        </div>

        {/* Sales by Meat Type */}
        <div className="bg-card border-border rounded-lg border p-6">
          <h2 className="text-foreground mb-4 text-lg font-semibold">Sales by Meat Type</h2>
          <div className="space-y-3">
            {reports.salesByMeatType && reports.salesByMeatType.length > 0 ? (
              reports.salesByMeatType.map((item: any, idx: number) => (
                <div key={idx} className="bg-muted flex items-center justify-between rounded p-3">
                  <p className="text-foreground font-medium">{item.type}</p>
                  <p className="text-foreground font-semibold">${item.sales.toFixed(2)}</p>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">No data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Orders by Status */}
      <div className="bg-card border-border rounded-lg border p-6">
        <h2 className="text-foreground mb-4 text-lg font-semibold">Orders by Status</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {reports.ordersByStatus && reports.ordersByStatus.length > 0 ? (
            reports.ordersByStatus.map((item: any, idx: number) => (
              <div key={idx} className="bg-muted rounded p-4 text-center">
                <p className="text-foreground text-2xl font-bold">{item.count}</p>
                <p className="text-muted-foreground text-sm capitalize">{item.status}</p>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground">No data available</p>
          )}
        </div>
      </div>
    </div>
  );
}
