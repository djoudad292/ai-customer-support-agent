"use client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/dashboard/conversations", label: "Conversations", icon: "💬" },
  { href: "/dashboard/tickets", label: "Tickets", icon: "🎫" },
  { href: "/dashboard/orders", label: "Orders", icon: "📦" },
  { href: "/dashboard/knowledge-base", label: "Knowledge Base", icon: "📚" },
  { href: "/dashboard/leads", label: "Leads", icon: "📋" },
  { href: "/dashboard/appointments", label: "Appointments", icon: "📅" },
  { href: "/dashboard/settings", label: "Settings", icon: "⚙️" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [currentPath, setCurrentPath] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));
    setCurrentPath(window.location.pathname);
  }, [router]);

  useEffect(() => {
    setCurrentPath(window.location.pathname);
    setSidebarOpen(false);
  }, []);

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  }

  return (
    <div className="flex min-h-screen bg-[#0a0f1a] text-slate-50">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-800 bg-[#0d1424] transition-transform duration-200 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center gap-2 border-b border-slate-800 px-5 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 text-sm">💬</div>
          <span className="font-semibold">AI Support</span>
          <button onClick={() => setSidebarOpen(false)} className="ml-auto p-1 text-slate-400 hover:text-white lg:hidden">✕</button>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const isActive = currentPath === item.href || (item.href !== "/dashboard" && currentPath.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setCurrentPath(item.href)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${isActive ? "bg-blue-500/10 text-blue-400" : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"}`}
              >
                <span className="text-lg">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-slate-800 px-3 py-4">
          <div className="mb-3 flex items-center gap-3 px-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-700 text-xs font-semibold">
              {user?.name?.charAt(0) || "?"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{user?.name || "User"}</p>
              <p className="truncate text-xs text-slate-400">{user?.email || ""}</p>
            </div>
          </div>
          <button onClick={logout} className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-400 hover:bg-slate-800/50 hover:text-red-400 transition-colors">
            Sign Out
          </button>
        </div>
      </aside>

      <div className="flex-1 lg:ml-64">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-slate-800 bg-[#0a0f1a]/80 px-4 backdrop-blur-md lg:px-6">
          <button onClick={() => setSidebarOpen(true)} className="p-1 text-slate-400 hover:text-white lg:hidden">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <h1 className="text-sm font-semibold lg:text-base">
            {navItems.find((n) => currentPath === n.href || (n.href !== "/dashboard" && currentPath.startsWith(n.href)))?.label || "Dashboard"}
          </h1>
        </header>
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
