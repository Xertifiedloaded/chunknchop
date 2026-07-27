'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/authStore';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, Package } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface OrderItem {
  productId: string;
  quantity: number;
  pricePerUnit: number;
  tier: string | null;
  product: {
    name: string;
  };
}

interface Order {
  id: string;
  orderNumber: string;
  total: number;
  status: string;
  createdAt: string;
  items: OrderItem[];
}

export default function OrdersPage() {
  const router = useRouter();
  const { user, accessToken } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/auth/login?redirect=/orders');
      return;
    }

    fetchOrders();
  }, [user, router]);

  const fetchOrders = async () => {
    try {
      if (!accessToken) {
        setLoading(false);
        return;
      }

      const response = await fetch('/api/customer/orders', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => null);
        throw new Error(errBody?.error || `Failed to fetch orders (${response.status})`);
      }

      const data = await response.json();
      setOrders(data.orders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <Link href="/" className="text-muted-foreground hover:text-foreground mb-8 flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Store
        </Link>

        <h1 className="mb-8 text-3xl font-bold">My Orders</h1>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <div className="py-12 text-center">
            <Package className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
            <p className="text-muted-foreground mb-4">You haven&apos;t placed any orders yet</p>
            <Link href="/">
              <Button>Start Shopping</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-card border-border rounded-lg border p-6">
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm">Order Number</p>
                    <p className="font-mono text-lg font-bold">{order.orderNumber}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-muted-foreground text-sm">Status</p>
                    <p className="font-medium capitalize">{order.status}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-muted-foreground text-sm">Total</p>
                    <p className="text-xl font-bold">${order.total.toFixed(2)}</p>
                  </div>
                </div>

                <div className="border-border mb-4 border-t pt-4">
                  <p className="mb-3 text-sm font-medium">Items</p>
                  <div className="space-y-2">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {item.product.name}
                          {item.tier ? ` (${item.tier})` : ''} x {item.quantity}
                        </span>
                        <span>${(item.pricePerUnit * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <p className="text-muted-foreground">Placed on {new Date(order.createdAt).toLocaleDateString()}</p>
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
