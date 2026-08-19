"use client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/dashboard/conversations", label: "Conversations", icon: "💬" },
  { href: "/dashboard/knowledge-base", label: "Knowledge Base", icon: "📚" },
  { href: "/dashboard/leads", label: "Leads", icon: "📋" },
  { href: "/dashboard/appointments", label: "Appointments", icon: "📅" },
  { href: "/dashboard/settings", label: "Settings", icon: "⚙️" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [currentPath, setCurrentPath] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));
    setCurrentPath(window.location.pathname);
  }, [router]);

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  }

  return (
    <div className="flex min-h-screen bg-[#0a0f1a] text-slate-50">
      <aside className="fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-slate-800 bg-[#0d1424]">
        <div className="flex items-center gap-2 border-b border-slate-800 px-6 py-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500 text-sm">💬</div>
          <span className="font-semibold">AI Support Agent</span>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const active = item.href === "/dashboard" ? currentPath === "/dashboard" : currentPath.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${active ? "bg-blue-500/10 text-blue-400" : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"}`}>
                <span>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-slate-800 p-4">
          {user && (
            <div className="mb-3">
              <div className="text-sm font-medium text-slate-200">{user.name}</div>
              <div className="text-xs text-slate-500">{user.email}</div>
            </div>
          )}
          <button onClick={logout} className="w-full rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 transition-colors">
            Sign out
          </button>
        </div>
      </aside>
      <main className="ml-60 flex-1 p-8">{children}</main>
    </div>
  );
}
