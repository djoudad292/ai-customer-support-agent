"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Download, Smartphone, Copy, Check } from "lucide-react";
import { Button, Card, CardHeader, CardTitle, Input, Spinner, ErrorBanner } from "@supportai/ui/web";

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
    <div className="max-w-2xl space-y-6">
      <h1 className="mb-2 text-2xl font-bold tracking-tight">Settings</h1>
      {error && <ErrorBanner message={error} />}
      {success && <div className="mb-6 rounded-xl border border-success/30 bg-success-soft px-4 py-3 text-sm text-success font-medium">{success}</div>}

      <Card className="border-success/20 bg-success-soft/10 p-4 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-success-soft p-2">
            <Smartphone className="h-5 w-5 text-success" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-foreground">Download Mobile App</h2>
            <p className="text-sm text-muted mt-1">
              Get the Android app for on-the-go support management. Install directly from GitHub.
            </p>
            <Button size="sm" className="mt-3 bg-success border-0 text-white shadow-sm hover:bg-success/90">
              <a href={APK_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Download APK
              </a>
            </Button>
            <p className="text-[11px] text-muted mt-2">
              Requires Android 8.0+. After download, enable "Install from unknown sources" in your settings.
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-4 sm:p-6">
        <CardHeader className="px-0"><CardTitle>Company</CardTitle></CardHeader>
        {loading ? (
          <Spinner />
        ) : (
          <form onSubmit={save} className="space-y-4">
            <Input label="Company Name" value={form.name} onChange={(e) => setForm({ name: e.target.value })} />
            <Input label="Slug" value={company?.slug || ""} disabled className="opacity-60 cursor-not-allowed" />
            <Button type="submit" loading={saving}>Save Changes</Button>
          </form>
        )}
      </Card>

      <Card className="p-4 sm:p-6">
        <CardHeader className="px-0"><CardTitle>Widget Embed</CardTitle></CardHeader>
        <p className="text-sm text-muted mb-3">Add this script to your website to enable the chat widget:</p>
        <div className="relative">
          <pre className="rounded-xl border border-border bg-surface-alt p-3 text-xs text-fg-secondary overflow-x-auto pr-10 font-mono">{widgetCode}</pre>
          <button onClick={copyWidget} className="absolute right-2 top-2 rounded-lg bg-surface-hover p-1.5 text-fg-muted hover:text-fg transition-colors" aria-label="Copy code">
            {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>
      </Card>

      <Card className="p-4 sm:p-6">
        <CardHeader className="px-0"><CardTitle>Plan</CardTitle></CardHeader>
        <p className="text-sm text-muted">
          Current plan: <span className="font-medium text-foreground capitalize">{company?.plan || "free"}</span>
        </p>
      </Card>
    </div>
  );
}
