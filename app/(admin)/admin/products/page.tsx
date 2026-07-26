'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Trash2, Edit2 } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  meatType: string;
  basePrice: number;
  stock: number;
  inStock: boolean;
  rating: number;
  reviewCount: number;
  isNewArrival: boolean;
  isBestSeller: boolean;
}

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const response = await fetch('/api/admin/products');
        const data = await response.json();
        setProducts(data);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
      setProducts(products.filter((p) => p.id !== id));
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Products</h1>
          <p className="text-slate-600">Manage all products</p>
        </div>
        <Link
          href="/admin/products/new"
          className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700"
        >
          <Plus size={20} />
          Add Product
        </Link>
      </div>

      <div className="overflow-x-auto rounded-lg bg-white shadow">
        <table className="w-full">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Name</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Type</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Price</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Stock</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Rating</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Badges</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-b border-slate-200 hover:bg-slate-50">
                <td className="px-6 py-3 text-sm text-slate-900">{product.name}</td>
                <td className="px-6 py-3 text-sm text-slate-600">{product.meatType}</td>
                <td className="px-6 py-3 text-sm text-slate-900">
                  ${product.basePrice.toFixed(2)}
                </td>
                <td className="px-6 py-3 text-sm">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      product.inStock
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {product.stock} in stock
                  </span>
                </td>
                <td className="px-6 py-3 text-sm">
                  ⭐ {product.rating.toFixed(1)} ({product.reviewCount})
                </td>
                <td className="px-6 py-3 text-sm">
                  <div className="flex gap-1">
                    {product.isNewArrival && (
                      <span className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-800">
                        New
                      </span>
                    )}
                    {product.isBestSeller && (
                      <span className="rounded bg-yellow-100 px-2 py-1 text-xs text-yellow-800">
                        Best
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-3 text-sm">
                  <div className="flex gap-2">
                    <Link
                      href={`/admin/products/${product.id}/edit`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Edit2 size={18} />
                    </Link>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
