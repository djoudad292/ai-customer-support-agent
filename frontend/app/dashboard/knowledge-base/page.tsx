"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

interface Doc {
  id: string;
  title: string;
  content: string;
  status: string;
  published: boolean;
  createdAt: string;
}

const EmptyDoc: Partial<Doc> = { title: "", content: "" };

export default function KnowledgeBase() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<Doc | null>(null);
  const [form, setForm] = useState<Partial<Doc>>(EmptyDoc);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    apiFetch<Doc[]>("/knowledge-base")
      .then(setDocs)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setForm(EmptyDoc);
    setEditing(null);
    setShowForm(true);
  }

  function openEdit(doc: Doc) {
    setForm({ title: doc.title, content: doc.content });
    setEditing(doc);
    setShowForm(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (editing) {
        await apiFetch(`/knowledge-base/${editing.id}`, { method: "PUT", body: JSON.stringify(form) });
      } else {
        await apiFetch("/knowledge-base", { method: "POST", body: JSON.stringify(form) });
      }
      setShowForm(false);
      load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this document?")) return;
    try {
      await apiFetch(`/knowledge-base/${id}`, { method: "DELETE" });
      load();
    } catch (e: any) {
      setError(e.message);
    }
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Knowledge Base</h1>
        <button onClick={openCreate} className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 transition-colors">+ Add Document</button>
      </div>
      {error && <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <form onSubmit={save} className="w-full max-w-lg rounded-2xl border border-slate-800 bg-[#111827] p-6">
            <h2 className="mb-4 text-lg font-semibold">{editing ? "Edit Document" : "New Document"}</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">Title</label>
                <input type="text" required value={form.title || ""} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full rounded-lg px-4 py-2.5 text-sm outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">Content</label>
                <textarea required rows={10} value={form.content || ""} onChange={(e) => setForm({ ...form, content: e.target.value })} className="w-full rounded-lg px-4 py-2.5 text-sm outline-none focus:border-blue-500" />
                <p className="mt-1 text-xs text-slate-500">The AI agent uses this content to answer customer questions.</p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800">Cancel</button>
              <button type="submit" disabled={saving} className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-50">{saving ? "Saving..." : "Save"}</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-slate-400">Loading...</div>
      ) : docs.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-[#111827] p-8 text-center text-slate-400">No documents yet. Add your first one to teach the AI.</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {docs.map((d) => (
            <div key={d.id} className="rounded-xl border border-slate-800 bg-[#111827] p-5">
              <div className="mb-2 flex items-start justify-between gap-2">
                <h3 className="font-medium">{d.title}</h3>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${d.published ? "bg-green-500/10 text-green-400" : "bg-slate-500/10 text-slate-400"}`}>{d.published ? "Published" : "Draft"}</span>
              </div>
              <p className="mb-4 line-clamp-3 text-sm text-slate-400">{d.content}</p>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>{new Date(d.createdAt).toLocaleDateString()}</span>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(d)} className="text-blue-400 hover:underline">Edit</button>
                  <button onClick={() => remove(d.id)} className="text-red-400 hover:underline">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}