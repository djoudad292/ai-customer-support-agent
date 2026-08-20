"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch } from "../../lib/api";
import { MessageSquare } from "lucide-react";
import { Input, Button, ErrorBanner } from "@supportai/ui";

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
    <div className="flex min-h-screen items-center justify-center bg-bg px-6 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <MessageSquare className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Create your account</h1>
          <p className="mt-2 text-sm text-muted">Start with AI Customer Support Agent for free</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <ErrorBanner message={error} />}
          {fields.map((f) => (
            <Input key={f.key} label={f.label} type={f.type} required value={form[f.key as keyof typeof form]} onChange={(e) => update(f.key, e.target.value)} placeholder={f.placeholder} />
          ))}
          <Button type="submit" loading={loading} className="w-full">
            Create account
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
