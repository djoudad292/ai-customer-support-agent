"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch } from "../../lib/api";

export default function Register() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", companyName: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await apiFetch<{ token: string; user: any }>("/auth/register", {
        method: "POST",
        body: JSON.stringify(form),
      });
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const fields = [
    { key: "name", label: "Full Name", type: "text", placeholder: "John Doe" },
    { key: "email", label: "Email", type: "email", placeholder: "you@company.com" },
    { key: "password", label: "Password", type: "password", placeholder: "••••••••" },
    { key: "companyName", label: "Company Name", type: "text", placeholder: "Acme Inc." },
  ];

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0f1a] px-6 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500 text-2xl">💬</div>
          <h1 className="text-2xl font-bold text-slate-50">Create your account</h1>
          <p className="mt-2 text-sm text-slate-400">Start with AI Customer Support Agent for free</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>}
          {fields.map((f) => (
            <div key={f.key}>
              <label className="mb-1 block text-sm font-medium text-slate-300">{f.label}</label>
              <input type={f.type} required value={form[f.key as keyof typeof form]} onChange={(e) => update(f.key, e.target.value)} placeholder={f.placeholder} className="w-full rounded-lg px-4 py-2.5 text-sm outline-none focus:border-blue-500" />
            </div>
          ))}
          <button type="submit" disabled={loading} className="w-full rounded-lg bg-blue-500 py-2.5 text-sm font-semibold text-white hover:bg-blue-600 transition-colors disabled:opacity-50">
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-400">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-blue-400 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
