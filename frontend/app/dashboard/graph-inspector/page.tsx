"use client";
import { useState } from "react";
import { apiFetch } from "@/lib/api";

export default function GraphInspector() {
  const [conversationId, setConversationId] = useState("");
  const [message, setMessage] = useState("");
  const [trace, setTrace] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  async function handleChat(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await apiFetch<{ trace: any[] }>("/agent/chat", {
        method: "POST",
        body: JSON.stringify({ conversationId, message }),
      });
      setTrace(data.trace);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">LangGraph Inspector</h2>
      <form onSubmit={handleChat} className="space-y-3 rounded-xl border border-slate-800 bg-[#111827] p-6">
        <input type="text" placeholder="Conversation ID (optional)" value={conversationId} onChange={(e) => setConversationId(e.target.value)} className="w-full rounded-lg bg-slate-800 p-2 text-sm outline-none" />
        <input type="text" placeholder="Message" value={message} onChange={(e) => setMessage(e.target.value)} className="w-full rounded-lg bg-slate-800 p-2 text-sm outline-none" />
        <button type="submit" disabled={loading} className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600">
          {loading ? "Processing..." : "Send"}
        </button>
      </form>

      {trace.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold">Execution Trace:</h3>
          {trace.map((step, i) => (
            <div key={i} className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
              <h4 className="text-sm font-bold text-blue-400">Step {i + 1}: {Object.keys(step)[0]}</h4>
              <pre className="mt-2 text-xs text-slate-300 whitespace-pre-wrap">{JSON.stringify(Object.values(step)[0], null, 2)}</pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
