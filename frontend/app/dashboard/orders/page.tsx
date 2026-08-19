"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

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

  const statusColor: Record<string, string> = {
    processing: "bg-blue-500/10 text-blue-400",
    shipped: "bg-yellow-500/10 text-yellow-400",
    delivered: "bg-green-500/10 text-green-400",
    cancelled: "bg-red-500/10 text-red-400",
  };

  const stats = [
    { label: "Total", value: counts.total, color: "text-white" },
    { label: "Processing", value: counts.processing, color: "text-blue-400" },
    { label: "Shipped", value: counts.shipped, color: "text-yellow-400" },
    { label: "Delivered", value: counts.delivered, color: "text-green-400" },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Orders</h2>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <button key={s.label} onClick={() => setFilter(filter === s.label.toLowerCase() ? "" : s.label.toLowerCase())}
            className={`rounded-lg border border-slate-800 bg-[#111827] p-4 text-left transition-colors hover:border-slate-700 ${filter === s.label.toLowerCase() ? "ring-1 ring-blue-500" : ""}`}>
            <p className="text-xs text-slate-400">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </button>
        ))}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setSelected(null)}>
          <div className="w-full max-w-lg rounded-xl border border-slate-700 bg-[#111827] p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">{selected.orderNumber}</h3>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="space-y-2 text-sm">
              <p className="text-slate-300">Customer: {selected.customerName || "N/A"} {selected.customerEmail && `(${selected.customerEmail})`}</p>
              <p className="text-slate-300">Total: {selected.total} {selected.currency}</p>
              <p className="text-slate-300">Status: <span className={`rounded-full px-2 py-0.5 text-xs ${statusColor[selected.status]}`}>{selected.status}</span></p>
              {selected.trackingNumber && <p className="text-slate-400">Tracking: {selected.trackingNumber}</p>}
              <p className="text-slate-500">Created: {new Date(selected.createdAt).toLocaleString()}</p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {["processing", "shipped", "delivered", "cancelled"].map((s) => (
                <button key={s} onClick={() => updateOrder(selected.id, s)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${selected.status === s ? "bg-blue-500 text-white" : "bg-slate-800 text-slate-400 hover:text-white"}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {loading ? (
          <div className="py-12 text-center text-slate-400">Loading...</div>
        ) : orders.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-[#111827] py-12 text-center text-slate-400">No orders yet</div>
        ) : (
          orders.map((o) => (
            <button key={o.id} onClick={() => setSelected(o)}
              className="flex w-full items-center gap-3 rounded-xl border border-slate-800 bg-[#111827] p-4 text-left transition-colors hover:border-slate-700">
              <span className="text-sm font-mono text-slate-500">{o.orderNumber}</span>
              <span className="min-w-0 flex-1 truncate text-sm">{o.customerName || "Unknown"}</span>
              <span className="text-sm font-medium">${o.total}</span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor[o.status] || ""}`}>{o.status}</span>
              <span className="text-xs text-slate-500">{new Date(o.createdAt).toLocaleDateString()}</span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
