"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Card, Badge, Button, Spinner, EmptyState, ErrorBanner } from "@supportai/ui/web";

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

  const statusTones: Record<string, "success" | "neutral" | "warning"> = {
    active: "success",
    closed: "neutral",
    escalated: "warning",
  };

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Conversations</h1>
        <div className="flex flex-wrap gap-2">
          {["", "active", "closed", "escalated"].map((s) => (
            <Button key={s} variant={status === s ? "primary" : "outline"} size="sm" onClick={() => setStatus(s)}>
              {s === "" ? "All" : s[0].toUpperCase() + s.slice(1)}
            </Button>
          ))}
        </div>
      </div>
      {error && <ErrorBanner message={error} />}
      {loading ? (
        <Spinner label="Loading conversations..." />
      ) : items.length === 0 ? (
        <EmptyState title="No conversations yet" subtitle="Conversations will appear here when users interact with your AI agent." />
      ) : (
        <div className="space-y-3">
          {items.map((c) => (
            <Card key={c.id} className="p-4 sm:p-5 hover:border-border-strong transition-colors">
              <div className="flex items-center justify-between gap-3">
                <div className="font-medium truncate flex-1 text-fg">{c.title || "Untitled conversation"}</div>
                <Badge tone={statusTones[c.status] || "primary"}>
                  {c.status}
                </Badge>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-muted gap-2">
                <span className="truncate flex-1">{c.messages && c.messages.length > 0 ? c.messages[0].content.slice(0, 80) : "No messages"}</span>
                <span className="shrink-0 text-[10px]">{new Date(c.updatedAt).toLocaleDateString()}</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
