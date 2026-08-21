"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Card, CardHeader, CardTitle, Badge, Button, Modal, Spinner, EmptyState } from "@supportai/ui/web";

interface Order {
  id: string;
  orderNumber: string;
  customerName?: string;
  customerEmail?: string;
  items: any;
  status: string;
  total: number;
  currency: string;
  trackingNumber?: string;
  createdAt: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [counts, setCounts] = useState({ total: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0 });
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Order | null>(null);

  useEffect(() => { load(); }, [filter]);

  async function load() {
    setLoading(true);
    try {
      const q = filter ? `?status=${filter}` : "";
      const [orderData, countData] = await Promise.all([
        apiFetch<{ items: Order[] }>(`/orders${q}`),
        apiFetch<{ total: number; processing: number; shipped: number; delivered: number; cancelled: number }>("/orders/counts"),
      ]);
      setOrders(orderData.items || []);
      setCounts(countData);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function updateOrder(id: string, status: string) {
    try {
      await apiFetch(`/orders/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
      load();
      if (selected?.id === id) setSelected({ ...selected, status });
    } catch (e) { console.error(e); }
  }

  const statusTones: Record<string, "primary" | "warning" | "success" | "danger"> = { processing: "primary", shipped: "warning", delivered: "success", cancelled: "danger" };

  const stats = [
    { label: "Total", value: counts.total, tone: "neutral" as const },
    { label: "Processing", value: counts.processing, tone: "primary" as const },
    { label: "Shipped", value: counts.shipped, tone: "warning" as const },
    { label: "Delivered", value: counts.delivered, tone: "success" as const },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold tracking-tight">Orders</h2>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <button key={s.label} onClick={() => setFilter(filter === s.label.toLowerCase() ? "" : s.label.toLowerCase())}
            className={`rounded-2xl border bg-surface p-4 text-left transition-colors hover:border-border-strong ${filter === s.label.toLowerCase() ? "ring-2 ring-primary border-primary" : "border-border"}`}>
            <p className="text-xs text-muted font-semibold">{s.label}</p>
            <p className={`text-2xl font-bold text-${s.tone}`}>{s.value}</p>
          </button>
        ))}
      </div>

      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.orderNumber || "Order Details"}
        footer={<div className="flex flex-wrap gap-2">
          {["processing", "shipped", "delivered", "cancelled"].map((s) => (
            <Button key={s} variant={selected?.status === s ? "primary" : "outline"} size="sm" onClick={() => selected && updateOrder(selected.id, s)}>
              {s}
            </Button>
          ))}
        </div>}
      >
        <div className="space-y-2 text-sm mb-4">
          <p className="text-fg-secondary">Customer: {selected?.customerName || "N/A"} {selected?.customerEmail && `(${selected?.customerEmail})`}</p>
          <p className="text-fg-secondary">Total: <span className="font-bold text-fg">{selected?.total} {selected?.currency}</span></p>
          <p className="text-fg-secondary">Status: <Badge tone={statusTones[selected?.status || ""]}>{selected?.status}</Badge></p>
          {selected?.trackingNumber && <p className="text-muted">Tracking: {selected?.trackingNumber}</p>}
          <p className="text-muted text-xs mt-4">Created: {selected && new Date(selected.createdAt).toLocaleString()}</p>
        </div>
      </Modal>

      <div className="space-y-2">
        {loading ? (
          <Spinner label="Loading orders..." />
        ) : orders.length === 0 ? (
          <EmptyState title="No orders yet" />
        ) : (
          orders.map((o) => (
            <button key={o.id} onClick={() => setSelected(o)}
              className="flex w-full items-center gap-3 rounded-2xl border border-border bg-surface p-4 text-left transition-colors hover:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg">
              <span className="text-sm font-mono text-muted">{o.orderNumber}</span>
              <span className="min-w-0 flex-1 truncate text-sm text-fg">{o.customerName || "Unknown"}</span>
              <span className="text-sm font-bold text-fg">${o.total}</span>
              <Badge tone={statusTones[o.status]}>{o.status}</Badge>
              <span className="text-xs text-muted hidden sm:inline">{new Date(o.createdAt).toLocaleDateString()}</span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
