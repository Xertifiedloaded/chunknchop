
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ExternalLink, Plus, Circle, Pencil, Trash2, X, Eye, EyeOff, Loader2, Upload } from "lucide-react";
import { fetchWithAuth } from "@/lib/http/fetchClient";
import { ADMIN_TABS, getTabConfig, type AdminTab, type FieldDef } from "@/lib/cms/config";

const baseFor = (t: AdminTab) => (t === "CATEGORY" ? "/api/admin/categories" : "/api/admin/content");

type Entry = {
  id: string;
  type: AdminTab;
  title: string;
  slug: string | null;
  status: "DRAFT" | "LIVE";
  sortOrder: number;
  data: Record<string, any>;
  views: number;
  updatedAt: string;
};

async function api(url: string, method: string, body?: unknown) {
  const res = await fetchWithAuth(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(json.error ?? "Request failed"), { fieldErrors: json.fieldErrors });
  return json;
}

function StatusBadge({ status }: { status: "LIVE" | "DRAFT" }) {
  const draft = status === "DRAFT";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${draft ? "bg-[#fff8e7] text-[#c77b00]" : "bg-[#e9faf3] text-[#009765]"}`}>
      <Circle className="h-[6px] w-[6px] fill-current stroke-0" />
      {status.toLowerCase()}
    </span>
  );
}

const asText = (v: unknown) => (Array.isArray(v) ? v.join(" · ") : typeof v === "string" ? v : "");

export default function ContentManagementPage() {
  const [tab, setTab] = useState<AdminTab>("HERO");
  const [items, setItems] = useState<Entry[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Entry | "new" | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const reqId = useRef(0);

  const load = useCallback(async (type: AdminTab) => {
    const id = ++reqId.current;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchWithAuth(type === "CATEGORY" ? baseFor(type) : `${baseFor(type)}?type=${type}`, { cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Failed to load content");
      if (id !== reqId.current) return;
      setItems(json.items);
      setCounts((c) => ({ ...c, ...(json.counts ?? {}), ...(type === "CATEGORY" ? { CATEGORY: json.items.length } : {}) }));
    } catch (e) {
      if (id === reqId.current) setError(e instanceof Error ? e.message : "Failed to load content");
    } finally {
      if (id === reqId.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(tab);
  }, [tab, load]);

  const cfg = getTabConfig(tab);

  async function toggleStatus(e: Entry) {
    setBusyId(e.id);
    try {
      await api(`${baseFor(tab)}/${e.id}`, "PATCH", { status: e.status === "LIVE" ? "DRAFT" : "LIVE" });
      await load(tab);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(e: Entry) {
    if (!window.confirm(`Delete "${e.title}"? This removes it from the storefront.`)) return;
    setBusyId(e.id);
    try {
      await api(`${baseFor(tab)}/${e.id}`, "DELETE");
      await load(tab);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f8f9] px-5 py-8 text-[#302d29] md:px-8 lg:px-10">
      <div className="mx-auto max-w-[1260px]">
        <header className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-[26px] leading-tight font-bold tracking-[-0.5px]">Content Management</h1>
            <p className="mt-2 max-w-[700px] text-[14px] leading-6 text-[#8d8780]">
              Everything customers read on the storefront. Entries marked <b>live</b> appear on the site within ~30 seconds.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="flex h-10 items-center gap-2 rounded-xl border border-[#ddd8d2] bg-white px-4 text-[14px] font-medium shadow-sm transition hover:bg-[#faf9f8]"
            >
              <ExternalLink className="h-4 w-4" strokeWidth={2.2} /> Preview Site
            </a>
            <button
              type="button"
              onClick={() => setEditing("new")}
              className="flex h-10 items-center gap-2 rounded-xl bg-[#f15b2a] px-4 text-[14px] font-semibold text-white shadow-sm transition hover:bg-[#df4e20]"
            >
              <Plus className="h-[18px] w-[18px]" strokeWidth={2.5} /> New {cfg.singular}
            </button>
          </div>
        </header>

        <section className="overflow-hidden rounded-[20px] border border-[#e8e4e0] bg-white shadow-[0_4px_18px_rgba(35,30,25,0.05)]">
          <div className="flex min-h-[55px] items-center gap-1 overflow-x-auto border-b border-[#e8e4e0] px-4 py-2">
            {ADMIN_TABS.map((t) => {
              const active = tab === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={`flex shrink-0 items-center gap-2 rounded-[13px] px-3.5 py-2.5 text-[13px] font-semibold transition ${active ? "bg-[#2d2925] text-white" : "text-[#655e57] hover:bg-[#f5f3f1]"}`}
                >
                  {getTabConfig(t).label}
                  <span className={`flex h-[19px] min-w-[19px] items-center justify-center rounded-full px-1 text-[11px] font-semibold ${active ? "bg-[#514c47] text-white" : "bg-[#eeecea] text-[#6f6963]"}`}>
                    {counts[t] ?? 0}
                  </span>
                </button>
              );
            })}
          </div>

          {error && (
            <div className="flex items-center justify-between border-b border-[#f3d4d0] bg-[#fdf1ef] px-5 py-3 text-[13px] text-[#b3261e]">
              {error}
              <button onClick={() => load(tab)} className="font-semibold underline">
                Retry
              </button>
            </div>
          )}

          {loading ? (
            <div className="flex min-h-[270px] items-center justify-center text-[#918a83]">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex min-h-[270px] flex-col items-center justify-center gap-3 px-6 text-center">
              <p className="text-[13px] text-[#918a83]">No {cfg.label.toLowerCase()} yet.</p>
              <button onClick={() => setEditing("new")} className="rounded-xl bg-[#2d2925] px-4 py-2 text-[13px] font-semibold text-white">
                Add the first {cfg.singular}
              </button>
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse">
                <thead>
                  <tr className="border-b border-[#e7e3df] bg-[#fcfbfa] text-left text-[11px] font-semibold text-[#8a837c]">
                    <th className="px-5 py-3">Title</th>
                    <th className="px-5 py-3">Order</th>
                    {(tab === "RECIPE" || tab === "BLOG") && <th className="px-5 py-3 text-right">Reads</th>}
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((e) => (
                    <tr key={e.id} className="border-b border-[#eeeae7] last:border-b-0">
                      <td className="max-w-[420px] px-5 py-4">
                        <div className="flex items-center gap-3">
                          {(e.data.image || e.data.cover) && (
                            <div className="h-10 w-14 shrink-0 rounded-lg bg-[#eeecea] bg-cover bg-center" style={{ backgroundImage: `url("${String(e.data.image || e.data.cover).replace(/"/g, "%22")}")` }} />
                          )}
                          <div className="min-w-0">
                            <div className="text-[13px] font-semibold text-[#393530]">{e.title}</div>
                            {cfg.subtitleKey && <div className="mt-0.5 truncate text-[12px] text-[#918a83]">{asText(e.data[cfg.subtitleKey]).slice(0, 90)}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-[13px] text-[#554f49]">{e.sortOrder}</td>
                      {(tab === "RECIPE" || tab === "BLOG") && <td className="px-5 py-4 text-right text-[13px] text-[#554f49]">{e.views.toLocaleString()}</td>}
                      <td className="px-5 py-4">
                        <StatusBadge status={e.status} />
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1">
                          {busyId === e.id ? (
                            <Loader2 className="h-4 w-4 animate-spin text-[#918a83]" />
                          ) : (
                            <>
                              <IconBtn label={e.status === "LIVE" ? "Unpublish" : "Publish"} onClick={() => toggleStatus(e)}>
                                {e.status === "LIVE" ? <EyeOff size={16} /> : <Eye size={16} />}
                              </IconBtn>
                              <IconBtn label="Edit" onClick={() => setEditing(e)}>
                                <Pencil size={16} />
                              </IconBtn>
                              <IconBtn label="Delete" onClick={() => remove(e)}>
                                <Trash2 size={16} />
                              </IconBtn>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {editing && (
        <EntryDrawer
          type={tab}
          entry={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load(tab);
          }}
        />
      )}
    </main>
  );
}

function IconBtn({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" title={label} aria-label={label} onClick={onClick} className="rounded-lg p-2 text-[#655e57] transition hover:bg-[#f5f3f1]">
      {children}
    </button>
  );
}

const toLocalInput = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

function EntryDrawer({ type, entry, onClose, onSaved }: { type: AdminTab; entry: Entry | null; onClose: () => void; onSaved: () => void }) {
  const cfg = getTabConfig(type);
  const fixedSlug = type === "SECTION" || type === "CATEGORY";

  const [title, setTitle] = useState(entry?.title ?? "");
  const [slug, setSlug] = useState(entry?.slug ?? "");
  const [status, setStatus] = useState<"DRAFT" | "LIVE">(entry?.status ?? "DRAFT");
  const [sortOrder, setSortOrder] = useState(String(entry?.sortOrder ?? 0));
  const [values, setValues] = useState<Record<string, string | boolean>>(() =>
    Object.fromEntries(
      cfg.fields.map((f) => {
        const v = entry?.data?.[f.key];
        if (f.kind === "lines") return [f.key, Array.isArray(v) ? v.join("\n") : ""];
        if (f.kind === "datetime") return [f.key, toLocalInput(v)];
        if (f.kind === "select") return [f.key, v ?? f.options?.[0] ?? ""];
        if (f.kind === "checkbox") return [f.key, v === true];
        if (f.kind === "number") return [f.key, v === undefined || v === null ? "" : String(v)];
        return [f.key, v ?? ""];
      })
    )
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    setSaving(true);
    setErrors({});
    setFormError(null);

    const data: Record<string, unknown> = {};
    for (const f of cfg.fields) {
      const v = values[f.key];
      data[f.key] = typeof v === "string" && f.kind === "datetime" && v ? new Date(v).toISOString() : v;
    }

    const payload = { title, status, sortOrder: parseInt(sortOrder, 10) || 0, ...(cfg.slugged && slug ? { slug } : {}), data };

    try {
      if (entry) await api(`${baseFor(type)}/${entry.id}`, "PATCH", payload);
      else await api(baseFor(type), "POST", { type, ...payload });
      onSaved();
    } catch (err: any) {
      setErrors(err.fieldErrors ?? {});
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const input = "w-full rounded-xl border border-[#ddd8d2] bg-white px-3 py-2 text-[13px] outline-none focus:border-[#f15b2a]";

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={onClose}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="flex h-full w-full max-w-[520px] flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#e8e4e0] px-6 py-4">
          <h2 className="text-[16px] font-bold">
            {entry ? "Edit" : "New"} {cfg.singular}
          </h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 hover:bg-[#f5f3f1]">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
          <Labeled label={cfg.titleLabel} error={errors.title} required>
            <input className={input} value={title} onChange={(e) => setTitle(e.target.value)} />
          </Labeled>

          {cfg.slugged && (
            <Labeled
              label={type === "SECTION" ? "Section key" : "URL slug"}
              error={errors.slug}
              help={
                type === "SECTION"
                  ? "One of: shop, bestsellers, how, meatbox, standard, faq, newsletter (can't be changed later)"
                  : type === "CATEGORY"
                    ? "Used in /shop?category=… links. Leave blank to generate from the name. Can't be changed later."
                    : "Leave blank to generate from the title"
              }
            >
              <input className={input} value={slug} disabled={fixedSlug && !!entry} onChange={(e) => setSlug(e.target.value)} />
            </Labeled>
          )}

          {cfg.fields.map((f) => (
            <Labeled key={f.key} label={f.label} error={errors[f.key]} help={f.help} required={f.required}>
              <FieldInput def={f} value={values[f.key]} className={input} onChange={(v) => setValues((s) => ({ ...s, [f.key]: v }))} />
            </Labeled>
          ))}

          <div className="grid grid-cols-2 gap-3">
            <Labeled label="Status">
              <select className={input} value={status} onChange={(e) => setStatus(e.target.value as "DRAFT" | "LIVE")}>
                <option value="DRAFT">Draft (hidden)</option>
                <option value="LIVE">Live (visible)</option>
              </select>
            </Labeled>
            <Labeled label="Sort order" error={errors.sortOrder} help="Lower shows first">
              <input type="number" className={input} value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
            </Labeled>
          </div>
        </div>

        <div className="border-t border-[#e8e4e0] px-6 py-4">
          {formError && <p className="mb-3 text-[12px] text-[#b3261e]">{formError}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="rounded-xl border border-[#ddd8d2] px-4 py-2 text-[13px] font-medium">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-xl bg-[#f15b2a] px-5 py-2 text-[13px] font-semibold text-white disabled:opacity-60">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function Labeled({ label, error, help, required, children }: { label: string; error?: string; help?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[12px] font-semibold text-[#57514b]">
        {label} {required && <span className="text-[#f15b2a]">*</span>}
      </span>
      {children}
      {help && !error && <span className="mt-1 block text-[11px] text-[#918a83]">{help}</span>}
      {error && <span className="mt-1 block text-[11px] text-[#b3261e]">{error}</span>}
    </label>
  );
}

function FieldInput({ def, value, onChange, className }: { def: FieldDef; value: string | boolean; onChange: (v: string | boolean) => void; className: string }) {
  const text = typeof value === "string" ? value : "";
  switch (def.kind) {
    case "textarea":
      return <textarea rows={5} className={className} value={text} onChange={(e) => onChange(e.target.value)} />;
    case "lines":
      return <textarea rows={4} className={className} value={text} onChange={(e) => onChange(e.target.value)} />;
    case "select":
      return (
        <select className={className} value={text} onChange={(e) => onChange(e.target.value)}>
          {def.options?.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      );
    case "datetime":
      return <input type="datetime-local" className={className} value={text} onChange={(e) => onChange(e.target.value)} />;
    case "number":
      return <input type="number" min={0} className={className} value={text} onChange={(e) => onChange(e.target.value)} />;
    case "image":
      return <ImageInput value={text} onChange={onChange} className={className} />;
    case "checkbox":
      return (
        <span className="flex items-center gap-2 py-1">
          <input type="checkbox" className="h-4 w-4 accent-[#f15b2a]" checked={value === true} onChange={(e) => onChange(e.target.checked)} />
          <span className="text-[13px] text-[#57514b]">Yes</span>
        </span>
      );
    default:
      return <input type="text" className={className} value={text} onChange={(e) => onChange(e.target.value)} />;
  }
}

function ImageInput({ value, onChange, className }: { value: string; onChange: (v: string) => void; className: string }) {
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onFile(ev: React.ChangeEvent<HTMLInputElement>) {
    const file = ev.target.files?.[0];
    ev.target.value = "";
    if (!file) return;
    setUploading(true);
    setErr(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetchWithAuth("/api/admin/upload", { method: "POST", body: fd });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Upload failed");
      onChange(json.url);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input className={className} placeholder="Paste an image URL, or upload" value={value} onChange={(e) => onChange(e.target.value)} />
        <label className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border border-[#ddd8d2] px-3 text-[12px] font-semibold hover:bg-[#faf9f8]">
          {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload size={14} />} Upload
          <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="hidden" disabled={uploading} onChange={onFile} />
        </label>
      </div>
      {err && <p className="text-[11px] text-[#b3261e]">{err}</p>}
      {value && <div className="h-28 w-full rounded-xl border border-[#e8e4e0] bg-[#f5f3f1] bg-cover bg-center" style={{ backgroundImage: `url("${value.replace(/"/g, "%22")}")` }} />}
    </div>
  );
}