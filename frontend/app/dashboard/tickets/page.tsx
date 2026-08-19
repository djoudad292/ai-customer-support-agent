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

  async function updateTicket(id: string, status: string) {
    try {
      await apiFetch(`/tickets/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
      load();
      if (selected?.id === id) setSelected({ ...selected, status });
    } catch (e) { console.error(e); }
  }

  const priorityColor: Record<string, string> = {
    high: "bg-red-500/10 text-red-400 border-red-500/20",
    medium: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    low: "bg-green-500/10 text-green-400 border-green-500/20",
  };
  const statusColor: Record<string, string> = {
    open: "bg-blue-500/10 text-blue-400",
    in_progress: "bg-yellow-500/10 text-yellow-400",
    resolved: "bg-green-500/10 text-green-400",
    closed: "bg-slate-500/10 text-slate-400",
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold">Support Tickets</h2>
        <button onClick={() => setCreating(true)} className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 transition-colors">
          + New Ticket
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total", value: counts.total, color: "text-white" },
          { label: "Open", value: counts.open, color: "text-blue-400" },
          { label: "In Progress", value: counts.inProgress, color: "text-yellow-400" },
          { label: "Resolved", value: counts.resolved, color: "text-green-400" },
        ].map((s) => (
          <button key={s.label} onClick={() => setFilter(filter === s.label.toLowerCase().replace(" ", "_") ? "" : s.label.toLowerCase().replace(" ", "_"))}
            className={`rounded-lg border border-slate-800 bg-[#111827] p-4 text-left transition-colors hover:border-slate-700 ${filter === s.label.toLowerCase().replace(" ", "_") ? "ring-1 ring-blue-500" : ""}`}>
            <p className="text-xs text-slate-400">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </button>
        ))}
      </div>

      {creating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setCreating(false)}>
          <div className="w-full max-w-lg rounded-xl border border-slate-700 bg-[#111827] p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-4 text-lg font-semibold">Create Ticket</h3>
            <div className="space-y-3">
              <input placeholder="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}
                className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500" />
              <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500 h-24 resize-none" />
              <div className="grid grid-cols-2 gap-3">
                <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  className="rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-sm text-white outline-none focus:border-blue-500">
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                </select>
                <input placeholder="Customer Name" value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                  className="rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500" />
              </div>
              <input placeholder="Customer Email" value={form.customerEmail} onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
                className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500" />
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setCreating(false)} className="rounded-lg px-4 py-2 text-sm text-slate-400 hover:text-white">Cancel</button>
                <button onClick={createTicket} className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600">Create</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setSelected(null)}>
          <div className="w-full max-w-lg rounded-xl border border-slate-700 bg-[#111827] p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">{selected.ticketNumber}</h3>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <p className="mb-1 text-sm text-slate-300">{selected.subject}</p>
            {selected.description && <p className="mb-3 text-sm text-slate-400">{selected.description}</p>}
            <div className="mb-4 flex gap-2">
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${priorityColor[selected.priority] || ""}`}>{selected.priority}</span>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor[selected.status] || ""}`}>{selected.status}</span>
            </div>
            {selected.customerName && <p className="text-sm text-slate-400">Customer: {selected.customerName} {selected.customerEmail && `(${selected.customerEmail})`}</p>}
            <div className="mt-4 flex flex-wrap gap-2">
              {["open", "in_progress", "resolved", "closed"].map((s) => (
                <button key={s} onClick={() => updateTicket(selected.id, s)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${selected.status === s ? "bg-blue-500 text-white" : "bg-slate-800 text-slate-400 hover:text-white"}`}>
                  {s.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {loading ? (
          <div className="py-12 text-center text-slate-400">Loading...</div>
        ) : tickets.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-[#111827] py-12 text-center text-slate-400">No tickets yet</div>
        ) : (
          tickets.map((t) => (
            <button key={t.id} onClick={() => setSelected(t)}
              className="flex w-full items-center gap-3 rounded-xl border border-slate-800 bg-[#111827] p-4 text-left transition-colors hover:border-slate-700">
              <span className="text-sm font-mono text-slate-500">{t.ticketNumber}</span>
              <span className="min-w-0 flex-1 truncate text-sm">{t.subject}</span>
              <span className={`hidden rounded-full px-2 py-0.5 text-xs font-medium sm:inline-block ${priorityColor[t.priority] || ""}`}>{t.priority}</span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor[t.status] || ""}`}>{t.status}</span>
              <span className="text-xs text-slate-500">{new Date(t.createdAt).toLocaleDateString()}</span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
