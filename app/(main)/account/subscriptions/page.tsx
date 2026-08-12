'use client';

import { fetchWithAuth } from '@/lib/fetchClient';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/authStore';
import { Button } from '@/components/ui/button';
import { Loader2, Calendar, Pause, Trash2 } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface Subscription {
  id: string;
  frequency: string;
  status: string;
  nextDeliveryDate: string;
  productTier: {
    name: string;
    price: number;
    product: {
      name: string;
    };
  };
}

export default function SubscriptionsPage() {
  const router = useRouter();
  const { user, accessToken } = useAuthStore();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/auth/login?redirect=/account/subscriptions');
      return;
    }

    fetchSubscriptions();
  }, [user, router]);

  const fetchSubscriptions = async () => {
    try {
      const response = await fetchWithAuth('/api/customer/subscriptions');

      if (!response.ok) throw new Error('Failed to fetch subscriptions');

      const data = await response.json();
      setSubscriptions(data);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      toast.error('Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async (subscriptionId: string) => {
    if (!confirm('Are you sure you want to cancel this subscription?')) return;

    try {
      const response = await fetchWithAuth(`/api/customer/subscriptions/${subscriptionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to cancel subscription');

      setSubscriptions(subscriptions.filter((s) => s.id !== subscriptionId));
      toast.success('Subscription cancelled');
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast.error('Failed to cancel subscription');
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="mb-8 text-3xl font-bold">My Subscriptions</h1>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
          </div>
        ) : subscriptions.length === 0 ? (
          <div className="bg-card border-border rounded-lg border py-12 text-center">
            <p className="text-muted-foreground mb-4">No active subscriptions</p>
            <Link href="/">
              <Button>Browse Subscription Products</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {subscriptions.map((subscription) => (
              <div key={subscription.id} className="bg-card border-border rounded-lg border p-6">
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold">{subscription.productTier.product.name}</h3>
                    <p className="text-muted-foreground text-sm">{subscription.productTier.name} Tier</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">${subscription.productTier.price.toFixed(2)}</p>
                    <p className="text-muted-foreground text-sm capitalize">{subscription.frequency}</p>
                  </div>
                </div>

                <div className="border-border mb-4 border-t pt-4">
                  <div className="mb-2 flex items-center gap-2 text-sm">
                    <Calendar className="text-muted-foreground h-4 w-4" />
                    <span className="text-muted-foreground">Next delivery: {new Date(subscription.nextDeliveryDate).toLocaleDateString()}</span>
                  </div>
                  <p className={`text-sm font-medium ${subscription.status === 'ACTIVE' ? 'text-green-600' : 'text-yellow-600'}`}>Status: {subscription.status}</p>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Pause className="mr-2 h-4 w-4" />
                    Pause
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleCancelSubscription(subscription.id)}>
                    <Trash2 className="mr-2 h-4 w-4 text-red-500" />
                    Cancel
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
