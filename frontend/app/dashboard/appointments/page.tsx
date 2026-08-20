"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

interface Appointment {
  id: string;
  customerName: string;
  customerEmail: string;
  title: string;
  notes: string;
  startTime: string;
  endTime: string;
  status: string;
}

const statusColors: Record<string, string> = {
  requested: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  confirmed: "bg-green-500/10 text-green-400 border-green-500/30",
  cancelled: "bg-red-500/10 text-red-400 border-red-500/30",
  completed: "bg-slate-500/10 text-slate-400 border-slate-500/30",
};

export default function Appointments() {
  const [items, setItems] = useState<Appointment[]>([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function load() {
    setLoading(true);
    apiFetch<Appointment[]>(`/appointments${status ? `?status=${status}` : ""}`)
      .then(setItems)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, [status]);

  async function updateStatus(id: string, newStatus: string) {
    try {
      await apiFetch(`/appointments/${id}/status`, { method: "PATCH", body: JSON.stringify({ status: newStatus }) });
      load();
    } catch (e: any) {
      setError(e.message);
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Appointments</h1>
        <div className="flex flex-wrap gap-2">
          {["", "requested", "confirmed", "cancelled", "completed"].map((s) => (
            <button key={s} onClick={() => setStatus(s)} className={`rounded-lg px-3 py-1.5 text-xs sm:text-sm transition-colors ${status === s ? "bg-blue-500 text-white" : "border border-slate-700 text-slate-400 hover:bg-slate-800"}`}>
              {s === "" ? "All" : s[0].toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>
      {error && <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>}
      {loading ? (
        <div className="text-slate-400">Loading...</div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-[#111827] p-8 text-center text-slate-400">No appointments yet</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((a) => (
            <div key={a.id} className="rounded-xl border border-slate-800 bg-[#111827] p-5">
              <div className="mb-3 flex items-start justify-between gap-2">
                <h3 className="font-medium">{a.title}</h3>
                <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs ${statusColors[a.status] || "bg-slate-500/10 text-slate-400"}`}>{a.status}</span>
              </div>
              {a.customerName && <div className="text-sm text-slate-300">{a.customerName}</div>}
              {a.customerEmail && <div className="text-xs text-slate-500">{a.customerEmail}</div>}
              <div className="mt-3 text-xs text-slate-400">
                <div>Start: {new Date(a.startTime).toLocaleString()}</div>
                <div>End: {new Date(a.endTime).toLocaleString()}</div>
              </div>
              {a.notes && <p className="mt-3 line-clamp-2 text-xs text-slate-500">{a.notes}</p>}
              <div className="mt-4">
                <select value={a.status} onChange={(e) => updateStatus(a.id, e.target.value)} className="w-full rounded-lg border border-slate-700 px-3 py-1.5 text-xs outline-none">
                  <option value="requested">requested</option>
                  <option value="confirmed">confirmed</option>
                  <option value="cancelled">cancelled</option>
                  <option value="completed">completed</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}