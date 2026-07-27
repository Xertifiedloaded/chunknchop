'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';

interface InventoryItem {
  id: string;
  name: string;
  sku?: string;
  stock: number;
  inStock: boolean;
  meatType: string;
}

export default function InventoryPage() {
  const { data: products, mutate } = useSWR('/api/admin/inventory');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newStock, setNewStock] = useState('');
  const [reason, setReason] = useState('ADJUSTMENT');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUpdateStock = async (productId: string) => {
    if (!newStock || isNaN(Number(newStock))) {
      toast.error('Enter a valid stock amount');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          newStock: Number(newStock),
          changeReason: reason,
          notes,
        }),
      });

      if (res.ok) {
        toast.success('Inventory updated');
        mutate();
        setEditingId(null);
        setNewStock('');
        setNotes('');
      } else {
        toast.error('Failed to update inventory');
      }
    } catch (error) {
      toast.error('Error updating inventory');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getLowStockWarning = (stock: number) => {
    if (stock < 5) return 'text-red-600 font-semibold';
    if (stock < 10) return 'text-yellow-600 font-semibold';
    return '';
  };

  return (
    <div className="space-y-6">
      <h1 className="text-foreground text-3xl font-bold">Inventory Management</h1>

      {/* Inventory List */}
      {products && products.length > 0 ? (
        <div className="bg-card border-border overflow-hidden rounded-lg border">
          <table className="w-full">
            <thead className="bg-muted border-border border-b">
              <tr>
                <th className="text-foreground px-6 py-3 text-left text-sm font-semibold">Product</th>
                <th className="text-foreground px-6 py-3 text-left text-sm font-semibold">Type</th>
                <th className="text-foreground px-6 py-3 text-left text-sm font-semibold">SKU</th>
                <th className="text-foreground px-6 py-3 text-left text-sm font-semibold">Current Stock</th>
                <th className="text-foreground px-6 py-3 text-left text-sm font-semibold">Status</th>
                <th className="text-foreground px-6 py-3 text-left text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {products.map((product: InventoryItem) => (
                <tr key={product.id}>
                  <td className="px-6 py-4">
                    <p className="text-foreground font-medium">{product.name}</p>
                  </td>
                  <td className="text-muted-foreground px-6 py-4 text-sm">{product.meatType}</td>
                  <td className="text-muted-foreground px-6 py-4 text-sm">{product.sku || '-'}</td>
                  <td className={`px-6 py-4 ${getLowStockWarning(product.stock)}`}>
                    {editingId === product.id ? (
                      <div className="flex gap-2">
                        <input type="number" value={newStock} onChange={(e) => setNewStock(e.target.value)} placeholder="New amount" className="border-border bg-background text-foreground w-20 rounded border px-2 py-1" />
                      </div>
                    ) : (
                      <span>{product.stock} units</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`rounded px-2 py-1 text-xs ${product.inStock ? 'bg-green-500/20 text-green-700' : 'bg-red-500/20 text-red-700'}`}>{product.inStock ? 'In Stock' : 'Out of Stock'}</span>
                  </td>
                  <td className="px-6 py-4">
                    {editingId === product.id ? (
                      <div className="space-y-2">
                        <div>
                          <select value={reason} onChange={(e) => setReason(e.target.value)} className="border-border bg-background text-foreground w-full rounded border px-2 py-1 text-xs">
                            <option value="ADJUSTMENT">Adjustment</option>
                            <option value="RESTOCK">Restock</option>
                            <option value="DAMAGE">Damage</option>
                            <option value="EXPIRY">Expiry</option>
                            <option value="RETURN">Return</option>
                          </select>
                        </div>
                        <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes" className="border-border bg-background text-foreground w-full rounded border px-2 py-1 text-xs" />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleUpdateStock(product.id)} disabled={isSubmitting}>
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingId(null);
                              setNewStock('');
                              setNotes('');
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingId(product.id);
                          setNewStock(product.stock.toString());
                        }}
                      >
                        Update
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-muted-foreground py-8 text-center">No products found</div>
      )}
    </div>
  );
}
