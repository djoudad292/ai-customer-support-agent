"use client";
import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { Network, Send, Loader2, GitBranch } from "lucide-react";

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
      <div className="flex items-center gap-2">
        <Network className="h-6 w-6 text-blue-500" />
        <h2 className="text-xl font-bold">LangGraph Inspector</h2>
      </div>
      
      <form onSubmit={handleChat} className="space-y-4 rounded-xl border border-slate-800 bg-[#111827] p-6 shadow-sm">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">Conversation ID (Optional)</label>
          <input type="text" placeholder="UUID or leave empty for new" value={conversationId} onChange={(e) => setConversationId(e.target.value)} className="w-full rounded-lg bg-slate-900 border border-slate-700 px-4 py-2.5 text-sm outline-none focus:border-blue-500" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">Test Message</label>
          <input type="text" placeholder="Enter message..." value={message} onChange={(e) => setMessage(e.target.value)} className="w-full rounded-lg bg-slate-900 border border-slate-700 px-4 py-2.5 text-sm outline-none focus:border-blue-500" />
        </div>
        <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-50">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {loading ? "Processing..." : "Send Message"}
        </button>
      </form>

      {trace.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-slate-300">Execution Trace</h3>
          {trace.map((step, i) => (
            <div key={i} className="flex gap-4 rounded-xl border border-slate-800 bg-[#111827] p-5">
              <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-800 border border-slate-700 text-blue-400">
                <GitBranch className="h-4 w-4" />
              </div>
              <div className="flex-1 space-y-2">
                <h4 className="text-sm font-bold text-slate-100">Step {i + 1}: {Object.keys(step)[0]}</h4>
                <pre className="rounded-lg bg-slate-900 p-3 text-xs text-slate-400 overflow-x-auto border border-slate-800">{JSON.stringify(Object.values(step)[0], null, 2)}</pre>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
