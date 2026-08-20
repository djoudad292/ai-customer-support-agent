"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

interface Ticket {
  id: string;
  ticketNumber: string;
  subject: string;
  description?: string;
  status: string;
  priority: string;
  customerName?: string;
  customerEmail?: string;
  createdAt: string;
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [counts, setCounts] = useState({ total: 0, open: 0, inProgress: 0, resolved: 0 });
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ subject: "", description: "", priority: "medium", customerName: "", customerEmail: "" });

  useEffect(() => { load(); }, [filter]);

  async function load() {
    setLoading(true);
    try {
      const q = filter ? `?status=${filter}` : "";
      const [ticketData, countData] = await Promise.all([
        apiFetch<{ items: Ticket[] }>(`/tickets${q}`),
        apiFetch<{ total: number; open: number; inProgress: number; resolved: number }>("/tickets/counts"),
      ]);
      setTickets(ticketData.items || []);
      setCounts(countData);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function createTicket() {
    if (!form.subject) return;
    try {
      await apiFetch("/tickets", { method: "POST", body: JSON.stringify(form) });
      setCreating(false);
      setForm({ subject: "", description: "", priority: "medium", customerName: "", customerEmail: "" });
      load();
    } catch (e) { console.error(e); }
  }

  const filters = [
    { label: "All", value: "" },
    { label: "Open", value: "open" },
    { label: "In Progress", value: "in_progress" },
    { label: "Resolved", value: "resolved" },
  ];

  const priorityColor: Record<string, string> = {
    high: "bg-red-500/10 text-red-400 border-red-500/20",
    medium: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    low: "bg-green-500/10 text-green-400 border-green-500/20",
  };

  const statusColor: Record<string, string> = {
    open: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    in_progress: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    resolved: "bg-green-500/10 text-green-400 border-green-500/20",
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold">Tickets</h1>
        <button onClick={() => setCreating(true)} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 transition-colors w-full sm:w-auto">
          + New Ticket
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {counts.total > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full mb-4">
            <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3 text-center">
              <p className="text-2xl font-bold text-white">{counts.total}</p>
              <p className="text-xs text-slate-400">Total</p>
            </div>
            <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3 text-center">
              <p className="text-2xl font-bold text-blue-400">{counts.open}</p>
              <p className="text-xs text-slate-400">Open</p>
            </div>
            <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-3 text-center">
              <p className="text-2xl font-bold text-yellow-400">{counts.inProgress}</p>
              <p className="text-xs text-slate-400">In Progress</p>
            </div>
            <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-3 text-center">
              <p className="text-2xl font-bold text-green-400">{counts.resolved}</p>
              <p className="text-xs text-slate-400">Resolved</p>
            </div>
          </div>
        )}
        {filters.map((f) => (
          <button key={f.value} onClick={() => setFilter(f.value)} className={`rounded-lg px-3 py-1.5 text-xs font-medium border transition-colors ${filter === f.value ? "bg-blue-600 text-white border-blue-500" : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"}`}>
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-slate-400">Loading...</p>
      ) : tickets.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-[#0d1117] p-12 text-center">
          <p className="text-slate-400">No tickets found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tickets.map((t) => (
            <button key={t.id} onClick={() => setSelected(t)} className="w-full rounded-xl border border-slate-800 bg-[#0d1117] p-3 sm:p-4 text-left hover:border-slate-700 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                <span className="text-xs font-mono text-slate-500 shrink-0">{t.ticketNumber}</span>
                <span className="text-sm text-slate-200 flex-1 min-w-0 truncate">{t.subject}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${priorityColor[t.priority] || "bg-slate-700 text-slate-300 border-slate-600"}`}>
                    {t.priority}
                  </span>
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${statusColor[t.status] || "bg-slate-700 text-slate-300 border-slate-600"}`}>
                    {t.status}
                  </span>
                  <span className="text-[11px] text-slate-500 hidden sm:inline">{new Date(t.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setSelected(null)}>
          <div className="w-full max-w-lg rounded-xl border border-slate-800 bg-[#0d1117] p-6 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="text-lg font-bold text-white">{selected.ticketNumber}</h2>
                <p className="text-sm text-slate-300 mt-1">{selected.subject}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-white text-xl shrink-0">&times;</button>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold uppercase ${priorityColor[selected.priority] || ""}`}>{selected.priority}</span>
              <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold uppercase ${statusColor[selected.status] || ""}`}>{selected.status}</span>
            </div>
            {selected.description && <p className="text-sm text-slate-300 mb-4 whitespace-pre-wrap">{selected.description}</p>}
            <div className="text-xs text-slate-500 space-y-1">
              {selected.customerName && <p>Customer: {selected.customerName}</p>}
              {selected.customerEmail && <p>Email: {selected.customerEmail}</p>}
              <p>Created: {new Date(selected.createdAt).toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}

      {creating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setCreating(false)}>
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-[#0d1117] p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-white mb-4">New Ticket</h2>
            <div className="space-y-3">
              <input placeholder="Subject *" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-blue-500" />
              <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-blue-500 resize-none" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input placeholder="Customer Name" value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-blue-500" />
                <input placeholder="Customer Email" value={form.customerEmail} onChange={(e) => setForm({ ...form, customerEmail: e.target.value })} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-blue-500" />
              </div>
              <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-blue-500">
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
              <div className="flex gap-2 pt-2">
                <button onClick={createTicket} className="flex-1 rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white hover:bg-blue-500">Create</button>
                <button onClick={() => setCreating(false)} className="flex-1 rounded-lg border border-slate-700 bg-slate-800 py-2 text-sm text-slate-300 hover:bg-slate-700">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
