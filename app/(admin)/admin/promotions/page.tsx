'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';

interface Promotion {
  id: string;
  code: string;
  description?: string;
  type: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING';
  value: number;
  startDate: string;
  endDate: string;
  maxUses?: number;
  currentUses: number;
  minOrderAmount?: number;
  isActive: boolean;
}

export default function PromotionsPage() {
  const { data: promotions, mutate } = useSWR('/api/admin/promotions');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    type: 'PERCENTAGE',
    value: '',
    startDate: '',
    endDate: '',
    maxUses: '',
    minOrderAmount: '',
    isActive: true,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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
      const payload = {
        code: formData.code.toUpperCase(),
        description: formData.description,
        type: formData.type,
        value: parseFloat(formData.value),
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
        maxUses: formData.maxUses ? parseInt(formData.maxUses) : null,
        minOrderAmount: formData.minOrderAmount ? parseFloat(formData.minOrderAmount) : null,
        isActive: formData.isActive,
      };

      const url = editingId ? `/api/admin/promotions/${editingId}` : '/api/admin/promotions';

      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(editingId ? 'Promotion updated' : 'Promotion created');
        mutate();
        setShowForm(false);
        setEditingId(null);
        setFormData({
          code: '',
          description: '',
          type: 'PERCENTAGE',
          value: '',
          startDate: '',
          endDate: '',
          maxUses: '',
          minOrderAmount: '',
          isActive: true,
        });
      }
    } catch (error) {
      toast.error('Failed to save promotion');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this promotion?')) return;

    try {
      const res = await fetch(`/api/admin/promotions/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Promotion deleted');
        mutate();
      }
    } catch (error) {
      toast.error('Failed to delete promotion');
    }
  };

  const handleEdit = (promo: Promotion) => {
    setFormData({
      code: promo.code,
      description: promo.description || '',
      type: promo.type,
      value: promo.value.toString(),
      startDate: promo.startDate.split('T')[0],
      endDate: promo.endDate.split('T')[0],
      maxUses: promo.maxUses?.toString() || '',
      minOrderAmount: promo.minOrderAmount?.toString() || '',
      isActive: promo.isActive,
    });
    setEditingId(promo.id);
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-foreground text-3xl font-bold">Promotions</h1>
        <Button onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancel' : '+ Create Promotion'}</Button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-card border-border rounded-lg border p-6">
          <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="text-foreground mb-2 block text-sm font-medium">Promo Code *</label>
              <input type="text" name="code" placeholder="SUMMER20" value={formData.code} onChange={handleInputChange} required className="border-border bg-background text-foreground w-full rounded-lg border px-3 py-2" />
            </div>

            <div>
              <label className="text-foreground mb-2 block text-sm font-medium">Type *</label>
              <select name="type" value={formData.type} onChange={handleInputChange} className="border-border bg-background text-foreground w-full rounded-lg border px-3 py-2">
                <option value="PERCENTAGE">Percentage Off</option>
                <option value="FIXED_AMOUNT">Fixed Amount Off</option>
                <option value="FREE_SHIPPING">Free Shipping</option>
              </select>
            </div>
          </div>

          {formData.type !== 'FREE_SHIPPING' && (
            <div className="mb-4">
              <label className="text-foreground mb-2 block text-sm font-medium">{formData.type === 'PERCENTAGE' ? 'Discount %' : 'Amount ($)'} *</label>
              <input type="number" name="value" placeholder={formData.type === 'PERCENTAGE' ? '20' : '10'} step={formData.type === 'PERCENTAGE' ? '1' : '0.01'} value={formData.value} onChange={handleInputChange} required className="border-border bg-background text-foreground w-full rounded-lg border px-3 py-2" />
            </div>
          )}

          <div className="mb-4">
            <label className="text-foreground mb-2 block text-sm font-medium">Description</label>
            <textarea name="description" placeholder="Promotion details" value={formData.description} onChange={handleInputChange} className="border-border bg-background text-foreground h-20 w-full rounded-lg border px-3 py-2" />
          </div>

          <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="text-foreground mb-2 block text-sm font-medium">Start Date *</label>
              <input type="date" name="startDate" value={formData.startDate} onChange={handleInputChange} required className="border-border bg-background text-foreground w-full rounded-lg border px-3 py-2" />
            </div>

            <div>
              <label className="text-foreground mb-2 block text-sm font-medium">End Date *</label>
              <input type="date" name="endDate" value={formData.endDate} onChange={handleInputChange} required className="border-border bg-background text-foreground w-full rounded-lg border px-3 py-2" />
            </div>
          </div>

          <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="text-foreground mb-2 block text-sm font-medium">Max Uses</label>
              <input type="number" name="maxUses" placeholder="Leave empty for unlimited" value={formData.maxUses} onChange={handleInputChange} className="border-border bg-background text-foreground w-full rounded-lg border px-3 py-2" />
            </div>

            <div>
              <label className="text-foreground mb-2 block text-sm font-medium">Minimum Order ($)</label>
              <input type="number" name="minOrderAmount" placeholder="Minimum order amount" step="0.01" value={formData.minOrderAmount} onChange={handleInputChange} className="border-border bg-background text-foreground w-full rounded-lg border px-3 py-2" />
            </div>
          </div>

          <label className="mb-4 flex items-center gap-2">
            <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleInputChange} className="h-4 w-4" />
            <span className="text-foreground">Active</span>
          </label>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? 'Saving...' : editingId ? 'Update Promotion' : 'Create Promotion'}
          </Button>
        </form>
      )}

      {/* Promotions List */}
      {promotions && promotions.length > 0 ? (
        <div className="bg-card border-border overflow-hidden rounded-lg border">
          <table className="w-full">
            <thead className="bg-muted border-border border-b">
              <tr>
                <th className="text-foreground px-6 py-3 text-left text-sm font-semibold">Code</th>
                <th className="text-foreground px-6 py-3 text-left text-sm font-semibold">Type</th>
                <th className="text-foreground px-6 py-3 text-left text-sm font-semibold">Value</th>
                <th className="text-foreground px-6 py-3 text-left text-sm font-semibold">Valid Until</th>
                <th className="text-foreground px-6 py-3 text-left text-sm font-semibold">Uses</th>
                <th className="text-foreground px-6 py-3 text-left text-sm font-semibold">Status</th>
                <th className="text-foreground px-6 py-3 text-left text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {promotions.map((promo: Promotion) => (
                <tr key={promo.id} className="hover:bg-muted/50">
                  <td className="text-foreground px-6 py-4 font-semibold">{promo.code}</td>
                  <td className="text-muted-foreground px-6 py-4 text-sm">{promo.type === 'PERCENTAGE' ? '%' : promo.type === 'FIXED_AMOUNT' ? '$' : 'Free Ship'}</td>
                  <td className="text-muted-foreground px-6 py-4 text-sm">{promo.type === 'PERCENTAGE' ? `${promo.value}%` : promo.type === 'FIXED_AMOUNT' ? `$${promo.value}` : '-'}</td>
                  <td className="text-muted-foreground px-6 py-4 text-sm">{new Date(promo.endDate).toLocaleDateString()}</td>
                  <td className="text-muted-foreground px-6 py-4 text-sm">
                    {promo.currentUses} {promo.maxUses ? `/ ${promo.maxUses}` : ''}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`rounded px-2 py-1 text-xs ${promo.isActive ? 'bg-green-500/20 text-green-700' : 'bg-red-500/20 text-red-700'}`}>{promo.isActive ? 'Active' : 'Inactive'}</span>
                  </td>
                  <td className="space-x-2 px-6 py-4">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(promo)}>
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(promo.id)} className="text-red-600">
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-muted-foreground py-8 text-center">No promotions yet</div>
      )}
    </div>
  );
}
