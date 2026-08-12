'use client';

import { useEffect, useState } from 'react';
import { ChevronDown, GripVertical, Loader2, Pencil, Plus, Trash2, X, Check } from 'lucide-react';
import { fetchWithAuth } from '@/lib/fetchClient';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  products: number;
  revenue: number;
  share: number;
  color: string;
  visible: boolean;
}

interface EditableFields {
  name: string;
  slug: string;
  description: string;
  color: string;
  visible: boolean;
}

function toEditable(category: Category): EditableFields {
  return {
    name: category.name,
    slug: category.slug.replace(/^\//, ''),
    description: category.description ?? '',
    color: category.color,
    visible: category.visible,
  };
}

function formatRevenue(revenue: number) {
  return revenue.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

async function parseError(res: Response, fallback: string) {
  try {
    const body = await res.json();
    return body?.error ?? fallback;
  } catch {
    return fallback;
  }
}

function CategoryCard({
  category,
  onSave,
  onDelete,
}: {
  category: Category;
  onSave: (id: string, fields: EditableFields) => Promise<string | null>;
  onDelete: (id: string) => Promise<string | null>;
}) {
  const [editing, setEditing] = useState(false);
  const [fields, setFields] = useState<EditableFields>(toEditable(category));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  function startEdit() {
    setFields(toEditable(category));
    setError(null);
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setError(null);
  }

  async function save() {
    setSaving(true);
    setError(null);
    const err = await onSave(category.id, fields);
    setSaving(false);
    if (err) {
      setError(err);
      return;
    }
    setEditing(false);
  }

  async function confirmDelete() {
    setDeleting(true);
    setError(null);
    const err = await onDelete(category.id);
    setDeleting(false);
    if (err) {
      setError(err);
      setConfirmingDelete(false);
      return;
    }
  }

  if (editing) {
    return (
      <article className="group relative min-w-0 overflow-hidden rounded-[17px] border border-[#e8e5e2] bg-white shadow-[0_3px_12px_rgba(0,0,0,0.035)]">
        <div className="absolute inset-x-0 top-0 h-[3px]" style={{ backgroundColor: fields.color }} />

        <div className="space-y-[10px] p-4 pt-[18px] sm:p-[18px] sm:pt-[19px]">
          <div>
            <label className="text-[9px] font-medium text-[#8f8983]">Name</label>
            <input
              value={fields.name}
              onChange={(e) => setFields((f) => ({ ...f, name: e.target.value }))}
              className="mt-[3px] w-full rounded-[10px] border border-[#ddd9d5] px-[10px] py-[7px] text-[13px] font-semibold text-[#2f2d2b] outline-none focus:border-[#f3652a]"
            />
          </div>

          <div>
            <label className="text-[9px] font-medium text-[#8f8983]">Slug</label>
            <input
              value={fields.slug}
              onChange={(e) => setFields((f) => ({ ...f, slug: e.target.value }))}
              className="mt-[3px] w-full rounded-[10px] border border-[#ddd9d5] px-[10px] py-[7px] text-[11px] text-[#4a4642] outline-none focus:border-[#f3652a]"
            />
          </div>

          <div>
            <label className="text-[9px] font-medium text-[#8f8983]">Description</label>
            <textarea
              value={fields.description}
              onChange={(e) => setFields((f) => ({ ...f, description: e.target.value }))}
              rows={2}
              className="mt-[3px] w-full resize-none rounded-[10px] border border-[#ddd9d5] px-[10px] py-[7px] text-[11px] text-[#4a4642] outline-none focus:border-[#f3652a]"
            />
          </div>

          <div className="flex items-center gap-[10px]">
            <div>
              <label className="text-[9px] font-medium text-[#8f8983]">Color</label>
              <input
                type="color"
                value={fields.color}
                onChange={(e) => setFields((f) => ({ ...f, color: e.target.value }))}
                className="mt-[3px] block h-[28px] w-[44px] cursor-pointer rounded-[8px] border border-[#ddd9d5] p-[2px]"
              />
            </div>

            <label className="mt-[13px] flex items-center gap-[6px] text-[11px] font-medium text-[#4a4642]">
              <input
                type="checkbox"
                checked={fields.visible}
                onChange={(e) => setFields((f) => ({ ...f, visible: e.target.checked }))}
              />
              Visible in storefront
            </label>
          </div>

          {error && <p className="text-[10px] font-medium text-[#d9412f]">{error}</p>}

          <div className="flex items-center justify-end gap-[8px] pt-[2px]">
            <button
              type="button"
              onClick={cancelEdit}
              disabled={saving}
              className="inline-flex h-[30px] items-center gap-[5px] rounded-[9px] border border-[#ddd9d5] bg-white px-[11px] text-[11px] font-semibold text-[#4a4642] transition hover:bg-[#fafafa] disabled:opacity-50"
            >
              <X size={13} strokeWidth={2.5} />
              Cancel
            </button>

            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="inline-flex h-[30px] items-center gap-[5px] rounded-[9px] bg-[#f3652a] px-[11px] text-[11px] font-semibold text-white transition hover:bg-[#e9581f] disabled:opacity-60"
            >
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} strokeWidth={2.5} />}
              Save
            </button>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="group relative min-w-0 overflow-hidden rounded-[17px] border border-[#e8e5e2] bg-white shadow-[0_3px_12px_rgba(0,0,0,0.035)] transition-shadow duration-200 hover:shadow-[0_5px_18px_rgba(0,0,0,0.07)]">
      <div className="absolute inset-x-0 top-0 h-[3px]" style={{ backgroundColor: category.color }} />

      <div className="p-4 pt-[18px] sm:p-[18px] sm:pt-[19px]">
        <div className="flex items-start gap-2">
          <GripVertical size={14} strokeWidth={2} className="mt-[3px] shrink-0 text-[#d5d1cd]" />

          <div className="min-w-0 flex-1">
            <h3 className="truncate text-[14px] leading-[17px] font-semibold text-[#2f2d2b]">{category.name}</h3>
            <p className="mt-[1px] text-[11px] leading-[14px] text-[#99938d]">{category.slug}</p>
          </div>

          <div className="flex shrink-0 items-center gap-[4px] opacity-0 transition-opacity group-hover:opacity-100">
            <button
              type="button"
              onClick={startEdit}
              title="Edit"
              className="flex h-[24px] w-[24px] items-center justify-center rounded-[7px] text-[#8f8983] transition hover:bg-[#f5f5f4] hover:text-[#4a4642]"
            >
              <Pencil size={13} strokeWidth={2} />
            </button>

            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              title="Delete"
              className="flex h-[24px] w-[24px] items-center justify-center rounded-[7px] text-[#8f8983] transition hover:bg-[#fbe9e6] hover:text-[#d9412f]"
            >
              <Trash2 size={13} strokeWidth={2} />
            </button>
          </div>
        </div>

        <div className="mt-[14px] grid grid-cols-2 gap-[10px]">
          <div className="min-w-0 rounded-[14px] bg-[#f5f5f4] px-[12px] py-[9px]">
            <p className="text-[9px] leading-[12px] font-medium text-[#8f8983]">Products</p>
            <p className="mt-[3px] text-[15px] leading-[17px] font-bold tracking-[-0.2px] text-[#36322f]">{category.products}</p>
          </div>

          <div className="min-w-0 rounded-[14px] bg-[#f5f5f4] px-[12px] py-[9px]">
            <p className="text-[9px] leading-[12px] font-medium text-[#8f8983]">Revenue</p>
            <p className="mt-[3px] truncate text-[15px] leading-[17px] font-bold tracking-[-0.2px] text-[#36322f]">
              ▣{formatRevenue(category.revenue)}
            </p>
          </div>
        </div>

        <div className="mt-[12px]">
          <div className="mb-[5px] flex items-center justify-between">
            <span className="text-[10px] font-medium text-[#98918b]">Share of revenue</span>
            <span className="text-[10px] font-semibold text-[#4b4744]">{category.share}%</span>
          </div>

          <div className="h-[5px] overflow-hidden rounded-full bg-[#e8e6e4]">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${category.share * 3.85}%`, backgroundColor: category.color }}
            />
          </div>
        </div>

        <div className="mt-[14px] flex items-center justify-between">
          {category.visible ? (
            <span className="inline-flex items-center gap-[5px] rounded-full bg-[#e9faf2] px-[9px] py-[4px] text-[9px] leading-none font-semibold text-[#0da45b]">
              <span className="h-[5px] w-[5px] rounded-full bg-[#13c76b]" />
              Visible in storefront
            </span>
          ) : (
            <span className="inline-flex items-center gap-[5px] rounded-full bg-[#eeeceb] px-[9px] py-[4px] text-[9px] leading-none font-semibold text-[#756f69]">
              <span className="h-[5px] w-[5px] rounded-full bg-[#918a84]" />
              Hidden
            </span>
          )}

          {confirmingDelete && (
            <div className="flex items-center gap-[6px]">
              <span className="text-[10px] font-medium text-[#d9412f]">Delete?</span>

              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                className="flex h-[22px] w-[22px] items-center justify-center rounded-[6px] bg-[#d9412f] text-white transition hover:bg-[#c23824] disabled:opacity-60"
              >
                {deleting ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} strokeWidth={2.5} />}
              </button>

              <button
                type="button"
                onClick={() => setConfirmingDelete(false)}
                disabled={deleting}
                className="flex h-[22px] w-[22px] items-center justify-center rounded-[6px] border border-[#ddd9d5] text-[#4a4642] transition hover:bg-[#fafafa]"
              >
                <X size={11} strokeWidth={2.5} />
              </button>
            </div>
          )}
        </div>

        {error && !confirmingDelete && <p className="mt-[8px] text-[10px] font-medium text-[#d9412f]">{error}</p>}
      </div>
    </article>
  );
}

function NewCategoryCard({ onCreate, onCancel }: { onCreate: (fields: EditableFields) => Promise<string | null>; onCancel: () => void }) {
  const [fields, setFields] = useState<EditableFields>({ name: '', slug: '', description: '', color: '#f3652a', visible: true });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create() {
    if (!fields.name.trim()) {
      setError('Name is required');
      return;
    }
    setSaving(true);
    setError(null);
    const err = await onCreate(fields);
    setSaving(false);
    if (err) setError(err);
  }

  return (
    <article className="group relative min-w-0 overflow-hidden rounded-[17px] border-2 border-dashed border-[#f3652a] bg-white shadow-[0_3px_12px_rgba(0,0,0,0.035)]">
      <div className="space-y-[10px] p-4 pt-[18px] sm:p-[18px] sm:pt-[19px]">
        <div>
          <label className="text-[9px] font-medium text-[#8f8983]">Name</label>
          <input
            autoFocus
            value={fields.name}
            onChange={(e) => setFields((f) => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Bakery"
            className="mt-[3px] w-full rounded-[10px] border border-[#ddd9d5] px-[10px] py-[7px] text-[13px] font-semibold text-[#2f2d2b] outline-none focus:border-[#f3652a]"
          />
        </div>

        <div>
          <label className="text-[9px] font-medium text-[#8f8983]">Slug (optional)</label>
          <input
            value={fields.slug}
            onChange={(e) => setFields((f) => ({ ...f, slug: e.target.value }))}
            placeholder="auto-generated from name"
            className="mt-[3px] w-full rounded-[10px] border border-[#ddd9d5] px-[10px] py-[7px] text-[11px] text-[#4a4642] outline-none focus:border-[#f3652a]"
          />
        </div>

        <div>
          <label className="text-[9px] font-medium text-[#8f8983]">Description</label>
          <textarea
            value={fields.description}
            onChange={(e) => setFields((f) => ({ ...f, description: e.target.value }))}
            rows={2}
            className="mt-[3px] w-full resize-none rounded-[10px] border border-[#ddd9d5] px-[10px] py-[7px] text-[11px] text-[#4a4642] outline-none focus:border-[#f3652a]"
          />
        </div>

        <div className="flex items-center gap-[10px]">
          <div>
            <label className="text-[9px] font-medium text-[#8f8983]">Color</label>
            <input
              type="color"
              value={fields.color}
              onChange={(e) => setFields((f) => ({ ...f, color: e.target.value }))}
              className="mt-[3px] block h-[28px] w-[44px] cursor-pointer rounded-[8px] border border-[#ddd9d5] p-[2px]"
            />
          </div>

          <label className="mt-[13px] flex items-center gap-[6px] text-[11px] font-medium text-[#4a4642]">
            <input
              type="checkbox"
              checked={fields.visible}
              onChange={(e) => setFields((f) => ({ ...f, visible: e.target.checked }))}
            />
            Visible in storefront
          </label>
        </div>

        {error && <p className="text-[10px] font-medium text-[#d9412f]">{error}</p>}

        <div className="flex items-center justify-end gap-[8px] pt-[2px]">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="inline-flex h-[30px] items-center gap-[5px] rounded-[9px] border border-[#ddd9d5] bg-white px-[11px] text-[11px] font-semibold text-[#4a4642] transition hover:bg-[#fafafa] disabled:opacity-50"
          >
            <X size={13} strokeWidth={2.5} />
            Cancel
          </button>

          <button
            type="button"
            onClick={create}
            disabled={saving}
            className="inline-flex h-[30px] items-center gap-[5px] rounded-[9px] bg-[#f3652a] px-[11px] text-[11px] font-semibold text-white transition hover:bg-[#e9581f] disabled:opacity-60"
          >
            {saving ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} strokeWidth={2.5} />}
            Create
          </button>
        </div>
      </div>
    </article>
  );
}

function RuleCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[14px] border border-[#e7e3df] bg-white px-[14px] py-[13px]">
      <h3 className="text-[11px] font-bold text-[#36322f]">{title}</h3>
      <p className="mt-[5px] text-[10px] leading-[15px] text-[#8d8781]">{children}</p>
    </div>
  );
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  async function load() {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetchWithAuth('/api/admin/categories');
      if (!res.ok) {
        setLoadError(await parseError(res, 'Failed to load categories'));
        return;
      }
      const data: Category[] = await res.json();
      setCategories(data);
    } catch {
      setLoadError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSave(id: string, fields: EditableFields): Promise<string | null> {
    try {
      const res = await fetchWithAuth(`/api/admin/categories/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fields.name,
          slug: fields.slug,
          description: fields.description,
          color: fields.color,
          visible: fields.visible,
        }),
      });

      if (!res.ok) return await parseError(res, 'Failed to update category');

      const updated = await res.json();
      setCategories((prev) =>
        prev.map((c) =>
          c.id === id
            ? {
                ...c,
                name: updated.name,
                slug: updated.slug,
                description: updated.description,
                image: updated.image,
                products: updated.products ?? c.products,
                color: updated.color,
                visible: updated.visible,
              }
            : c
        )
      );
      return null;
    } catch {
      return 'Failed to update category';
    }
  }

  async function handleDelete(id: string): Promise<string | null> {
    try {
      const res = await fetchWithAuth(`/api/admin/categories/${id}`, { method: 'DELETE' });
      if (!res.ok) return await parseError(res, 'Failed to delete category');
      setCategories((prev) => prev.filter((c) => c.id !== id));
      return null;
    } catch {
      return 'Failed to delete category';
    }
  }

  async function handleCreate(fields: EditableFields): Promise<string | null> {
    try {
      const res = await fetchWithAuth('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fields.name,
          slug: fields.slug || undefined,
          description: fields.description,
          color: fields.color,
          visible: fields.visible,
        }),
      });

      if (!res.ok) return await parseError(res, 'Failed to create category');

      const created: Category = await res.json();
      setCategories((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      setCreating(false);
      return null;
    } catch {
      return 'Failed to create category';
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f8f9] px-4 py-5 text-[#302d2a] sm:px-5 lg:px-6">
      <div className="mx-auto w-full max-w-[1320px]">
        <header className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-[21px] leading-[25px] font-bold tracking-[-0.4px] text-[#292725]">Categories</h1>
            <p className="mt-[7px] text-[12px] leading-[17px] text-[#908a85]">
              Organise the catalogue into the storefront categories customers browse by.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={load}
              disabled={loading}
              className="inline-flex h-[35px] items-center justify-center rounded-[11px] border border-[#ddd9d5] bg-white px-[14px] text-[11px] font-semibold text-[#4a4642] shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition hover:bg-[#fafafa] disabled:opacity-50"
            >
              Refresh
            </button>

            <button
              type="button"
              onClick={() => setCreating(true)}
              className="inline-flex h-[35px] items-center justify-center gap-[7px] rounded-[11px] bg-[#f3652a] px-[14px] text-[11px] font-semibold text-white shadow-[0_2px_5px_rgba(243,101,42,0.2)] transition hover:bg-[#e9581f]"
            >
              <Plus size={15} strokeWidth={2.5} />
              New Category
            </button>
          </div>
        </header>

        {loadError && (
          <div className="mb-4 rounded-[12px] border border-[#f3c9c0] bg-[#fbeeea] px-[14px] py-[11px] text-[11px] font-medium text-[#b23a25]">
            {loadError}
          </div>
        )}

        <section className="grid grid-cols-1 gap-[14px] md:grid-cols-2 xl:grid-cols-3">
          {creating && <NewCategoryCard onCreate={handleCreate} onCancel={() => setCreating(false)} />}

          {loading &&
            !creating &&
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-[220px] animate-pulse rounded-[17px] border border-[#e8e5e2] bg-white" />
            ))}

          {!loading &&
            categories.map((category) => (
              <CategoryCard key={category.id} category={category} onSave={handleSave} onDelete={handleDelete} />
            ))}
        </section>

        {!loading && !creating && categories.length === 0 && !loadError && (
          <p className="mt-6 text-center text-[12px] text-[#908a85]">No categories yet — create your first one.</p>
        )}

        <section className="mt-[21px] rounded-[17px] border border-[#e8e5e2] bg-white p-4 shadow-[0_4px_16px_rgba(0,0,0,0.04)] sm:p-[18px]">
          <div>
            <h2 className="text-[13px] leading-[16px] font-bold text-[#3a3633]">Category rules</h2>
            <p className="mt-[3px] text-[10px] leading-[14px] text-[#99928c]">How categories behave across the storefront and processing floor</p>
          </div>

          <div className="mt-[13px] grid grid-cols-1 gap-[10px] lg:grid-cols-3">
            <RuleCard title="Preparation defaults">Each category carries default preparation options that pre-fill on new products.</RuleCard>
            <RuleCard title="Cold-chain class">Frozen and Seafood are routed to blast freezers; Dairy holds at 0–4°C.</RuleCard>
            <RuleCard title="Storefront ordering">Menu order follows this list — drag to reorder and publish instantly.</RuleCard>
          </div>
        </section>
      </div>
    </main>
  );
}