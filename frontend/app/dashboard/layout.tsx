"use client";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { LayoutDashboard, MessageSquare, Ticket, Package, BookOpen, ClipboardList, CalendarDays, Settings, Menu, X, Download } from "lucide-react";
import { SidebarLink, Logo, Button } from "@supportai/ui/web";

const APK_URL = "https://github.com/djoudad292/ai-customer-support-agent/releases/download/latest-apk/ai-customer-support.apk";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/conversations", label: "Conversations", icon: MessageSquare },
  { href: "/dashboard/tickets", label: "Tickets", icon: Ticket },
  { href: "/dashboard/orders", label: "Orders", icon: Package },
  { href: "/dashboard/knowledge-base", label: "Knowledge Base", icon: BookOpen },
  { href: "/dashboard/leads", label: "Leads", icon: ClipboardList },
  { href: "/dashboard/appointments", label: "Appointments", icon: CalendarDays },
  { href: "/dashboard/graph-inspector", label: "AI Chat", icon: MessageSquare },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));
  }, [router]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  }

  return (
    <div className="flex min-h-screen bg-bg text-fg">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-overlay backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-surface border-r border-border flex flex-col transform transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <Logo size={32} />
            <span className="text-lg font-bold tracking-tight text-fg">SupportAI</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden flex h-9 w-9 items-center justify-center rounded-lg text-fg-muted hover:text-fg hover:bg-surface-hover transition-colors"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto" aria-label="Main navigation">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href === "/dashboard" && pathname === "/dashboard");
            return (
              <SidebarLink
                key={item.href}
                href={item.href}
                active={isActive}
                icon={<item.icon />}
              >
                {item.label}
              </SidebarLink>
            );
          })}
        </nav>

        <div className="p-3 border-t border-border space-y-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start text-success"
            onClick={() => window.open(APK_URL, "_blank")}
          >
            <Download className="h-4 w-4 mr-1" />
            Download Android App
          </Button>
          {user && (
            <div className="px-3 py-2">
              <p className="text-sm font-medium text-fg truncate">{user.name || user.email}</p>
              <p className="text-xs text-fg-muted truncate">{user.email}</p>
            </div>
          )}
          <Button variant="ghost" size="sm" onClick={logout} className="w-full justify-start text-fg-muted">
            Log out
          </Button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0">
        {/* Mobile top bar */}
        <div className="flex items-center gap-3 p-3 border-b border-border lg:hidden sticky top-0 bg-bg/80 backdrop-blur-md z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-fg-muted hover:text-fg hover:bg-surface-hover transition-colors"
            aria-label="Open sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <Logo size={24} />
            <span className="text-sm font-bold tracking-tight text-fg">SupportAI</span>
          </div>
        </div>

        <div className="p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
