"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch } from "../../lib/api";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await apiFetch<{ token: string; user: any }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
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

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0f1a] px-6">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500 text-2xl">💬</div>
          <h1 className="text-2xl font-bold text-slate-50">Sign in</h1>
          <p className="mt-2 text-sm text-slate-400">Welcome back to AI Customer Support Agent</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" className="w-full rounded-lg px-4 py-2.5 text-sm outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">Password</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full rounded-lg px-4 py-2.5 text-sm outline-none focus:border-blue-500" />
          </div>
          <button type="submit" disabled={loading} className="w-full rounded-lg bg-blue-500 py-2.5 text-sm font-semibold text-white hover:bg-blue-600 transition-colors disabled:opacity-50">
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-400">
          Don't have an account?{" "}
          <Link href="/register" className="font-medium text-blue-400 hover:underline">Create one</Link>
        </p>
      </div>
    </div>
  );
}
