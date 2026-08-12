'use client';

import { fetchWithAuth } from '@/lib/fetchClient';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function NewProductPage() {
  const router = useRouter();
  const { user, accessToken } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    basePrice: '',
    stock: '',
    category: '',
    imageUrl: '',
  });
  const [tiers, setTiers] = useState([{ name: '', price: '' }]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTierChange = (index: number, field: string, value: string) => {
    const newTiers = [...tiers];
    newTiers[index] = { ...newTiers[index], [field]: value };
    setTiers(newTiers);
  };

  const addTier = () => {
    setTiers([...tiers, { name: '', price: '' }]);
  };

  const removeTier = (index: number) => {
    setTiers(tiers.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetchWithAuth('/api/supplier/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',

        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          basePrice: parseFloat(formData.basePrice),
          stock: parseInt(formData.stock),
          category: formData.category,
          imageUrl: formData.imageUrl,
          tiers: tiers
            .filter((t) => t.name && t.price)
            .map((t) => ({
              name: t.name,
              price: parseFloat(t.price),
            })),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create product');
      }

      toast.success('Product created successfully!');
      router.push('/supplier/dashboard');
    } catch (error) {
      console.error('Error creating product:', error);
      toast.error('Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== 'SUPPLIER') {
    return null;
  }

  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Link href="/supplier/dashboard" className="text-muted-foreground hover:text-foreground mb-8 flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <h1 className="mb-8 text-3xl font-bold">Add New Product</h1>

        <form onSubmit={handleSubmit} className="bg-card border-border space-y-6 rounded-lg border p-6">
          <div>
            <label className="mb-2 block text-sm font-medium">Product Name *</label>
            <Input name="name" value={formData.name} onChange={handleInputChange} placeholder="Premium Artisan Cheese" required />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Description</label>
            <textarea name="description" value={formData.description} onChange={handleInputChange} placeholder="Describe your product..." className="border-border bg-background text-foreground w-full rounded-md border px-3 py-2" rows={4} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-medium">Base Price *</label>
              <Input name="basePrice" type="number" step="0.01" value={formData.basePrice} onChange={handleInputChange} placeholder="29.99" required />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Stock *</label>
              <Input name="stock" type="number" value={formData.stock} onChange={handleInputChange} placeholder="100" required />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Category</label>
            <Input name="category" value={formData.category} onChange={handleInputChange} placeholder="Dairy / Meat / Produce" />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Image URL</label>
            <Input name="imageUrl" value={formData.imageUrl} onChange={handleInputChange} placeholder="https://..." />
          </div>

          <div className="border-border border-t pt-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Tiers (Optional)</h3>
              <Button type="button" variant="outline" onClick={addTier}>
                Add Tier
              </Button>
            </div>

            <div className="space-y-3">
              {tiers.map((tier, index) => (
                <div key={index} className="flex items-end gap-2">
                  <div className="flex-1">
                    <label className="mb-1 block text-xs font-medium">Tier Name</label>
                    <Input value={tier.name} onChange={(e) => handleTierChange(index, 'name', e.target.value)} placeholder="Gold / Silver / Bronze" />
                  </div>
                  <div className="flex-1">
                    <label className="mb-1 block text-xs font-medium">Price</label>
                    <Input type="number" step="0.01" value={tier.price} onChange={(e) => handleTierChange(index, 'price', e.target.value)} placeholder="39.99" />
                  </div>
                  {tiers.length > 1 && (
                    <Button type="button" variant="ghost" onClick={() => removeTier(index)} className="text-red-500">
                      Remove
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <Button type="submit" disabled={loading} className="bg-accent text-accent-foreground hover:bg-accent/90 w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Product'
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
