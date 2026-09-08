'use client'

import { useState, useRef, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { MessageSquare, Send, X, Bot, User, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const PRESET_QA: Record<string, string> = {
  'create ticket': 'I\'ve created support ticket #TK-4521 for you. A support agent will follow up within 24 hours.',
  'track order': 'Your order #1234 is currently in transit with tracking #TRK-5678. Estimated delivery: tomorrow.',
  'book meeting': 'I can book a meeting for you! What date and time works best?',
  'return': 'I can help with returns. What\'s your order number? I\'ll check the return policy and initiate the process.',
  'refund': 'I understand you\'d like a refund. Let me look up your order. What\'s the order number?',
}

const FALLBACK = 'I can help with tickets, orders, and meetings. Try asking me to create a ticket, track an order, or book a meeting!'

function matchAnswer(q: string): string {
  const lower = q.toLowerCase()
  for (const [key, answer] of Object.entries(PRESET_QA)) {
    if (lower.includes(key) || key.split(' ').every((w) => lower.includes(w))) return answer
  }
  return FALLBACK
}

interface Message {
  role: 'user' | 'assistant'
  text: string
}

export function DemoChat() {
  const searchParams = useSearchParams()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', text: 'Hello! I\'m the AI Support Agent. I can help with tickets, orders, and meetings. What would you like to do?' },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (searchParams.get('demo') === 'true') {
      setOpen(true)
    }
  }, [searchParams])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', text }])
    setLoading(true)
    await new Promise((r) => setTimeout(r, 600 + Math.random() * 400))
    setMessages((prev) => [...prev, { role: 'assistant', text: matchAnswer(text) }])
    setLoading(false)
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all hover:scale-105',
          open ? 'bg-slate-700 text-white' : 'bg-blue-600 text-white'
        )}
      >
        {open ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 flex w-[360px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-slate-700 bg-[#0B1120] shadow-2xl">
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-slate-700 bg-blue-600 px-4 py-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">SupportAI</p>
              <p className="text-xs text-white/70">Usually replies instantly</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ maxHeight: 360 }}>
            {messages.map((msg, i) => (
              <div key={i} className={cn('flex gap-2', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                {msg.role === 'assistant' && (
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600/20 mt-0.5">
                    <Bot className="h-3 w-3 text-blue-400" />
                  </div>
                )}
                <div
                  className={cn(
                    'max-w-[80%] rounded-xl px-3 py-2 text-sm leading-relaxed',
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 text-slate-200'
                  )}
                >
                  {msg.text}
                </div>
                {msg.role === 'user' && (
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-700 mt-0.5">
                    <User className="h-3 w-3 text-slate-400" />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-2">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600/20">
                  <Loader2 className="h-3 w-3 animate-spin text-blue-400" />
                </div>
                <div className="rounded-xl bg-slate-800 px-3 py-2 text-sm text-slate-400">
                  Thinking...
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Quick Replies */}
          <div className="flex flex-wrap gap-1 px-4 py-2 border-t border-slate-700">
            {['Create Ticket', 'Track Order', 'Book Meeting'].map((b) => (
              <button
                key={b}
                onClick={() => { setInput(b); }}
                className="rounded-full bg-blue-600/20 border border-blue-500/30 px-2 py-1 text-[10px] font-medium text-blue-300 hover:bg-blue-600/30"
              >
                {b}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="border-t border-slate-700 p-3">
            <form
              onSubmit={(e) => { e.preventDefault(); send() }}
              className="flex gap-2"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about tickets, orders..."
                className="flex-1 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
