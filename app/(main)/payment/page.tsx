'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/authStore';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PaymentPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PaymentContent />
    </Suspense>
  );
}

function PaymentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'processing' | 'success' | 'error' | null>(null);
  const clientSecret = searchParams.get('client_secret');

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    if (!clientSecret) {
      setStatus('error');
      return;
    }

    // In a real implementation, you would initialize Stripe Elements here
    // and handle the payment confirmation
    console.log('Client secret:', clientSecret);
  }, [user, router, clientSecret]);

  const handlePayment = async () => {
    setLoading(true);
    try {
      // In a real implementation, this would use Stripe's confirm payment method
      // For now, we'll simulate a successful payment
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setStatus('success');
      toast.success('Payment successful! Your order has been placed.');

      setTimeout(() => {
        router.push('/orders');
      }, 2000);
    } catch (error) {
      console.error('Payment error:', error);
      setStatus('error');
      toast.error('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="bg-background flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md">
        <div className="bg-card border-border space-y-6 rounded-lg border p-8">
          <div className="text-center">
            <h1 className="mb-2 text-2xl font-bold">Complete Payment</h1>
            <p className="text-muted-foreground">Secure payment powered by Stripe</p>
          </div>

          {status === 'success' && (
            <div className="flex gap-3 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950">
              <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-green-600 dark:text-green-400" />
              <div>
                <p className="font-medium text-green-900 dark:text-green-100">Payment Successful!</p>
                <p className="text-sm text-green-700 dark:text-green-300">Your order has been placed successfully.</p>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
              <div>
                <p className="font-medium text-red-900 dark:text-red-100">Payment Failed</p>
                <p className="text-sm text-red-700 dark:text-red-300">Please try again or contact support.</p>
              </div>
            </div>
          )}

          {!status && (
            <>
              <div className="bg-muted space-y-2 rounded-lg p-4">
                <p className="text-muted-foreground text-sm">Amount to be charged</p>
                <p className="text-3xl font-bold">$XXX.XX</p>
              </div>

              <div className="text-muted-foreground text-center text-sm">Your payment information is secure and encrypted. Click the button below to complete your purchase.</div>

              <Button onClick={handlePayment} disabled={loading} className="bg-accent text-accent-foreground hover:bg-accent/90 w-full">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing Payment...
                  </>
                ) : (
                  'Pay Now'
                )}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
