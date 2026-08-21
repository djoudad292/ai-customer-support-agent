"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { GitBranch, MessageSquare, Ticket, BookOpen, Settings, Package, ClipboardList, CalendarDays, Download } from "lucide-react";
import { Card, CardHeader, CardTitle, Button, Badge, Spinner } from "@supportai/ui/web";

const APK_URL = "https://github.com/djoudad292/ai-customer-support-agent/releases/download/latest-apk/ai-customer-support.apk";

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch("/analytics/dashboard").catch(() => null),
      apiFetch("/tickets/counts").catch(() => null),
      apiFetch("/orders/counts").catch(() => null),
    ]).then(([analytics, tickets, orders]) => {
      setStats({ ...analytics, tickets, orders });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="py-12"><Spinner label="Loading dashboard..." /></div>;

  const cards = [
    { label: "Conversations", value: stats?.conversations?.total ?? stats?.conversations ?? 0, icon: MessageSquare, tone: "primary" as const },
    { label: "Tickets", value: stats?.tickets?.total ?? 0, sub: `${stats?.tickets?.open ?? 0} open`, icon: Ticket, tone: "warning" as const },
    { label: "Orders", value: stats?.orders?.total ?? 0, sub: `${stats?.orders?.processing ?? 0} processing`, icon: Package, tone: "success" as const },
    { label: "Leads", value: stats?.leads?.total ?? stats?.leads ?? 0, icon: ClipboardList, tone: "violet" as const },
    { label: "Appointments", value: stats?.appointments?.total ?? stats?.appointments ?? 0, icon: CalendarDays, tone: "accent" as const },
    { label: "Knowledge Base", value: stats?.documents?.total ?? stats?.documents ?? 0, sub: "docs", icon: BookOpen, tone: "accent" as const },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold tracking-tight">Overview</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3">
        {cards.map((c) => (
          <Card key={c.label} className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <Badge tone={c.tone} className="w-8 h-8 rounded-lg flex items-center justify-center p-0"><c.icon /></Badge>
            </div>
            <p className="text-2xl font-bold text-fg">{c.value}</p>
            <p className="text-sm text-muted">{c.label}{c.sub ? ` · ${c.sub}` : ""}</p>
          </Card>
        ))}
      </div>

      <Card className="p-6">
        <CardHeader className="px-0"><CardTitle>Widget Setup</CardTitle></CardHeader>
        <p className="mb-3 text-sm text-muted">Add this to your website to embed the AI chat widget:</p>
        <code className="block rounded-xl bg-surface-alt p-3 text-xs text-success overflow-x-auto font-mono">
          {`<script src="https://ai-customer-support-backend-ldbf.onrender.com/widget.js"></script>`}
        </code>
        <p className="mt-2 text-xs text-muted">Optionally configure: <code className="text-fg-secondary">window.AI_SUPPORT_CONFIG = {"{'}"} companyId: "your-id" {"}"};</code></p>
      </Card>

      <Card className="p-4 sm:p-6">
        <CardHeader className="px-0"><CardTitle>Quick Actions</CardTitle></CardHeader>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { href: "/dashboard/graph-inspector", icon: GitBranch, label: "AI Chat", tone: "primary" },
            { href: "/dashboard/conversations", icon: MessageSquare, label: "Conversations", tone: "primary" },
            { href: "/dashboard/tickets", icon: Ticket, label: "Tickets", tone: "warning" },
            { href: "/dashboard/knowledge-base", icon: BookOpen, label: "Knowledge Base", tone: "accent" },
            { href: "/dashboard/settings", icon: Settings, label: "Settings", tone: "neutral" },
            { href: APK_URL, icon: Download, label: "Download App", tone: "success" },
          ].map((item) => (
            <a
              key={item.href + item.label}
              href={item.href}
              target={item.href.startsWith("http") ? "_blank" : undefined}
              rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
              className="flex flex-col items-center gap-2 rounded-xl border border-border bg-surface-alt p-3 sm:p-4 text-center text-xs sm:text-sm transition-colors hover:border-border-strong hover:bg-surface-hover"
            >
              <item.icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              <span className="text-fg-secondary">{item.label}</span>
            </a>
          ))}
        </div>
      </Card>
    </div>
  );
}
