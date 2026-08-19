"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { GitBranch, MessageSquare, Ticket, BookOpen, Settings } from "lucide-react";

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

  if (loading) return <div className="py-12 text-center text-slate-400">Loading dashboard...</div>;

  const cards = [
    { label: "Conversations", value: stats?.conversations?.total ?? stats?.conversations ?? 0, icon: "💬", color: "from-blue-500/20 to-blue-600/5 border-blue-500/20" },
    { label: "Tickets", value: stats?.tickets?.total ?? 0, sub: `${stats?.tickets?.open ?? 0} open`, icon: "🎫", color: "from-yellow-500/20 to-yellow-600/5 border-yellow-500/20" },
    { label: "Orders", value: stats?.orders?.total ?? 0, sub: `${stats?.orders?.processing ?? 0} processing`, icon: "📦", color: "from-green-500/20 to-green-600/5 border-green-500/20" },
    { label: "Leads", value: stats?.leads?.total ?? stats?.leads ?? 0, icon: "📋", color: "from-purple-500/20 to-purple-600/5 border-purple-500/20" },
    { label: "Appointments", value: stats?.appointments?.total ?? stats?.appointments ?? 0, icon: "📅", color: "from-pink-500/20 to-pink-600/5 border-pink-500/20" },
    { label: "Knowledge Base", value: stats?.documents?.total ?? stats?.documents ?? 0, sub: "docs", icon: "📚", color: "from-cyan-500/20 to-cyan-600/5 border-cyan-500/20" },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Overview</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className={`rounded-xl border bg-gradient-to-br p-4 ${c.color}`}>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-2xl">{c.icon}</span>
            </div>
            <p className="text-2xl font-bold">{c.value}</p>
            <p className="text-sm text-slate-400">{c.label}{c.sub ? ` · ${c.sub}` : ""}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-slate-800 bg-[#111827] p-6">
        <h3 className="mb-4 text-lg font-semibold">Widget Setup</h3>
        <p className="mb-3 text-sm text-slate-400">Add this to your website to embed the AI chat widget:</p>
        <code className="block rounded-lg bg-slate-800/50 p-3 text-xs text-green-400 overflow-x-auto">
          {`<script src="https://ai-customer-support-backend-ldbf.onrender.com/widget.js"></script>`}
        </code>
        <p className="mt-2 text-xs text-slate-500">Optionally configure: <code className="text-slate-400">window.AI_SUPPORT_CONFIG = {"{'}"} companyId: "your-id" {"}"};</code></p>
      </div>

      <div className="rounded-xl border border-slate-800 bg-[#111827] p-6">
        <h3 className="mb-4 text-lg font-semibold">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <a href="/dashboard/graph-inspector" className="rounded-lg border border-slate-700 bg-slate-800/30 p-4 text-center text-sm transition-colors hover:border-blue-500/50 hover:bg-blue-500/5">
            <GitBranch className="mb-2 h-6 w-6 text-blue-400" />
            Graph Inspector
          </a>
          <a href="/dashboard/conversations" className="rounded-lg border border-slate-700 bg-slate-800/30 p-4 text-center text-sm transition-colors hover:border-blue-500/50 hover:bg-blue-500/5">
            <MessageSquare className="mb-2 h-6 w-6 text-blue-400 mx-auto" />
            View Conversations
          </a>
          <a href="/dashboard/tickets" className="rounded-lg border border-slate-700 bg-slate-800/30 p-4 text-center text-sm transition-colors hover:border-yellow-500/50 hover:bg-yellow-500/5">
            <Ticket className="mb-2 h-6 w-6 text-yellow-400 mx-auto" />
            Manage Tickets
          </a>
          <a href="/dashboard/knowledge-base" className="rounded-lg border border-slate-700 bg-slate-800/30 p-4 text-center text-sm transition-colors hover:border-cyan-500/50 hover:bg-cyan-500/5">
            <BookOpen className="mb-2 h-6 w-6 text-cyan-400 mx-auto" />
            Knowledge Base
          </a>
          <a href="/dashboard/settings" className="rounded-lg border border-slate-700 bg-slate-800/30 p-4 text-center text-sm transition-colors hover:border-slate-500/50 hover:bg-slate-500/5">
            <Settings className="mb-2 h-6 w-6 text-slate-400 mx-auto" />
            Settings
          </a>
        </div>
      </div>
    </div>
  );
}
