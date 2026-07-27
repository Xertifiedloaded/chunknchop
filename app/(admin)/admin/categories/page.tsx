'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';

interface Category {
  id: string;
  name: string;
  description?: string;
  slug: string;
  isActive: boolean;
}

export default function CategoriesPage() {
  const { data: categories, mutate } = useSWR('/api/admin/categories');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    slug: '',
    isActive: true,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    });
  };

  const handleGenerateSlug = () => {
    const slug = formData.name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '');
    setFormData({ ...formData, slug });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const url = editingId ? `/api/admin/categories/${editingId}` : '/api/admin/categories';

      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success(editingId ? 'Category updated' : 'Category created');
        mutate();
        setShowForm(false);
        setEditingId(null);
        setFormData({
          name: '',
          description: '',
          slug: '',
          isActive: true,
        });
      }
    } catch (error) {
      toast.error('Failed to save category');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this category?')) return;

    try {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Category deleted');
        mutate();
      }
    } catch (error) {
      toast.error('Failed to delete category');
    }
  };

  const handleEdit = (category: Category) => {
    setFormData(category);
    setEditingId(category.id);
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-foreground text-3xl font-bold">Categories</h1>
        <Button onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancel' : '+ Add Category'}</Button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-card border-border rounded-lg border p-6">
          <div className="space-y-4">
            <div>
              <label className="text-foreground mb-2 block text-sm font-medium">Category Name *</label>
              <input type="text" name="name" placeholder="e.g., Premium Beef" value={formData.name} onChange={handleInputChange} required className="border-border bg-background text-foreground w-full rounded-lg border px-3 py-2" />
            </div>

            <div>
              <label className="text-foreground mb-2 block text-sm font-medium">Description</label>
              <textarea name="description" placeholder="Category description" value={formData.description} onChange={handleInputChange} className="border-border bg-background text-foreground h-24 w-full rounded-lg border px-3 py-2" />
            </div>

            <div>
              <label className="text-foreground mb-2 block text-sm font-medium">Slug</label>
              <div className="flex gap-2">
                <input type="text" name="slug" placeholder="e.g., premium-beef" value={formData.slug} onChange={handleInputChange} className="border-border bg-background text-foreground flex-1 rounded-lg border px-3 py-2" />
                <Button variant="outline" type="button" onClick={handleGenerateSlug}>
                  Generate
                </Button>
              </div>
            </div>

            <label className="flex items-center gap-2">
              <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleInputChange} className="h-4 w-4" />
              <span className="text-foreground">Active</span>
            </label>

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? 'Saving...' : editingId ? 'Update Category' : 'Create Category'}
            </Button>
          </div>
        </form>
      )}

      {/* Categories List */}
      {categories && categories.length > 0 ? (
        <div className="bg-card border-border overflow-hidden rounded-lg border">
          <table className="w-full">
            <thead className="bg-muted border-border border-b">
              <tr>
                <th className="text-foreground px-6 py-3 text-left text-sm font-semibold">Name</th>
                <th className="text-foreground px-6 py-3 text-left text-sm font-semibold">Slug</th>
                <th className="text-foreground px-6 py-3 text-left text-sm font-semibold">Status</th>
                <th className="text-foreground px-6 py-3 text-left text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {categories.map((category: Category) => (
                <tr key={category.id} className="hover:bg-muted/50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-foreground font-medium">{category.name}</p>
                      {category.description && <p className="text-muted-foreground text-sm">{category.description}</p>}
                    </div>
                  </td>
                  <td className="text-muted-foreground px-6 py-4 text-sm">{category.slug}</td>
                  <td className="px-6 py-4">
                    <span className={`rounded px-2 py-1 text-xs ${category.isActive ? 'bg-green-500/20 text-green-700' : 'bg-red-500/20 text-red-700'}`}>{category.isActive ? 'Active' : 'Inactive'}</span>
                  </td>
                  <td className="space-x-2 px-6 py-4">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(category)}>
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(category.id)} className="text-red-600">
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-muted-foreground py-8 text-center">No categories yet</div>
      )}
    </div>
  );
}
