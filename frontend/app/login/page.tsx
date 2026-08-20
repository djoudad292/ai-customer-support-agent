"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch } from "../../lib/api";
import { MessageSquare } from "lucide-react";
import { Input, Button, ErrorBanner } from "@supportai/ui";

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
    <div className="flex min-h-screen items-center justify-center bg-bg px-6">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <MessageSquare className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Sign in</h1>
          <p className="mt-2 text-sm text-muted">Welcome back to AI Customer Support Agent</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <ErrorBanner message={error} />}
          <Input label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
          <Input label="Password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          <Button type="submit" loading={loading} className="w-full">
            Sign in
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted">
          Don't have an account?{" "}
          <Link href="/register" className="font-medium text-primary hover:underline">Create one</Link>
        </p>
      </div>
    </div>
  );
}
