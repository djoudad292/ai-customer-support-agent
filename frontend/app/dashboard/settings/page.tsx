"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Download, Smartphone, Copy, Check } from "lucide-react";

const APK_URL = "https://github.com/djoudad292/ai-customer-support-agent/releases/download/latest-apk/ai-customer-support.apk";

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
  const [copied, setCopied] = useState(false);

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

  const widgetCode = `<script src="https://customer.djaouad.tech/widget.js" data-company="${company?.slug || 'YOUR_SLUG'}"></script>`;

  function copyWidget() {
    navigator.clipboard.writeText(widgetCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 sm:mb-8 text-2xl font-bold">Settings</h1>
      {error && <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>}
      {success && <div className="mb-6 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400">{success}</div>}

      {/* Download Mobile App */}
      <div className="mb-8 rounded-xl border border-green-500/20 bg-green-500/5 p-4 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-green-500/10 p-2">
            <Smartphone className="h-5 w-5 text-green-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-white">Download Mobile App</h2>
            <p className="text-sm text-slate-400 mt-1">
              Get the Android app for on-the-go support management. Install directly from GitHub.
            </p>
            <a
              href={APK_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-500 transition-colors"
            >
              <Download className="h-4 w-4" />
              Download APK
            </a>
            <p className="text-[11px] text-slate-500 mt-2">
              Requires Android 8.0+. After download, enable "Install from unknown sources" in your settings.
            </p>
          </div>
        </div>
      </div>

      {/* Company */}
      <div className="mb-8 rounded-xl border border-slate-800 bg-[#0d1117] p-4 sm:p-6">
        <h2 className="mb-4 text-lg font-semibold">Company</h2>
        {loading ? (
          <p className="text-sm text-slate-400">Loading...</p>
        ) : (
          <form onSubmit={save} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm text-slate-400">Company Name</label>
              <input value={form.name} onChange={(e) => setForm({ name: e.target.value })} className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-400">Slug</label>
              <input value={company?.slug || ""} disabled className="w-full rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-2 text-sm text-slate-500" />
            </div>
            <button type="submit" disabled={saving} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 transition-colors disabled:opacity-50">
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </form>
        )}
      </div>

      {/* Widget */}
      <div className="mb-8 rounded-xl border border-slate-800 bg-[#0d1117] p-4 sm:p-6">
        <h2 className="mb-4 text-lg font-semibold">Widget Embed</h2>
        <p className="text-sm text-slate-400 mb-3">Add this script to your website to enable the chat widget:</p>
        <div className="relative">
          <pre className="rounded-lg border border-slate-800 bg-slate-900 p-3 text-xs text-slate-300 overflow-x-auto pr-10">{widgetCode}</pre>
          <button onClick={copyWidget} className="absolute right-2 top-2 rounded-md bg-slate-800 p-1.5 text-slate-400 hover:text-white transition-colors">
            {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Plan */}
      <div className="rounded-xl border border-slate-800 bg-[#0d1117] p-4 sm:p-6">
        <h2 className="mb-2 text-lg font-semibold">Plan</h2>
        <p className="text-sm text-slate-400">
          Current plan: <span className="font-medium text-white capitalize">{company?.plan || "free"}</span>
        </p>
      </div>
    </div>
  );
}
