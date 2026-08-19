"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

interface Company {
  id: string;
  name: string;
  slug: string;
  plan: string;
  settings: any;
}

export default function Settings() {
  const [company, setCompany] = useState<Company | null>(null);
  const [form, setForm] = useState({ name: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    apiFetch<Company>("/companies/me")
      .then((c) => {
        setCompany(c);
        setForm({ name: c.name });
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const updated = await apiFetch<Company>("/companies/me", { method: "PATCH", body: JSON.stringify(form) });
      setCompany(updated);
      setSuccess("Settings saved successfully.");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  const widgetCode = `<script src="https://customer.djaouad.tech/widget.js" data-company="YOUR_SLUG"></script>`;

  return (
    <div className="max-w-2xl">
      <h1 className="mb-8 text-2xl font-bold">Settings</h1>
      {error && <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>}
      {success && <div className="mb-6 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400">{success}</div>}
      {loading ? (
        <div className="text-slate-400">Loading...</div>
      ) : company ? (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-800 bg-[#111827] p-6">
            <h2 className="mb-4 text-lg font-semibold">Company</h2>
            <form onSubmit={save} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">Company Name</label>
                <input type="text" required value={form.name} onChange={(e) => setForm({ name: e.target.value })} className="w-full rounded-lg px-4 py-2.5 text-sm outline-none focus:border-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-[#0d1424] px-4 py-3">
                  <div className="text-xs text-slate-500">Plan</div>
                  <div className="mt-1 font-medium capitalize">{company.plan}</div>
                </div>
                <div className="rounded-lg bg-[#0d1424] px-4 py-3">
                  <div className="text-xs text-slate-500">Slug</div>
                  <div className="mt-1 font-medium">{company.slug}</div>
                </div>
              </div>
              <button type="submit" disabled={saving} className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 transition-colors disabled:opacity-50">
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </form>
          </div>

          <div className="rounded-xl border border-slate-800 bg-[#111827] p-6">
            <h2 className="mb-4 text-lg font-semibold">Embed Widget</h2>
            <p className="mb-3 text-sm text-slate-400">Copy this code and paste it into your website to add the AI chat widget.</p>
            <pre className="overflow-x-auto rounded-lg bg-[#0d1424] p-4 text-xs text-slate-300">{widgetCode}</pre>
          </div>
        </div>
      ) : (
        <div className="text-slate-400">No company found</div>
      )}
    </div>
  );
}