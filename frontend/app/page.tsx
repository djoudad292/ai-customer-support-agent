"use client";
import Link from "next/link";

const features = [
  { icon: "🤖", title: "AI Chat 24/7", desc: "Answers customer questions instantly using your knowledge base, powered by LangGraph." },
  { icon: "📋", title: "Lead Capture", desc: "Automatically captures visitor contact details and saves them as leads in your pipeline." },
  { icon: "📅", title: "Appointment Booking", desc: "Books meetings and appointments directly in chat with dates parsed automatically." },
  { icon: "📚", title: "Knowledge Base", desc: "Upload your docs, FAQs, and policies. The AI studies them to answer accurately." },
  { icon: "🔀", title: "Department Routing", desc: "Classifies conversations and routes them to sales, support, billing, or custom departments." },
  { icon: "📊", title: "Analytics", desc: "Track conversations, AI vs human handling, leads captured, and appointments booked." },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0a0f1a] text-slate-50">
      <header className="fixed top-0 z-50 w-full border-b border-slate-800 bg-[#0a0f1a]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500">
              <span className="text-sm">💬</span>
            </div>
            <span className="text-lg font-semibold">AI Support Agent</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm text-slate-400 hover:text-slate-200 transition-colors">Sign In</Link>
            <Link href="/register" className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 transition-colors">Get Started</Link>
          </div>
        </div>
      </header>

      <main>
        <section className="pt-32 pb-20 px-6">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
              AI Customer Support Agent
              <span className="block mt-2 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Answers, Captures & Books
              </span>
            </h1>
            <p className="mt-6 text-lg text-slate-400 max-w-2xl mx-auto">
              An AI agent that answers customer questions from your knowledge base, captures leads, books appointments, and routes conversations — 24/7.
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Powered by <span className="font-medium text-blue-400">LangGraph</span> · <span className="font-medium text-blue-400">Google Gemini</span> · <span className="font-medium text-blue-400">Prisma</span>
            </p>
            <p className="mt-1 text-xs text-slate-500">Built by <a href="https://djaouad.tech" target="_blank" className="font-bold text-blue-400 hover:underline">djaouad frih</a></p>
            <div className="mt-10 flex justify-center gap-4">
              <Link href="/register" className="rounded-xl bg-blue-500 px-8 py-3 text-sm font-semibold text-white hover:bg-blue-600 transition-colors">
                Get Started Free
              </Link>
              <a href="#features" className="rounded-xl border border-slate-700 px-8 py-3 text-sm font-semibold text-slate-300 hover:bg-slate-800 transition-colors">
                Learn More
              </a>
            </div>
          </div>
        </section>

        <section id="features" className="py-20 px-6">
          <div className="mx-auto max-w-7xl">
            <h2 className="text-center text-3xl font-bold">Everything a support agent does, automated</h2>
            <p className="text-center text-slate-400 mt-4 max-w-xl mx-auto">Answer questions, qualify visitors, book meetings and route to the right team.</p>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((f, i) => (
                <div key={i} className="rounded-xl border border-slate-800 bg-[#111827] p-6 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/5 transition-all">
                  <div className="mb-4 text-2xl">{f.icon}</div>
                  <h3 className="text-lg font-semibold">{f.title}</h3>
                  <p className="mt-2 text-sm text-slate-400">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 px-6">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-center text-3xl font-bold">How it works</h2>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {[
                { num: "1", title: "Add your knowledge", desc: "Upload your FAQ, prices, policies or product docs." },
                { num: "2", title: "Embed the widget", desc: "Copy one line of code and paste it into your website." },
                { num: "3", title: "Let the AI work", desc: "It answers, captures, books and routes. You check the inbox." },
              ].map((s, i) => (
                <div key={i} className="rounded-xl border border-slate-800 bg-[#111827] p-6">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 text-lg font-bold">{s.num}</div>
                  <h3 className="text-lg font-semibold">{s.title}</h3>
                  <p className="mt-2 text-sm text-slate-400">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 px-6">
          <div className="mx-auto max-w-2xl rounded-2xl border border-slate-800 bg-[#111827] p-8 text-center">
            <h2 className="text-2xl font-bold">Ready to try it?</h2>
            <p className="mt-3 text-sm text-slate-400">Create a free account, add your knowledge base, and test the live agent in minutes.</p>
            <div className="mt-6 flex justify-center gap-4">
              <Link href="/register" className="rounded-xl bg-blue-500 px-8 py-3 text-sm font-semibold text-white hover:bg-blue-600 transition-colors">Get Started Free</Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-800 py-8 px-6 text-center text-sm text-slate-500">
        © 2026 AI Customer Support Agent — Built by <a href="https://djaouad.tech" target="_blank" className="font-semibold text-blue-400 hover:underline">djaouad frih</a>
      </footer>
    </div>
  );
}
