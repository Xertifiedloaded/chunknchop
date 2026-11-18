'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { Plus, Trash2, Tags, LoaderCircle, Layers3, ArrowUpRight } from 'lucide-react';

export default function CategoriesPage() {
  const [items, setItems] = useState<string[]>([]);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function load() {
    const response = await fetch('/api/admin/categories', { cache: 'no-store' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Unable to load categories');
    setItems(data.categories || []);
  }
  useEffect(() => {
    void load().catch((err) => setError(err.message));
  }, []);
  async function add(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to add category');
      setName('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to add category');
    } finally {
      setBusy(false);
    }
  }
  async function remove(value: string) {
    if (!window.confirm(`Delete category “${value}”?`)) return;
    setBusy(true);
    setError('');
    try {
      const response = await fetch(`/api/admin/categories?name=${encodeURIComponent(value)}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to delete category');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete category');
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="mx-auto max-w-5xl px-4 py-7 text-[#29231f] sm:px-6 sm:py-9">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="mb-1.5 text-[9px] font-bold uppercase tracking-[.2em] text-[#d2582f]">
            Catalogue management
          </p>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Product categories</h1>
          <p className="mt-1 max-w-xl text-[11px] leading-5 text-[#827970]">
            Organise your store with clear categories. Products already using a category must be
            reassigned before it can be removed.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f7eee8] px-3 py-1.5 text-[10px] font-semibold text-[#9f4d30]">
          <Layers3 size={12} />
          {items.length} categories
        </span>
      </div>
      <div className="grid gap-5 lg:grid-cols-[.85fr_1.15fr]">
        <section className="h-fit rounded-2xl border border-[#eee8e2] bg-white p-4 shadow-[0_5px_24px_rgba(45,32,20,.035)] sm:p-5">
          <div className="mb-4 flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#fff1e9] text-[#d2582f]">
              <Plus size={15} />
            </span>
            <div>
              <h2 className="text-[12px] font-bold">Add a category</h2>
              <p className="text-[10px] text-[#938a81]">Create a new catalogue group</p>
            </div>
          </div>
          <form onSubmit={add} className="space-y-3">
            <label
              className="block text-[10px] font-semibold text-[#51483f]"
              htmlFor="category-name"
            >
              Category name
            </label>
            <input
              id="category-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={50}
              required
              placeholder="e.g. Goat Meat, Seafood, Meat Boxes"
              className="h-10 w-full rounded-xl border border-[#e8e2dc] bg-[#fcfbf9] px-3 text-[11px] outline-none transition focus:border-[#d2582f] focus:ring-2 focus:ring-[#d2582f]/10"
            />
            <button
              disabled={busy || !name.trim()}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#29231f] px-4 text-[10px] font-bold text-white transition hover:bg-[#4a3930] disabled:opacity-50"
            >
              {busy ? <LoaderCircle size={13} className="animate-spin" /> : <Plus size={13} />} Add
              category
            </button>
          </form>
          <div className="mt-4 rounded-xl bg-[#faf7f3] p-3">
            <p className="text-[10px] font-semibold text-[#62584e]">Helpful tip</p>
            <p className="mt-1 text-[10px] leading-4 text-[#8c8278]">
              Use short names customers can scan quickly, such as Beef, Poultry, Offals or Meat
              Boxes.
            </p>
          </div>
        </section>
        <section className="overflow-hidden rounded-2xl border border-[#eee8e2] bg-white shadow-[0_5px_24px_rgba(45,32,20,.035)]">
          <div className="flex items-center justify-between border-b border-[#f0ece7] px-4 py-3.5">
            <div className="flex items-center gap-2">
              <Tags size={15} className="text-[#d2582f]" />
              <h2 className="text-[12px] font-bold">All categories</h2>
            </div>
            <span className="text-[9px] text-[#938a81]">Manage catalogue groups</span>
          </div>
          {error && (
            <p role="alert" className="m-3 rounded-lg bg-red-50 px-3 py-2 text-[10px] text-red-700">
              {error}
            </p>
          )}
          {items.length ? (
            <div className="divide-y divide-[#f3efea]">
              {items.map((item, index) => (
                <div
                  key={item}
                  className="flex items-center justify-between gap-3 px-4 py-3 transition hover:bg-[#fcfaf7]"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[#f8f3ed] text-[9px] font-bold text-[#9b6b42]">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="truncate text-[11px] font-semibold text-[#39312b]">
                      {item}
                    </span>
                  </div>
                  <button
                    disabled={busy}
                    onClick={() => void remove(item)}
                    aria-label={`Delete ${item}`}
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[#a34c37] transition hover:bg-red-50 disabled:opacity-40"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-5 py-12 text-center">
              <Tags size={22} className="mx-auto text-[#c7b8a8]" />
              <p className="mt-2 text-[11px] font-semibold text-[#62584e]">No categories found</p>
              <p className="mt-1 text-[10px] text-[#938a81]">
                Add your first category to organise products.
              </p>
            </div>
          )}
          <div className="border-t border-[#f0ece7] bg-[#fcfbf9] px-4 py-2.5">
            <p className="flex items-center gap-1.5 text-[9px] text-[#938a81]">
              <ArrowUpRight size={11} /> Categories already used by products are protected from
              accidental deletion.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
