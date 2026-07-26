'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';

interface DeliveryZone {
  id: string;
  name: string;
  state?: string;
  zipCodes: string[];
  baseCost: number;
  freeDeliveryOver?: number;
  estimatedDays: number;
  isActive: boolean;
}

export default function DeliveryPage() {
  const { data: zones, mutate } = useSWR('/api/admin/delivery-zones');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    state: '',
    zipCodes: '',
    baseCost: '',
    freeDeliveryOver: '',
    estimatedDays: '',
    isActive: true,
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
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
      const zipCodeArray = formData.zipCodes
        .split(',')
        .map((z) => z.trim())
        .filter((z) => z);

      const payload = {
        name: formData.name,
        state: formData.state,
        zipCodes: zipCodeArray,
        baseCost: parseFloat(formData.baseCost),
        freeDeliveryOver: formData.freeDeliveryOver ? parseFloat(formData.freeDeliveryOver) : null,
        estimatedDays: parseInt(formData.estimatedDays),
        isActive: formData.isActive,
      };

      const url = editingId
        ? `/api/admin/delivery-zones/${editingId}`
        : '/api/admin/delivery-zones';

      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(editingId ? 'Zone updated' : 'Zone created');
        mutate();
        setShowForm(false);
        setEditingId(null);
        setFormData({
          name: '',
          state: '',
          zipCodes: '',
          baseCost: '',
          freeDeliveryOver: '',
          estimatedDays: '',
          isActive: true,
        });
      }
    } catch (error) {
      toast.error('Failed to save zone');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this delivery zone?')) return;

    try {
      const res = await fetch(`/api/admin/delivery-zones/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Zone deleted');
        mutate();
      }
    } catch (error) {
      toast.error('Failed to delete zone');
    }
  };

  const handleEdit = (zone: DeliveryZone) => {
    setFormData({
      name: zone.name,
      state: zone.state || '',
      zipCodes: zone.zipCodes.join(', '),
      baseCost: zone.baseCost.toString(),
      freeDeliveryOver: zone.freeDeliveryOver?.toString() || '',
      estimatedDays: zone.estimatedDays.toString(),
      isActive: zone.isActive,
    });
    setEditingId(zone.id);
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-foreground text-3xl font-bold">Delivery Zones</h1>
        <Button onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancel' : '+ Add Zone'}</Button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-card border-border rounded-lg border p-6">
          <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="text-foreground mb-2 block text-sm font-medium">Zone Name *</label>
              <input
                type="text"
                name="name"
                placeholder="e.g., North Texas"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="border-border bg-background text-foreground w-full rounded-lg border px-3 py-2"
              />
            </div>

            <div>
              <label className="text-foreground mb-2 block text-sm font-medium">State</label>
              <input
                type="text"
                name="state"
                placeholder="e.g., TX"
                value={formData.state}
                onChange={handleInputChange}
                className="border-border bg-background text-foreground w-full rounded-lg border px-3 py-2"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="text-foreground mb-2 block text-sm font-medium">
              Zip Codes (comma-separated) *
            </label>
            <textarea
              name="zipCodes"
              placeholder="75001, 75002, 75003"
              value={formData.zipCodes}
              onChange={handleInputChange}
              required
              className="border-border bg-background text-foreground h-20 w-full rounded-lg border px-3 py-2"
            />
          </div>

          <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="text-foreground mb-2 block text-sm font-medium">
                Base Cost ($) *
              </label>
              <input
                type="number"
                name="baseCost"
                placeholder="5.99"
                step="0.01"
                value={formData.baseCost}
                onChange={handleInputChange}
                required
                className="border-border bg-background text-foreground w-full rounded-lg border px-3 py-2"
              />
            </div>

            <div>
              <label className="text-foreground mb-2 block text-sm font-medium">
                Free Delivery Over ($)
              </label>
              <input
                type="number"
                name="freeDeliveryOver"
                placeholder="50"
                step="0.01"
                value={formData.freeDeliveryOver}
                onChange={handleInputChange}
                className="border-border bg-background text-foreground w-full rounded-lg border px-3 py-2"
              />
            </div>

            <div>
              <label className="text-foreground mb-2 block text-sm font-medium">
                Estimated Days *
              </label>
              <input
                type="number"
                name="estimatedDays"
                placeholder="2"
                value={formData.estimatedDays}
                onChange={handleInputChange}
                required
                className="border-border bg-background text-foreground w-full rounded-lg border px-3 py-2"
              />
            </div>
          </div>

          <label className="mb-4 flex items-center gap-2">
            <input
              type="checkbox"
              name="isActive"
              checked={formData.isActive}
              onChange={handleInputChange}
              className="h-4 w-4"
            />
            <span className="text-foreground">Active</span>
          </label>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? 'Saving...' : editingId ? 'Update Zone' : 'Create Zone'}
          </Button>
        </form>
      )}

      {/* Zones List */}
      {zones && zones.length > 0 ? (
        <div className="bg-card border-border overflow-hidden rounded-lg border">
          <table className="w-full">
            <thead className="bg-muted border-border border-b">
              <tr>
                <th className="text-foreground px-6 py-3 text-left text-sm font-semibold">Zone</th>
                <th className="text-foreground px-6 py-3 text-left text-sm font-semibold">State</th>
                <th className="text-foreground px-6 py-3 text-left text-sm font-semibold">
                  Base Cost
                </th>
                <th className="text-foreground px-6 py-3 text-left text-sm font-semibold">
                  Est. Days
                </th>
                <th className="text-foreground px-6 py-3 text-left text-sm font-semibold">
                  Status
                </th>
                <th className="text-foreground px-6 py-3 text-left text-sm font-semibold">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {zones.map((zone: DeliveryZone) => (
                <tr key={zone.id} className="hover:bg-muted/50">
                  <td className="text-foreground px-6 py-4 font-medium">{zone.name}</td>
                  <td className="text-muted-foreground px-6 py-4 text-sm">{zone.state || '-'}</td>
                  <td className="text-muted-foreground px-6 py-4 text-sm">
                    ${zone.baseCost.toFixed(2)}
                  </td>
                  <td className="text-muted-foreground px-6 py-4 text-sm">
                    {zone.estimatedDays} days
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`rounded px-2 py-1 text-xs ${
                        zone.isActive
                          ? 'bg-green-500/20 text-green-700'
                          : 'bg-red-500/20 text-red-700'
                      }`}
                    >
                      {zone.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="space-x-2 px-6 py-4">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(zone)}>
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(zone.id)}
                      className="text-red-600"
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-muted-foreground py-8 text-center">No delivery zones yet</div>
      )}
    </div>
  );
}
