"use client";
import Link from "next/link";
import { Bot, Ticket, Package, MessageSquare, ClipboardList, CalendarDays, BookOpen, BarChart3, Plug, Download, Smartphone, ArrowRight, Zap, Shield, Globe } from "lucide-react";
import { Button, Card, Badge, Logo } from "@supportai/ui/web";

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
  { icon: Plug, title: "One-Line Widget", desc: "Add the AI chat to any website with a single script tag. Embeddable and customizable." },
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

function PhoneMockup() {
  return (
    <div className="relative rounded-[2rem] border-[3px] sm:border-4 border-border-strong bg-surface p-1.5 sm:p-2 shadow-2xl shadow-primary/10">
      <div className="mx-auto mb-2 sm:mb-3 h-4 sm:h-5 w-16 sm:w-24 rounded-full bg-surface-alt" />
      <div className="overflow-hidden rounded-[1.5rem] sm:rounded-[2rem] bg-bg">
        {/* Status Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-1.5 sm:py-2 text-[8px] sm:text-[10px] text-muted">
          <span>9:41</span>
          <div className="h-2.5 w-4 rounded-sm border border-border-strong">
            <div className="h-full w-3/4 rounded-sm bg-success" />
          </div>
        </div>

        {/* Chat Content */}
        <div className="px-2.5 sm:px-3 pb-3 sm:pb-4 space-y-2 sm:space-y-3">
          {/* Bot Header */}
          <div className="flex items-center gap-2 px-2 py-1.5 sm:py-2 border-b border-border">
            <div className="h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-primary-soft flex items-center justify-center">
              <Bot className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-primary" />
            </div>
            <div>
              <p className="text-[10px] sm:text-[11px] font-semibold text-fg">SupportAI</p>
              <p className="text-[7px] sm:text-[9px] text-success">Online</p>
            </div>
          </div>

          {/* Bot Greeting */}
          <div className="flex gap-1.5">
            <div className="h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-primary-soft flex items-center justify-center shrink-0 mt-0.5">
              <Bot className="h-2 w-2 sm:h-2.5 sm:w-2.5 text-primary" />
            </div>
            <div className="rounded-xl rounded-bl-md bg-surface border border-border px-2.5 sm:px-3 py-1.5 sm:py-2 text-[8px] sm:text-[10px] text-fg-secondary leading-relaxed max-w-[80%]">
              Hello! I can help you with tickets, orders, and more. What would you like to do?
            </div>
          </div>

          {/* Quick Reply Buttons */}
          <div className="flex flex-wrap gap-1 ml-5 sm:ml-6">
            {["Create Ticket", "Track Order", "Book Meeting"].map((b) => (
              <span key={b} className="rounded-full bg-primary-soft border border-primary/30 px-1.5 sm:px-2.5 py-0.5 sm:py-1 text-[7px] sm:text-[9px] font-medium text-primary">
                {b}
              </span>
            ))}
          </div>

          {/* User Message */}
          <div className="flex justify-end">
            <div className="rounded-xl rounded-br-md bg-primary-strong px-2.5 sm:px-3 py-1.5 sm:py-2 text-[8px] sm:text-[10px] text-primary-fg max-w-[75%]">
              I want to check my order #1234
            </div>
          </div>

          {/* Bot Response */}
          <div className="flex gap-1.5">
            <div className="h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-primary-soft flex items-center justify-center shrink-0 mt-0.5">
              <Bot className="h-2 w-2 sm:h-2.5 sm:w-2.5 text-primary" />
            </div>
            <div className="rounded-xl rounded-bl-md bg-surface border border-border px-2.5 sm:px-3 py-1.5 sm:py-2 text-[8px] sm:text-[10px] text-fg-secondary leading-relaxed max-w-[80%]">
              Found your order! It is currently in transit with tracking #TRK-5678.
            </div>
          </div>

          {/* Trace Chips */}
          <div className="flex flex-wrap gap-0.5 sm:gap-1 ml-5 sm:ml-6">
            {["understand", "decideAction", "lookupOrder", "respond"].map((n, i) => (
              <span key={n} className={`rounded-full px-1 sm:px-1.5 py-0.5 text-[6px] sm:text-[7px] font-medium text-white ${
                ["bg-primary-strong", "bg-warning", "bg-violet", "bg-success"][i]
              }`}>
                {n}
              </span>
            ))}
          </div>

          {/* Confirmation Buttons */}
          <div className="flex flex-wrap gap-1 ml-5 sm:ml-6">
            {["Track Package", "Request Return"].map((b) => (
              <span key={b} className="rounded-lg bg-primary-strong px-1.5 sm:px-2 py-0.5 sm:py-1 text-[7px] sm:text-[9px] font-semibold text-primary-fg">
                {b}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-bg text-fg">
      {/* Header */}
      <header className="fixed top-0 z-50 w-full border-b border-border bg-bg/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-3 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center gap-2">
            <Logo size={32} />
            <span className="text-base sm:text-lg font-bold tracking-tight">SupportAI</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <a href={APK_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-lg border border-success/30 bg-success-soft px-2.5 sm:px-3 py-1.5 text-[10px] sm:text-xs font-medium text-success hover:bg-success-soft transition-colors">
              <Download className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span className="hidden sm:inline">Android App</span>
              <span className="sm:hidden">APK</span>
            </a>
            <Link href="/login" className="text-xs sm:text-sm text-muted hover:text-fg transition-colors">Login</Link>
            <Button size="sm">
              <Link href="/register">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative px-3 pt-20 pb-10 sm:px-6 sm:pt-28 sm:pb-16 lg:pt-32 lg:pb-20 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl">
          {/* Mobile: Text first, Phone below */}
          <div className="flex flex-col items-center gap-8 lg:grid lg:grid-cols-2 lg:gap-12 lg:items-center">
            {/* Text */}
            <div className="text-center lg:text-left">
              <Badge tone="primary" className="mb-3 sm:mb-4 inline-flex items-center gap-1">
                <Zap className="h-3 w-3" />
                LangGraph Powered AI Agent
              </Badge>
              <h1 className="mb-3 sm:mb-4 text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight">
                AI Customer Support
                <span className="block text-primary">That Actually Works</span>
              </h1>
              <p className="mb-5 sm:mb-6 mx-auto lg:mx-0 max-w-lg text-sm sm:text-base lg:text-lg text-muted">
                Deploy an intelligent AI agent that handles tickets, captures leads, books appointments, and resolves customer issues — 24/7.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <Button size="lg" className="w-full sm:w-auto">
                  <Link href="/register" className="flex items-center justify-center gap-2 w-full">
                    Start Free — No Credit Card
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  <Link href="/login" className="w-full text-center">View Dashboard</Link>
                </Button>
              </div>
            </div>

            {/* Phone Mockup */}
            <div className="relative w-full max-w-[260px] sm:max-w-xs lg:max-w-sm mx-auto lg:mx-0 lg:justify-self-end">
              <PhoneMockup />

              {/* Floating Download Card */}
              <a href={APK_URL} target="_blank" rel="noopener noreferrer" className="mt-4 sm:mt-6 sm:absolute sm:-bottom-5 sm:left-1/2 sm:-translate-x-1/2 sm:mt-0 flex items-center gap-2.5 sm:gap-3 rounded-2xl border border-border-strong bg-surface p-3 sm:p-4 shadow-xl hover:border-success/30 transition-all group w-full sm:w-auto">
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-success shadow-lg shadow-success/20 shrink-0">
                  <Download className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-semibold text-fg group-hover:text-success transition-colors">Download for Android</p>
                  <p className="text-[10px] sm:text-[11px] text-muted">Free &middot; 15 MB &middot; Android 8.0+</p>
                </div>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile App Section */}
      <section className="px-3 py-12 sm:px-6 sm:py-16 lg:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 sm:mb-12 text-center">
            <Badge tone="success" className="mb-2 sm:mb-3 inline-flex items-center gap-1">
              <Smartphone className="h-3 w-3" />
              Native Android App
            </Badge>
            <h2 className="mb-2 sm:mb-3 text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">Manage Support from Your Phone</h2>
            <p className="mx-auto max-w-lg text-xs sm:text-sm lg:text-base text-muted">
              The same powerful AI agent, now in your pocket. Monitor conversations, respond to tickets, and track performance on the go.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
            {mobileFeatures.map((f) => (
              <Card key={f.title} className="p-4 sm:p-5 hover:border-border-strong hover:bg-surface-alt transition-colors">
                <div className="mb-2 sm:mb-3 flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-success-soft">
                  <f.icon className="h-4 w-4 sm:h-5 sm:w-5 text-success" />
                </div>
                <h3 className="mb-1 sm:mb-2 text-sm sm:text-base font-semibold text-fg">{f.title}</h3>
                <p className="text-xs sm:text-sm leading-relaxed text-muted">{f.desc}</p>
              </Card>
            ))}
          </div>

          <div className="mt-6 sm:mt-8 text-center">
            <Button size="lg" className="w-full sm:w-auto shadow-lg shadow-success/20 hover:shadow-success/30 bg-success border-0 text-white">
              <a href={APK_URL} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full">
                <Download className="h-4 w-4" />
                Download the Android App
              </a>
            </Button>
            <p className="mt-2 sm:mt-3 text-[10px] sm:text-xs text-muted">Free forever &middot; Auto-updates via GitHub &middot; 15 MB</p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-3 py-12 sm:px-6 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-3 sm:mb-4 text-center text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">Everything You Need</h2>
          <p className="mb-8 sm:mb-12 text-center text-xs sm:text-sm lg:text-base text-muted">Production-grade features that companies pay $5,000-$15,000 for.</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
            {features.map((f) => (
              <Card key={f.title} className="p-4 sm:p-6 hover:border-border-strong hover:bg-surface-alt transition-colors">
                <f.icon className="mb-2 sm:mb-3 h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                <h3 className="mb-1 sm:mb-2 text-sm sm:text-base font-semibold text-fg">{f.title}</h3>
                <p className="text-xs sm:text-sm leading-relaxed text-muted">{f.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="px-3 py-12 sm:px-6 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-8 sm:mb-12 text-center text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">Up and Running in Minutes</h2>
          <div className="space-y-3 sm:space-y-4">
            {steps.map((s) => (
              <Card key={s.num} className="flex items-start gap-3 sm:gap-4 p-4 sm:p-5 lg:p-6">
                <div className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full bg-primary-strong text-xs sm:text-sm font-bold text-white">{s.num}</div>
                <div>
                  <h3 className="text-sm sm:text-base font-semibold text-fg">{s.title}</h3>
                  <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-muted">{s.desc}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-3 py-12 sm:px-6 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-2xl rounded-2xl border border-border-strong bg-surface p-6 sm:p-8 lg:p-12 text-center shadow-lg shadow-primary/5">
          <h2 className="mb-3 sm:mb-4 text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-fg">Ready to Automate Support?</h2>
          <p className="mb-6 sm:mb-8 text-xs sm:text-sm lg:text-base text-muted">Deploy your AI agent in minutes. Under $10/month to run.</p>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button size="lg" className="w-full sm:w-auto">
              <Link href="/register" className="flex items-center justify-center gap-2 w-full">
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              <a href={APK_URL} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full text-fg">
                <Download className="h-4 w-4" />
                Download Android App
              </a>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border px-3 py-6 sm:px-6 sm:py-8 text-center text-xs sm:text-sm text-muted">
        AI Customer Support Agent — Built with Next.js, LangGraph &amp; Prisma
      </footer>
    </div>
  );
}
