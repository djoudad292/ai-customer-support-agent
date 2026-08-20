"use client";
import { useState, useRef, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import {
  Network,
  Send,
  Loader2,
  GitBranch,
  Bot,
  User,
  ChevronDown,
  ChevronUp,
  Sparkles,
  MessageSquare,
  RotateCcw,
} from "lucide-react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  metadata?: {
    type: string;
    title?: string;
    options: { label: string; value: string }[];
  } | null;
  trace?: any[];
  timestamp: number;
}

const WELCOME_MESSAGE = {
  role: "assistant" as const,
  content:
    "Hello! I'm your AI customer support assistant. I can help you with tickets, orders, appointments, and more. What would you like to do?",
  metadata: {
    type: "quick_replies",
    options: [
      { label: "Create Ticket", value: "I need to create a ticket" },
      { label: "Track Order", value: "I want to check my order" },
      {
        label: "Book Appointment",
        value: "I want to book an appointment",
      },
      { label: "Talk to Human", value: "I want to talk to a human agent" },
    ],
  },
  timestamp: Date.now(),
};

export default function GraphInspector() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    WELCOME_MESSAGE,
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [expandedTrace, setExpandedTrace] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const conversationIdRef = useRef<string>(
    crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).substring(2)
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;

    const userMsg: ChatMessage = {
      role: "user",
      content: text,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const data = await apiFetch<{
        response: string;
        metadata?: any;
        trace: any[];
      }>("/agent/chat", {
        method: "POST",
        body: JSON.stringify({
          conversationId: conversationIdRef.current,
          message: text,
        }),
      });

      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: data.response,
        metadata: data.metadata,
        trace: data.trace,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Sorry, I encountered an error. Please try again.",
          metadata: null,
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    sendMessage(input);
  }

  function handleReset() {
    setMessages([WELCOME_MESSAGE]);
    conversationIdRef.current = crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).substring(2);
  }

  const nodeColors: Record<string, string> = {
    understand: "bg-blue-500",
    retrieveKnowledge: "bg-purple-500",
    decideAction: "bg-amber-500",
    captureLead: "bg-green-500",
    bookAppointment: "bg-cyan-500",
    createTicket: "bg-orange-500",
    lookupOrder: "bg-indigo-500",
    escalateToHuman: "bg-red-500",
    respond: "bg-emerald-500",
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Network className="h-6 w-6 text-blue-500" />
          <h2 className="text-xl font-bold text-slate-100">
            AI Customer Support
          </h2>
          <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-medium text-blue-400 border border-blue-500/20">
            LangGraph Powered
          </span>
        </div>
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 transition-colors"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          New Conversation
        </button>
      </div>

      <div className="flex-1 flex gap-4 min-h-0">
        <div className="flex-1 flex flex-col rounded-xl border border-slate-800 bg-[#0d1117] overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className="space-y-2">
                <div
                  className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600/20 border border-blue-500/30">
                      <Bot className="h-4 w-4 text-blue-400" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-blue-600 text-white rounded-br-md"
                        : "bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-md"
                    }`}
                  >
                    {msg.content.split("\n").map((line, j) => (
                      <p key={j} className={j > 0 ? "mt-2" : ""}>
                        {line}
                      </p>
                    ))}
                  </div>
                  {msg.role === "user" && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-700 border border-slate-600">
                      <User className="h-4 w-4 text-slate-300" />
                    </div>
                  )}
                </div>

                {msg.role === "assistant" &&
                  msg.metadata &&
                  msg.metadata.options &&
                  msg.metadata.options.length > 0 && (
                    <div className="flex flex-wrap gap-2 ml-11">
                      {msg.metadata.title && (
                        <div className="w-full flex items-center gap-1.5 mb-1">
                          <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                          <span className="text-xs font-medium text-amber-400">
                            {msg.metadata.title}
                          </span>
                        </div>
                      )}
                      {msg.metadata.options.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => sendMessage(opt.value)}
                          disabled={loading}
                          className={`rounded-xl px-4 py-2 text-xs font-semibold transition-all disabled:opacity-50 ${
                            msg.metadata?.type === "confirmation"
                              ? "bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-500/20"
                              : msg.metadata?.type === "quick_replies"
                                ? "bg-slate-800 text-slate-200 border border-slate-600 hover:border-blue-500 hover:text-blue-400"
                                : "bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}

                {msg.role === "assistant" && msg.trace && msg.trace.length > 0 && (
                  <div className="ml-11">
                    <button
                      onClick={() =>
                        setExpandedTrace(expandedTrace === i ? null : i)
                      }
                      className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-400 transition-colors"
                    >
                      <GitBranch className="h-3 w-3" />
                      <span>
                        {msg.trace.length} graph nodes executed
                      </span>
                      {expandedTrace === i ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      )}
                    </button>

                    {expandedTrace === i && (
                      <div className="mt-2 space-y-1.5 rounded-lg border border-slate-800 bg-[#111827] p-3">
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {msg.trace.map((step: any, j: number) => {
                            const nodeName = Object.keys(step)[0];
                            return (
                              <span
                                key={j}
                                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium text-white ${nodeColors[nodeName] || "bg-slate-600"}`}
                              >
                                {nodeName}
                                {j < msg.trace!.length - 1 && (
                                  <span className="ml-0.5 text-white/50">
                                    →
                                  </span>
                                )}
                              </span>
                            );
                          })}
                        </div>
                        {msg.trace.map((step: any, j: number) => {
                          const nodeName = Object.keys(step)[0];
                          const data = step[nodeName];
                          return (
                            <div
                              key={j}
                              className="flex items-start gap-2 text-xs"
                            >
                              <span
                                className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${nodeColors[nodeName] || "bg-slate-600"}`}
                              />
                              <div>
                                <span className="font-semibold text-slate-300">
                                  {nodeName}
                                </span>
                                {Object.keys(data).length > 0 && (
                                  <pre className="mt-1 rounded bg-slate-900 p-2 text-[10px] text-slate-400 overflow-x-auto border border-slate-800">
                                    {JSON.stringify(data, null, 2)}
                                  </pre>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600/20 border border-blue-500/30">
                  <Bot className="h-4 w-4 text-blue-400" />
                </div>
                <div className="flex items-center gap-2 rounded-2xl bg-slate-800 border border-slate-700 px-4 py-3 rounded-bl-md">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
                  <span className="text-sm text-slate-400">
                    Thinking...
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form
            onSubmit={handleSubmit}
            className="border-t border-slate-800 p-4 flex gap-3"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              disabled={loading}
              className="flex-1 rounded-xl bg-slate-900 border border-slate-700 px-4 py-3 text-sm text-slate-200 outline-none focus:border-blue-500 transition-colors disabled:opacity-50 placeholder:text-slate-500"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:hover:bg-blue-600"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </form>
        </div>

        <div className="hidden lg:flex w-80 flex-col rounded-xl border border-slate-800 bg-[#0d1117] p-4 overflow-y-auto">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="h-4 w-4 text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-300">
              Conversation History
            </h3>
          </div>
          <div className="space-y-3">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`rounded-lg p-3 text-xs border ${
                  msg.role === "user"
                    ? "bg-blue-600/10 border-blue-500/20 text-blue-200"
                    : "bg-slate-800/50 border-slate-700/50 text-slate-300"
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  {msg.role === "user" ? (
                    <User className="h-3 w-3 text-blue-400" />
                  ) : (
                    <Bot className="h-3 w-3 text-slate-400" />
                  )}
                  <span className="font-semibold capitalize text-[10px]">
                    {msg.role}
                  </span>
                </div>
                <p className="line-clamp-3">{msg.content}</p>
                {msg.trace && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {msg.trace.map((s: any, j: number) => {
                      const n = Object.keys(s)[0];
                      return (
                        <span
                          key={j}
                          className={`rounded-full px-1.5 py-0.5 text-[9px] text-white ${nodeColors[n] || "bg-slate-600"}`}
                        >
                          {n}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
