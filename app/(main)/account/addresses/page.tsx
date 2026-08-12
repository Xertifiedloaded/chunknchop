'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';
import { fetchWithAuth } from '@/lib/fetchClient';

interface Address {
  id: string;
  label?: string;
  fullName: string;
  phone?: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
}

export default function AddressBookPage() {
  const { data: addresses, mutate } = useSWR('/api/customer/addresses', (url) => fetchWithAuth(url).then((res) => res.json()));
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<Address>>({
    label: '',
    fullName: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'USA',
    isDefault: false,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const url = editingId ? `/api/customer/addresses/${editingId}` : '/api/customer/addresses';

      const method = editingId ? 'PUT' : 'POST';

      const res = await fetchWithAuth(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success(editingId ? 'Address updated' : 'Address added');
        mutate();
        setShowForm(false);
        setEditingId(null);
        setFormData({
          label: '',
          fullName: '',
          phone: '',
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: 'USA',
          isDefault: false,
        });
      }
    } catch (error) {
      toast.error('Failed to save address');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this address?')) return;

    try {
      const res = await fetchWithAuth(`/api/customer/addresses/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Address deleted');
        mutate();
      }
    } catch (error) {
      toast.error('Failed to delete address');
    }
  };

  const handleEdit = (address: Address) => {
    setFormData(address);
    setEditingId(address.id);
    setShowForm(true);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-foreground text-3xl font-bold">Address Book</h1>
          <Button onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancel' : '+ Add Address'}</Button>
        </div>

        {/* Add/Edit Form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-card border-border mb-8 rounded-lg border p-6">
            <h2 className="text-foreground mb-4 font-semibold">{editingId ? 'Edit Address' : 'Add New Address'}</h2>

            <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <input type="text" name="label" placeholder="Label (e.g., Home, Office)" value={formData.label || ''} onChange={handleInputChange} className="border-border bg-background text-foreground rounded-lg border px-3 py-2" />
              <input type="text" name="fullName" placeholder="Full Name" value={formData.fullName || ''} onChange={handleInputChange} required className="border-border bg-background text-foreground rounded-lg border px-3 py-2" />
            </div>

            <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <input type="tel" name="phone" placeholder="Phone Number" value={formData.phone || ''} onChange={handleInputChange} className="border-border bg-background text-foreground rounded-lg border px-3 py-2" />
              <input type="text" name="street" placeholder="Street Address" value={formData.street || ''} onChange={handleInputChange} required className="border-border bg-background text-foreground rounded-lg border px-3 py-2" />
            </div>

            <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
              <input type="text" name="city" placeholder="City" value={formData.city || ''} onChange={handleInputChange} required className="border-border bg-background text-foreground rounded-lg border px-3 py-2" />
              <input type="text" name="state" placeholder="State" value={formData.state || ''} onChange={handleInputChange} required className="border-border bg-background text-foreground rounded-lg border px-3 py-2" />
              <input type="text" name="zipCode" placeholder="Zip Code" value={formData.zipCode || ''} onChange={handleInputChange} required className="border-border bg-background text-foreground rounded-lg border px-3 py-2" />
            </div>

            <div className="mb-4">
              <label className="flex items-center gap-2">
                <input type="checkbox" name="isDefault" checked={formData.isDefault || false} onChange={handleInputChange} className="h-4 w-4" />
                <span className="text-foreground">Set as default address</span>
              </label>
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? 'Saving...' : editingId ? 'Update Address' : 'Add Address'}
            </Button>
          </form>
        )}

        {/* Addresses List */}
        {addresses && addresses.length > 0 ? (
          <div className="space-y-4">
            {addresses.map((address: Address) => (
              <div key={address.id} className="bg-card border-border rounded-lg border p-6">
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      <h3 className="text-foreground font-semibold">{address.label || 'Address'}</h3>
                      {address.isDefault && <span className="rounded bg-green-500/20 px-2 py-1 text-xs text-green-700">Default</span>}
                    </div>
                    <p className="text-foreground">{address.fullName}</p>
                    {address.phone && <p className="text-muted-foreground text-sm">{address.phone}</p>}
                    <p className="text-muted-foreground text-sm">{address.street}</p>
                    <p className="text-muted-foreground text-sm">
                      {address.city}, {address.state} {address.zipCode}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(address)}>
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(address.id)} className="text-red-600 hover:bg-red-50">
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center">
            <p className="text-muted-foreground mb-4">No addresses yet</p>
            <Button onClick={() => setShowForm(true)}>Add Your First Address</Button>
          </div>
        )}
      </div>
    </div>
  );
}
