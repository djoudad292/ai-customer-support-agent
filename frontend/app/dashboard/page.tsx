"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

interface Stats {
  totalConversations: number;
  activeConversations: number;
  totalLeads: number;
  newLeads: number;
  totalAppointments: number;
  pendingAppointments: number;
  totalDocuments: number;
}

const EmptyStats: Stats = {
  totalConversations: 0,
  activeConversations: 0,
  totalLeads: 0,
  newLeads: 0,
  totalAppointments: 0,
  pendingAppointments: 0,
  totalDocuments: 0,
};

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>(EmptyStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch<Stats>("/analytics/dashboard")
      .then(setStats)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const cards = [
    { label: "Total Conversations", value: stats.totalConversations, color: "border-blue-500/40" },
    { label: "Active Conversations", value: stats.activeConversations, color: "border-cyan-500/40" },
    { label: "Total Leads", value: stats.totalLeads, color: "border-green-500/40" },
    { label: "New Leads", value: stats.newLeads, color: "border-emerald-500/40" },
    { label: "Total Appointments", value: stats.totalAppointments, color: "border-purple-500/40" },
    { label: "Pending Appointments", value: stats.pendingAppointments, color: "border-orange-500/40" },
    { label: "Knowledge Docs", value: stats.totalDocuments, color: "border-slate-500/40" },
  ];

  return (
    <div>
      <h1 className="mb-8 text-2xl font-bold">Dashboard</h1>
      {error && <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>}
      {loading ? (
        <div className="text-slate-400">Loading analytics...</div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {cards.map((c) => (
            <div key={c.label} className={`rounded-xl border ${c.color} bg-[#111827] p-6`}>
              <div className="text-3xl font-bold">{c.value}</div>
              <div className="mt-2 text-sm text-slate-400">{c.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}