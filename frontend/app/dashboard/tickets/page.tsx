"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Card, CardHeader, CardTitle, Badge, Button, Modal, Input, Textarea, Spinner, EmptyState } from "@supportai/ui";

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

  const priorityTones: Record<string, "danger" | "warning" | "success"> = { high: "danger", medium: "warning", low: "success" };
  const statusTones: Record<string, "primary" | "warning" | "success"> = { open: "primary", in_progress: "warning", resolved: "success" };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Tickets</h1>
        <Button onClick={() => setCreating(true)} className="w-full sm:w-auto">+ New Ticket</Button>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {counts.total > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full mb-4">
            <Card className="p-3 text-center"><p className="text-2xl font-bold text-fg">{counts.total}</p><p className="text-xs text-muted">Total</p></Card>
            <Card className="p-3 text-center border-primary/30 bg-primary-soft"><p className="text-2xl font-bold text-primary">{counts.open}</p><p className="text-xs text-muted">Open</p></Card>
            <Card className="p-3 text-center border-warning/30 bg-warning-soft"><p className="text-2xl font-bold text-warning">{counts.inProgress}</p><p className="text-xs text-muted">In Progress</p></Card>
            <Card className="p-3 text-center border-success/30 bg-success-soft"><p className="text-2xl font-bold text-success">{counts.resolved}</p><p className="text-xs text-muted">Resolved</p></Card>
          </div>
        )}
        {filters.map((f) => (
          <Button key={f.value} variant={filter === f.value ? "primary" : "outline"} size="sm" onClick={() => setFilter(f.value)}>
            {f.label}
          </Button>
        ))}
      </div>

      {loading ? (
        <Spinner label="Loading tickets..." />
      ) : tickets.length === 0 ? (
        <EmptyState title="No tickets found" />
      ) : (
        <div className="space-y-2">
          {tickets.map((t) => (
            <button key={t.id} onClick={() => setSelected(t)} className="w-full rounded-2xl border border-border bg-surface p-3 sm:p-4 text-left hover:border-border-strong transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                <span className="text-xs font-mono text-muted shrink-0">{t.ticketNumber}</span>
                <span className="text-sm text-fg flex-1 min-w-0 truncate">{t.subject}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge tone={priorityTones[t.priority] || "neutral"}>{t.priority}</Badge>
                  <Badge tone={statusTones[t.status] || "primary"}>{t.status}</Badge>
                  <span className="text-[11px] text-muted hidden sm:inline">{new Date(t.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <Modal open={true} onClose={() => setSelected(null)} title={selected.ticketNumber}>
          <p className="text-sm text-fg-secondary mt-1 mb-4">{selected.subject}</p>
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge tone={priorityTones[selected.priority]}>{selected.priority}</Badge>
            <Badge tone={statusTones[selected.status]}>{selected.status}</Badge>
          </div>
          {selected.description && <p className="text-sm text-fg-secondary mb-4 whitespace-pre-wrap">{selected.description}</p>}
          <div className="text-xs text-muted space-y-1 mt-auto border-t border-border pt-4">
            {selected.customerName && <p>Customer: {selected.customerName}</p>}
            {selected.customerEmail && <p>Email: {selected.customerEmail}</p>}
            <p>Created: {new Date(selected.createdAt).toLocaleString()}</p>
          </div>
        </Modal>
      )}

      <Modal open={creating} onClose={() => setCreating(false)} title="New Ticket"
        footer={<>
          <Button variant="ghost" onClick={() => setCreating(false)}>Cancel</Button>
          <Button onClick={createTicket}>Create</Button>
        </>}
      >
        <div className="space-y-3">
          <Input placeholder="Subject *" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
          <Textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input placeholder="Customer Name" value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} />
            <Input placeholder="Customer Email" value={form.customerEmail} onChange={(e) => setForm({ ...form, customerEmail: e.target.value })} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-fg">Priority</label>
            <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="w-full rounded-xl border border-border bg-surface-alt px-3 py-2.5 text-sm text-fg outline-none focus:ring-2 focus:ring-primary">
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
}
