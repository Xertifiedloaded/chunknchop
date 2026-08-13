'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/store/authStore';
import { fetchWithAuth } from '@/lib/fetchClient';

interface DashboardStats {
  totalOrders: number;
  totalSpent: number;
  activeSubscriptions: number;
  recentOrders: any[];
}

export default function CustomerDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const user = useAuthStore((s) => s.user);
  const isHydrated = useAuthStore((s) => s.isHydrated);

  const fetcher = async (url: string) => {
    const res = await fetchWithAuth(url);
    if (!res.ok) {
      throw new Error('Failed to load dashboard');
    }
    return res.json();
  };

  const { data: stats, error } = useSWR<DashboardStats>(isHydrated && user ? '/api/customer/dashboard' : null, fetcher);

  useEffect(() => {
    setIsLoading(false);
  }, []);

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-red-600">Failed to load dashboard</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-foreground mb-2 text-3xl font-bold">Your Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here&apos;s your account overview.</p>
        </div>

        {/* Stats Grid */}
        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="bg-card border-border rounded-lg border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground mb-1 text-sm">Total Orders</p>
                <p className="text-foreground text-2xl font-bold">{isLoading ? '-' : stats?.totalOrders || 0}</p>
              </div>
              <div className="text-muted-foreground text-4xl">📦</div>
            </div>
          </div>

          <div className="bg-card border-border rounded-lg border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground mb-1 text-sm">Total Spent</p>
                <p className="text-foreground text-2xl font-bold">${isLoading ? '-' : (stats?.totalSpent || 0).toFixed(2)}</p>
              </div>
              <div className="text-muted-foreground text-4xl">💳</div>
            </div>
          </div>

          <div className="bg-card border-border rounded-lg border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground mb-1 text-sm">Active Subscriptions</p>
                <p className="text-foreground text-2xl font-bold">{isLoading ? '-' : stats?.activeSubscriptions || 0}</p>
              </div>
              <div className="text-muted-foreground text-4xl">🔄</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-card border-border mb-8 rounded-lg border p-6">
          <h2 className="text-foreground mb-4 text-lg font-semibold">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Link href="/cart">
              <Button variant="outline" className="w-full">
                🛒 View Cart
              </Button>
            </Link>
            <Link href="/orders">
              <Button variant="outline" className="w-full">
                📋 View Orders
              </Button>
            </Link>
            <Link href="/account/subscriptions">
              <Button variant="outline" className="w-full">
                🔄 Subscriptions
              </Button>
            </Link>
            <Link href="/build-meat-box">
              <Button variant="outline" className="w-full">
                🥩 Build Meat Box
              </Button>
            </Link>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-card border-border rounded-lg border p-6">
          <h2 className="text-foreground mb-4 text-lg font-semibold">Recent Orders</h2>
          {isLoading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : stats?.recentOrders && stats.recentOrders.length > 0 ? (
            <div className="space-y-3">
              {stats.recentOrders.map((order: any) => (
                <div key={order.id} className="border-border flex items-center justify-between rounded border p-3">
                  <div>
                    <p className="text-foreground font-medium">Order #{order.orderNumber}</p>
                    <p className="text-muted-foreground text-sm">{new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-foreground font-semibold">${order.totalAmount.toFixed(2)}</p>
                    <p className="text-muted-foreground text-xs capitalize">{order.status}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">
              No recent orders.{' '}
              <Link href="/" className="text-blue-500 hover:underline">
                Start shopping!
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
