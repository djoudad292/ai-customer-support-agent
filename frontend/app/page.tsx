"use client";
import Link from "next/link";
import { Bot, Ticket, Package, MessageSquare, ClipboardList, CalendarDays, BookOpen, BarChart3, Plug, Download, Smartphone, ArrowRight, CheckCircle2, Zap, Shield, Globe } from "lucide-react";

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
  { num: "4", title: "Serve Customers", desc: "The AI handles support 24/7, escalating when needed." },
];

const mobileFeatures = [
  { icon: MessageSquare, title: "Interactive AI Chat", desc: "Chat with your AI agent using buttons, quick replies, and rich confirmations." },
  { icon: Zap, title: "Real-time Responses", desc: "Watch the AI think step-by-step with visible graph traces." },
  { icon: Shield, title: "Full Dashboard Access", desc: "Manage tickets, orders, leads, and appointments from your phone." },
  { icon: Globe, title: "Works Everywhere", desc: "Monitor your customer support from anywhere with internet access." },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0a0f1a] text-slate-50">
      <header className="fixed top-0 z-50 w-full border-b border-slate-800 bg-[#0a0f1a]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-semibold">SupportAI</span>
          </div>
          <div className="flex items-center gap-3">
            <a href={APK_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-1.5 text-xs font-medium text-green-400 hover:bg-green-500/20 transition-colors">
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Android App</span>
            </a>
            <Link href="/login" className="text-sm text-slate-400 hover:text-white transition-colors">Login</Link>
            <Link href="/register" className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 transition-colors">Get Started</Link>
          </div>
        </div>
      </header>

      {/* Hero with App Download */}
      <section className="relative px-4 pt-24 pb-12 sm:pt-32 sm:pb-20">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-blue-500/5 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-indigo-500/5 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 items-center">
            {/* Left - Text */}
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-400">
                <Zap className="h-3 w-3" />
                LangGraph Powered AI Agent
              </div>
              <h1 className="mb-4 text-3xl font-bold leading-tight sm:text-5xl">
                AI Customer Support
                <span className="block text-blue-500">That Actually Works</span>
              </h1>
              <p className="mb-6 max-w-lg text-base text-slate-400 sm:text-lg">
                Deploy an intelligent AI agent that handles tickets, captures leads, books appointments, and resolves customer issues — 24/7.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link href="/register" className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-500 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-600 transition-colors">
                  Start Free — No Credit Card
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/login" className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-700 px-6 py-3 text-sm font-semibold text-slate-300 hover:bg-slate-800 transition-colors">
                  View Dashboard
                </Link>
              </div>
            </div>

            {/* Right - Phone Mockup with Download */}
            <div className="flex justify-center lg:justify-end">
              <div className="relative w-full max-w-sm">
                {/* Phone Frame */}
                <div className="relative rounded-[2.5rem] border-4 border-slate-700 bg-[#111827] p-2 shadow-2xl shadow-blue-500/10">
                  {/* Notch */}
                  <div className="mx-auto mb-3 h-5 w-24 rounded-full bg-slate-800" />
                  
                  {/* Screen */}
                  <div className="overflow-hidden rounded-[2rem] bg-[#0B1120]">
                    {/* Status Bar */}
                    <div className="flex items-center justify-between px-6 py-2 text-[10px] text-slate-500">
                      <span>9:41</span>
                      <div className="flex items-center gap-1">
                        <div className="h-2.5 w-4 rounded-sm border border-slate-600">
                          <div className="h-full w-3/4 rounded-sm bg-green-500" />
                        </div>
                      </div>
                    </div>

                    {/* Chat Preview */}
                    <div className="px-3 pb-4 space-y-3">
                      {/* Bot Header */}
                      <div className="flex items-center gap-2 px-2 py-2 border-b border-slate-800">
                        <div className="h-6 w-6 rounded-full bg-blue-600/20 flex items-center justify-center">
                          <Bot className="h-3 w-3 text-blue-400" />
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold text-white">SupportAI</p>
                          <p className="text-[9px] text-green-400">Online</p>
                        </div>
                      </div>

                      {/* Messages */}
                      <div className="space-y-2">
                        <div className="flex gap-1.5">
                          <div className="h-5 w-5 rounded-full bg-blue-600/20 flex items-center justify-center shrink-0 mt-0.5">
                            <Bot className="h-2.5 w-2.5 text-blue-400" />
                          </div>
                          <div className="rounded-xl rounded-bl-md bg-slate-800 border border-slate-700 px-3 py-2 text-[10px] text-slate-200 leading-relaxed max-w-[80%]">
                            Hello! I can help you with tickets, orders, and more. What would you like to do?
                          </div>
                        </div>

                        {/* Quick Reply Buttons in phone */}
                        <div className="flex flex-wrap gap-1 ml-6">
                          {["Create Ticket", "Track Order", "Book Meeting"].map((b) => (
                            <span key={b} className="rounded-full bg-blue-600/20 border border-blue-500/30 px-2.5 py-1 text-[9px] font-medium text-blue-300">
                              {b}
                            </span>
                          ))}
                        </div>

                        {/* User Message */}
                        <div className="flex justify-end">
                          <div className="rounded-xl rounded-br-md bg-blue-600 px-3 py-2 text-[10px] text-white max-w-[75%]">
                            I want to check my order #1234
                          </div>
                        </div>

                        {/* Bot Response with Trace */}
                        <div className="flex gap-1.5">
                          <div className="h-5 w-5 rounded-full bg-blue-600/20 flex items-center justify-center shrink-0 mt-0.5">
                            <Bot className="h-2.5 w-2.5 text-blue-400" />
                          </div>
                          <div className="rounded-xl rounded-bl-md bg-slate-800 border border-slate-700 px-3 py-2 text-[10px] text-slate-200 leading-relaxed max-w-[80%]">
                            Found your order! It's currently in transit with tracking #TRK-5678.
                          </div>
                        </div>

                        {/* Trace Chips */}
                        <div className="flex flex-wrap gap-1 ml-6">
                          {["understand", "decideAction", "lookupOrder", "respond"].map((n, i) => (
                            <span key={n} className={`rounded-full px-1.5 py-0.5 text-[7px] font-medium text-white ${
                              ["bg-blue-500", "bg-amber-500", "bg-indigo-500", "bg-emerald-500"][i]
                            }`}>
                              {n}
                            </span>
                          ))}
                        </div>

                        {/* Confirmation Buttons */}
                        <div className="flex flex-wrap gap-1 ml-6">
                          {["Track Package", "Request Return"].map((b) => (
                            <span key={b} className="rounded-lg bg-blue-600 px-2 py-1 text-[9px] font-semibold text-white">
                              {b}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Download Card */}
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 sm:-right-8 sm:left-auto sm:translate-x-0">
                  <a href={APK_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-2xl border border-slate-700 bg-[#111827] p-4 shadow-xl hover:border-green-500/30 transition-all group">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/20">
                      <Download className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white group-hover:text-green-400 transition-colors">Download for Android</p>
                      <p className="text-[11px] text-slate-500">Free · 15 MB · Android 8.0+</p>
                    </div>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile App Section */}
      <section className="px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-xs font-medium text-green-400">
              <Smartphone className="h-3 w-3" />
              Native Android App
            </div>
            <h2 className="mb-3 text-2xl font-bold sm:text-3xl">Manage Support from Your Phone</h2>
            <p className="mx-auto max-w-lg text-slate-400">
              The same powerful AI agent, now in your pocket. Monitor conversations, respond to tickets, and track performance on the go.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {mobileFeatures.map((f) => (
              <div key={f.title} className="rounded-xl border border-slate-800 bg-[#111827] p-5 transition-colors hover:border-slate-700">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                  <f.icon className="h-5 w-5 text-green-400" />
                </div>
                <h3 className="mb-2 text-sm font-semibold">{f.title}</h3>
                <p className="text-xs leading-relaxed text-slate-400">{f.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <a href={APK_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-green-500/20 hover:shadow-green-500/30 transition-all">
              <Download className="h-4 w-4" />
              Download the Android App
            </a>
            <p className="mt-3 text-xs text-slate-500">Free forever · Auto-updates via GitHub · 15 MB</p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 py-16 sm:py-20">
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

      {/* How it Works */}
      <section className="px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-12 text-center text-2xl font-bold sm:text-3xl">Up and Running in Minutes</h2>
          <div className="space-y-4">
            {steps.map((s) => (
              <div key={s.num} className="flex items-start gap-4 rounded-xl border border-slate-800 bg-[#111827] p-5 sm:p-6">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-500 text-sm font-bold text-white">{s.num}</div>
                <div>
                  <h3 className="font-semibold">{s.title}</h3>
                  <p className="mt-1 text-sm text-slate-400">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-2xl rounded-2xl border border-slate-800 bg-[#111827] p-8 text-center sm:p-12">
          <h2 className="mb-4 text-2xl font-bold sm:text-3xl">Ready to Automate Support?</h2>
          <p className="mb-6 text-slate-400">Deploy your AI agent in minutes. Under $10/month to run.</p>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link href="/register" className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-500 px-8 py-3 text-sm font-semibold text-white hover:bg-blue-600 transition-colors">
              Get Started Free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a href={APK_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-700 px-8 py-3 text-sm font-semibold text-slate-300 hover:bg-slate-800 transition-colors">
              <Download className="h-4 w-4" />
              Download Android App
            </a>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-800 px-4 py-8 text-center text-sm text-slate-500">
        AI Customer Support Agent — Built with Next.js, LangGraph & Prisma
      </footer>
    </div>
  );
}
