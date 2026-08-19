"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

interface Message {
  id: string;
  senderType: string;
  content: string;
  createdAt: string;
}

interface Conversation {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  messages?: Message[];
}

export default function Conversations() {
  const [items, setItems] = useState<Conversation[]>([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function load() {
    setLoading(true);
    apiFetch<{ items: Conversation[] }>(`/conversations${status ? `?status=${status}` : ""}`)
      .then((data) => setItems(data.items || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, [status]);

  const statusColors: Record<string, string> = {
    active: "bg-green-500/10 text-green-400 border-green-500/30",
    closed: "bg-slate-500/10 text-slate-400 border-slate-500/30",
    escalated: "bg-orange-500/10 text-orange-400 border-orange-500/30",
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Conversations</h1>
        <div className="flex gap-2">
          {["", "active", "closed", "escalated"].map((s) => (
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
        <div className="rounded-xl border border-slate-800 bg-[#111827] p-8 text-center text-slate-400">No conversations yet</div>
      ) : (
        <div className="space-y-3">
          {items.map((c) => (
            <div key={c.id} className="rounded-xl border border-slate-800 bg-[#111827] p-5">
              <div className="flex items-center justify-between">
                <div className="font-medium">{c.title || "Untitled conversation"}</div>
                <span className={`rounded-full border px-3 py-1 text-xs ${statusColors[c.status] || "bg-blue-500/10 text-blue-400 border-blue-500/30"}`}>
                  {c.status}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                <span>{c.messages && c.messages.length > 0 ? c.messages[0].content.slice(0, 80) : "No messages"}</span>
                <span>{new Date(c.updatedAt).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}