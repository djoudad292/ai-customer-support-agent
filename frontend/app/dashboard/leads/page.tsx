"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  source: string;
  status: string;
  createdAt: string;
}

const statusColors: Record<string, string> = {
  new: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  contacted: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
  converted: "bg-green-500/10 text-green-400 border-green-500/30",
  lost: "bg-red-500/10 text-red-400 border-red-500/30",
};

export default function Leads() {
  const [items, setItems] = useState<Lead[]>([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function load() {
    setLoading(true);
    apiFetch<{ items: Lead[] }>(`/leads${status ? `?status=${status}` : ""}`)
      .then((data) => setItems(data.items || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, [status]);

  async function updateStatus(id: string, newStatus: string) {
    try {
      await apiFetch(`/leads/${id}/status`, { method: "PATCH", body: JSON.stringify({ status: newStatus }) });
      load();
    } catch (e: any) {
      setError(e.message);
    }
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Leads</h1>
        <div className="flex gap-2">
          {["", "new", "contacted", "converted", "lost"].map((s) => (
            <button key={s} onClick={() => setStatus(s)} className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${status === s ? "bg-blue-500 text-white" : "border border-slate-700 text-slate-400 hover:bg-slate-800"}`}>
              {s === "" ? "All" : s[0].toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>
      {error && <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>}
      {loading ? (
        <div className="text-slate-400">Loading...</div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-[#111827] p-8 text-center text-slate-400">No leads yet</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-sm">
            <thead className="bg-[#111827] text-left text-slate-400">
              <tr>
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Phone</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 bg-[#0d1424]">
              {items.map((l) => (
                <tr key={l.id} className="hover:bg-[#111827]">
                  <td className="px-5 py-3 font-medium">{l.name || "—"}</td>
                  <td className="px-5 py-3 text-slate-400">{l.email || "—"}</td>
                  <td className="px-5 py-3 text-slate-400">{l.phone || "—"}</td>
                  <td className="px-5 py-3">
                    <select value={l.status} onChange={(e) => updateStatus(l.id, e.target.value)} className={`rounded-full border px-2 py-1 text-xs outline-none ${statusColors[l.status] || "bg-slate-500/10 text-slate-400"}`}>
                      <option value="new">new</option>
                      <option value="contacted">contacted</option>
                      <option value="converted">converted</option>
                      <option value="lost">lost</option>
                    </select>
                  </td>
                  <td className="px-5 py-3 text-xs text-slate-500">{new Date(l.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}