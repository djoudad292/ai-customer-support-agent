"use client";
import Link from "next/link";
import { Bot, Ticket, Package, MessageSquare, ClipboardList, CalendarDays, BookOpen, BarChart3, Plug, Download, Smartphone } from "lucide-react";

const APK_URL = "https://github.com/djoudad292/ai-customer-support-agent/releases/download/latest-apk/ai-customer-support.apk";

const features = [
  { icon: Bot, title: "AI Chat 24/7", desc: "Answers customer questions instantly using your knowledge base, powered by LangGraph." },
  { icon: Ticket, title: "Support Tickets", desc: "AI automatically creates and tracks support tickets when issues are reported." },
  { icon: Package, title: "Order Lookup", desc: "Customers can check order status and tracking directly through the AI chat." },
  { icon: MessageSquare, title: "Human Escalation", desc: "Seamlessly hands off to a human agent when the AI can't resolve an issue." },
  { icon: ClipboardList, title: "Lead Capture", desc: "Automatically captures visitor contact details and saves them as leads in your pipeline." },
  { icon: CalendarDays, title: "Appointment Booking", desc: "Books meetings and appointments directly in chat with dates parsed automatically." },
  { icon: BookOpen, title: "Knowledge Base + RAG", desc: "Upload your docs, FAQs, and policies. Semantic vector search pulls accurate answers." },
  { icon: BarChart3, title: "Analytics Dashboard", desc: "Track conversations, tickets, orders, leads, AI vs human handling, and more." },
  { icon: Plug, title: "One-Line Widget", desc: "Add the AI chat to any website with a single <script> tag. Embeddable and customizable." },
];

const steps = [
  { num: "1", title: "Upload Knowledge", desc: "Add your FAQ, docs, and policies to the knowledge base." },
  { num: "2", title: "Configure AI Agent", desc: "The AI learns your products, services, and processes." },
  { num: "3", title: "Embed Widget", desc: "Copy one line of code and paste it into your website." },
  { num: "4", title: "Serve Customers", desc: "AI handles support, tickets, orders, and escalates when needed." },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0a0f1a] text-slate-50">
      <header className="fixed top-0 z-50 w-full border-b border-slate-800 bg-[#0a0f1a]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500">
              <MessageSquare className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-semibold">AI Support Agent</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-slate-400 hover:text-slate-200 transition-colors">Sign In</Link>
            <Link href="/register" className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 transition-colors">Get Started</Link>
          </div>
        </div>
      </header>

      <section className="flex min-h-screen items-center justify-center px-4 pt-20">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800/50 px-4 py-1.5 text-xs text-slate-300">
            <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
            Powered by LangGraph + Gemini AI
          </div>
          <h1 className="mb-6 text-3xl font-bold leading-tight sm:text-5xl lg:text-6xl">
            AI Customer Support Agent
            <span className="block bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">That Actually Works</span>
          </h1>
          <p className="mb-8 max-w-2xl text-base text-slate-400 sm:text-lg">
            Handles real conversations, creates support tickets, looks up orders, books appointments, and escalates to humans — all with one embeddable widget.
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link href="/register" className="w-full rounded-lg bg-blue-500 px-6 py-3 text-sm font-medium text-white hover:bg-blue-600 transition-colors sm:w-auto">
              Start Free — No Credit Card
            </Link>
            <Link href="/login" className="w-full rounded-lg border border-slate-700 px-6 py-3 text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors sm:w-auto">
              View Dashboard
            </Link>
          </div>
        </div>
      </section>

      <section className="px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-4 text-center text-2xl font-bold sm:text-3xl">Everything You Need</h2>
          <p className="mb-12 text-center text-slate-400">Production-grade features that companies pay $5,000-$15,000 for.</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="rounded-xl border border-slate-800 bg-[#111827] p-6 transition-colors hover:border-slate-700">
                <f.icon className="mb-3 h-8 w-8 text-blue-500" />
                <h3 className="mb-2 text-base font-semibold">{f.title}</h3>
                <p className="text-sm leading-relaxed text-slate-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-12 text-center text-2xl font-bold sm:text-3xl">Up and Running in Minutes</h2>
          <div className="space-y-4">
            {steps.map((s) => (
              <div key={s.num} className="flex items-start gap-4 rounded-xl border border-slate-800 bg-[#111827] p-5 sm:p-6">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-lg font-bold text-blue-400">{s.num}</div>
                <div>
                  <h3 className="text-base font-semibold">{s.title}</h3>
                  <p className="text-sm text-slate-400">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16">
        <div className="mx-auto max-w-2xl rounded-2xl border border-green-500/20 bg-green-500/5 p-8 text-center sm:p-12">
          <Smartphone className="mx-auto mb-4 h-12 w-12 text-green-400" />
          <h2 className="mb-4 text-2xl font-bold sm:text-3xl">Download the Mobile App</h2>
          <p className="mb-8 text-slate-400">Manage your customer support from anywhere. Available for Android.</p>
          <a href={APK_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-8 py-3 font-medium text-white hover:bg-green-500 transition-colors">
            <Download className="h-5 w-5" />
            Download APK
          </a>
          <p className="mt-4 text-xs text-slate-500">Requires Android 8.0+. Auto-updates via GitHub.</p>
        </div>
      </section>

      <section className="px-4 py-20">
        <div className="mx-auto max-w-2xl rounded-2xl border border-slate-800 bg-[#111827] p-8 text-center sm:p-12">
          <h2 className="mb-4 text-2xl font-bold sm:text-3xl">Ready to Automate Support?</h2>
          <p className="mb-8 text-slate-400">Deploy your AI agent in minutes. Under $10/month to run.</p>
          <Link href="/register" className="inline-block rounded-lg bg-blue-500 px-8 py-3 font-medium text-white hover:bg-blue-600 transition-colors">
            Get Started Free
          </Link>
        </div>
      </section>

      <footer className="border-t border-slate-800 px-4 py-8 text-center text-sm text-slate-500">
        AI Customer Support Agent — Built with Next.js, LangGraph & Prisma
      </footer>
    </div>
  );
}
