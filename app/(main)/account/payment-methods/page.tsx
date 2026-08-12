'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';
import { fetchWithAuth } from '@/lib/fetchClient';

interface PaymentMethod {
  id: string;
  type: 'CARD' | 'BANK_TRANSFER' | 'DIGITAL_WALLET';
  label?: string;
  cardLast4?: string;
  cardBrand?: string;
  cardExpiry?: string;
  isDefault: boolean;
}

export default function PaymentMethodsPage() {
  const { data: paymentMethods, mutate } = useSWR('/api/customer/payment-methods', (url) => fetchWithAuth(url).then((res) => res.json()));
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    type: 'CARD',
    cardNumber: '',
    cardName: '',
    cardExpiry: '',
    cardCvc: '',
    label: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetchWithAuth('/api/customer/payment-methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success('Payment method added');
        mutate();
        setShowForm(false);
        setFormData({
          type: 'CARD',
          cardNumber: '',
          cardName: '',
          cardExpiry: '',
          cardCvc: '',
          label: '',
        });
      }
    } catch (error) {
      toast.error('Failed to add payment method');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this payment method?')) return;

    try {
      const res = await fetchWithAuth(`/api/customer/payment-methods/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Payment method deleted');
        mutate();
      }
    } catch (error) {
      toast.error('Failed to delete payment method');
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      const res = await fetchWithAuth(`/api/customer/payment-methods/${id}/set-default`, {
        method: 'POST',
      });

      if (res.ok) {
        toast.success('Default payment method updated');
        mutate();
      }
    } catch (error) {
      toast.error('Failed to set default');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-foreground text-3xl font-bold">Payment Methods</h1>
          <Button onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancel' : '+ Add Method'}</Button>
        </div>

        {/* Add Form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-card border-border mb-8 rounded-lg border p-6">
            <h2 className="text-foreground mb-4 font-semibold">Add Payment Method</h2>

            <div className="mb-4">
              <label className="text-foreground mb-2 block text-sm font-medium">Payment Type</label>
              <select name="type" value={formData.type} onChange={handleInputChange} className="border-border bg-background text-foreground w-full rounded-lg border px-3 py-2">
                <option value="CARD">Credit/Debit Card</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="DIGITAL_WALLET">Digital Wallet</option>
              </select>
            </div>

            {formData.type === 'CARD' && (
              <>
                <div className="mb-4">
                  <label className="text-foreground mb-2 block text-sm font-medium">Cardholder Name</label>
                  <input type="text" name="cardName" placeholder="John Doe" value={formData.cardName} onChange={handleInputChange} required className="border-border bg-background text-foreground w-full rounded-lg border px-3 py-2" />
                </div>

                <div className="mb-4">
                  <label className="text-foreground mb-2 block text-sm font-medium">Card Number</label>
                  <input
                    type="text"
                    name="cardNumber"
                    placeholder="4242 4242 4242 4242"
                    value={formData.cardNumber}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        cardNumber: e.target.value.replace(/\s/g, '').slice(0, 16),
                      })
                    }
                    required
                    className="border-border bg-background text-foreground w-full rounded-lg border px-3 py-2"
                  />
                </div>

                <div className="mb-4 grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-foreground mb-2 block text-sm font-medium">Expiry (MM/YY)</label>
                    <input type="text" name="cardExpiry" placeholder="12/25" value={formData.cardExpiry} onChange={handleInputChange} required className="border-border bg-background text-foreground w-full rounded-lg border px-3 py-2" />
                  </div>
                  <div>
                    <label className="text-foreground mb-2 block text-sm font-medium">CVC</label>
                    <input
                      type="text"
                      name="cardCvc"
                      placeholder="123"
                      value={formData.cardCvc}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          cardCvc: e.target.value.slice(0, 3),
                        })
                      }
                      required
                      className="border-border bg-background text-foreground w-full rounded-lg border px-3 py-2"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="mb-4">
              <label className="text-foreground mb-2 block text-sm font-medium">Label (Optional)</label>
              <input type="text" name="label" placeholder="e.g., Personal, Work" value={formData.label} onChange={handleInputChange} className="border-border bg-background text-foreground w-full rounded-lg border px-3 py-2" />
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? 'Adding...' : 'Add Payment Method'}
            </Button>
          </form>
        )}

        {/* Payment Methods List */}
        {paymentMethods && paymentMethods.length > 0 ? (
          <div className="space-y-4">
            {paymentMethods.map((method: PaymentMethod) => (
              <div key={method.id} className="bg-card border-border rounded-lg border p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="text-2xl">{method.type === 'CARD' ? '💳' : method.type === 'BANK_TRANSFER' ? '🏦' : '📱'}</span>
                      <div>
                        <h3 className="text-foreground font-semibold">{method.label || (method.type === 'CARD' ? `${method.cardBrand} ending in ${method.cardLast4}` : method.type)}</h3>
                        {method.type === 'CARD' && method.cardExpiry && <p className="text-muted-foreground text-sm">Expires {method.cardExpiry}</p>}
                      </div>
                    </div>
                    {method.isDefault && <span className="mt-2 inline-block rounded bg-blue-500/20 px-2 py-1 text-xs text-blue-700">Default</span>}
                  </div>
                  <div className="flex gap-2">
                    {!method.isDefault && (
                      <Button variant="outline" size="sm" onClick={() => handleSetDefault(method.id)}>
                        Set Default
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => handleDelete(method.id)} className="text-red-600 hover:bg-red-50">
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center">
            <p className="text-muted-foreground mb-4">No payment methods added yet</p>
            <Button onClick={() => setShowForm(true)}>Add Your First Payment Method</Button>
          </div>
        )}
      </div>
    </div>
  );
}
