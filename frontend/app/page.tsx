import Link from "next/link";
import { API_BASE } from "../lib/api";

const PORTFOLIO_URL = "https://djaouad.is-a.dev";
const APK_URL =
  "https://github.com/djoudad292/ai-customer-support-agent/releases/download/latest-apk/ai-customer-support.apk";

const capabilities: [string, string][] = [
  [
    "Answers from your own documents",
    "Upload FAQs, policies and product docs. Retrieval picks the passage that actually answers the question instead of guessing.",
  ],
  [
    "Opens and tracks tickets",
    "When a problem needs a record, the agent files the ticket itself and tells the customer what happens next.",
  ],
  [
    "Checks orders without a login",
    "Customers ask about an order number in plain language and get the status, the carrier and the estimated delivery.",
  ],
  [
    "Hands off to a human",
    "When a reply needs judgement or a promise the bot cannot make, the conversation moves to a person with the full context attached.",
  ],
  [
    "Captures leads and books appointments",
    "Contact details are pulled out of the conversation, and meetings are booked by typing a date instead of a form.",
  ],
  [
    "Dashboard for the business",
    "Conversations, tickets, orders, leads and AI-versus-human handling in one place, on desktop and on the phone app.",
  ],
];

const steps: [string, string][] = [
  ["Load your knowledge", "Point it at your FAQ, policies and product docs. Nothing to fine-tune."],
  ["Tune the rules", "Set what the agent may do on its own — refund, cancel, escalate — and what it must hand over."],
  ["Put it on your site", "One script tag on any page, or link to the hosted chat. The Android app covers the on-call case."],
  ["Watch it work", "Every conversation, ticket and lead lands in the dashboard with the full transcript."],
];

export default function Home() {
  return (
    <div className="pub min-h-screen">
      {/* Credit + conversion line — kept to a single quiet row. */}
      <div className="border-b border-[var(--pub-line)] bg-[var(--pub-panel)]">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-1.5 text-[11px] leading-5 text-[var(--pub-ink-3)] sm:px-6">
          <span>Built by Djaouad Frih</span>
          <a
            href={PORTFOLIO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-[var(--pub-accent)] underline decoration-[var(--pub-line-strong)] underline-offset-2 hover:decoration-[var(--pub-accent)]"
          >
            Want this for your business? &rarr; djaouad.is-a.dev
          </a>
        </div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-[var(--pub-line)] bg-[var(--pub-bg)]">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-baseline gap-2.5">
            <span className="text-[15px] font-semibold tracking-tight text-[var(--pub-ink)]">
              SupportAI
            </span>
            <span className="hidden text-[11px] text-[var(--pub-ink-3)] sm:inline">
              AI customer support
            </span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-3">
            <Link
              href="/try"
              className="px-2 py-2 text-[13px] text-[var(--pub-ink-2)] hover:text-[var(--pub-ink)]"
            >
              Try it
            </Link>
            <a
              href="#embed"
              className="hidden px-2 py-2 text-[13px] text-[var(--pub-ink-2)] hover:text-[var(--pub-ink)] sm:inline"
            >
              Embed it
            </a>
            <Link
              href="/login"
              className="rounded-md px-2 py-2 text-[13px] text-[var(--pub-ink-2)] hover:text-[var(--pub-ink)]"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="rounded-md border border-[var(--pub-line-strong)] px-3 py-2 text-[13px] font-medium text-[var(--pub-ink)] hover:bg-[var(--pub-panel)]"
            >
              Create account
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="border-b border-[var(--pub-line)]">
          <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--pub-accent)]">
              Live demo &middot; no account needed
            </p>
            <h1 className="mt-3 text-[28px] font-semibold leading-[1.15] tracking-tight text-[var(--pub-ink)] sm:text-[40px]">
              Customer support that answers, files the ticket, and calls a human when it can&rsquo;s.
            </h1>
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-[var(--pub-ink-2)]">
              SupportAI runs the help desk. It answers from your documents, opens
              tickets, checks orders, captures leads, and hands the conversation to
              a person when the answer needs judgement. The chat is the real agent,
              running live — try it now.
            </p>

            <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:items-center">
              <Link
                href="/try"
                className="inline-flex items-center justify-center rounded-md bg-[var(--pub-ink)] px-4 py-2.5 text-[14px] font-medium text-[var(--pub-panel)] hover:bg-[#2e2c28]"
              >
                Try it now — no signup
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-md border border-[var(--pub-line-strong)] px-4 py-2.5 text-[14px] font-medium text-[var(--pub-ink)] hover:bg-[var(--pub-panel)]"
              >
                Create a free account
              </Link>
            </div>

            <p className="mt-4 max-w-lg text-[12px] leading-relaxed text-[var(--pub-ink-3)]">
              Try the live demo first — it needs no account. Guest chats run in a shared
              demo workspace with a fresh thread each, so nothing is attached to an
              account and nobody else can read your messages.
            </p>
          </div>
        </section>

        {/* What it does */}
        <section className="border-b border-[var(--pub-line)]">
          <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
            <h2 className="text-[20px] font-semibold tracking-tight text-[var(--pub-ink)] sm:text-[24px]">
              What it actually does
            </h2>
            <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-[var(--pub-ink-2)]">
              The same agent a customer talks to is the one the support team reviews.
              No separate inbox, no handover notes to write.
            </p>
            <div className="mt-8 grid gap-x-10 gap-y-6 sm:grid-cols-2">
              {capabilities.map(([title, desc]) => (
                <div key={title} className="border-t border-[var(--pub-line)] pt-3">
                  <h3 className="text-[14px] font-semibold text-[var(--pub-ink)]">{title}</h3>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--pub-ink-2)]">
                    {desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="scroll-mt-16 border-b border-[var(--pub-line)]">
          <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
            <h2 className="text-[20px] font-semibold tracking-tight text-[var(--pub-ink)] sm:text-[24px]">
              Running it on your own support desk
            </h2>
            <ol className="mt-8 space-y-5">
              {steps.map(([title, desc], i) => (
                <li key={title} className="flex gap-4 border-t border-[var(--pub-line)] pt-4">
                  <span className="w-6 shrink-0 pt-0.5 font-mono text-[12px] text-[var(--pub-ink-3)]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="text-[14px] font-semibold text-[var(--pub-ink)]">{title}</h3>
                    <p className="mt-1 text-[13px] leading-relaxed text-[var(--pub-ink-2)]">
                      {desc}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Embed */}
        <section id="embed" className="scroll-mt-16 border-b border-[var(--pub-line)]">
          <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
            <h2 className="text-[20px] font-semibold tracking-tight text-[var(--pub-ink)] sm:text-[24px]">
              One line on your own site
            </h2>
            <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-[var(--pub-ink-2)]">
              This chat is the widget. The same one runs on any page you paste this
              into, scoped to your company and your knowledge base.
            </p>
            <pre className="mt-5 overflow-x-auto border border-[var(--pub-line-strong)] bg-[var(--pub-panel)] px-4 py-3 text-[12px] leading-relaxed text-[var(--pub-ink-2)]">
              <code>{`<script src="${API_BASE}/widget.js" data-company="YOUR_COMPANY_ID"><\/script>`}</code>
            </pre>
            <p className="mt-3 text-[12px] text-[var(--pub-ink-3)]">
              On the move? There is an Android build for the on-call case:{" "}
              <a
                href={APK_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-[var(--pub-accent)] underline decoration-[var(--pub-line-strong)] underline-offset-2 hover:decoration-[var(--pub-accent)]"
              >
                download the APK
              </a>{" "}
              (15 MB, Android 8+, free).
            </p>
          </div>
        </section>

        {/* Close */}
        <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
          <div className="border-t border-[var(--pub-line-strong)] pt-8">
            <h2 className="max-w-xl text-[20px] font-semibold tracking-tight text-[var(--pub-ink)] sm:text-[24px]">
              Trying to put something like this in front of your customers?
            </h2>
            <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-[var(--pub-ink-2)]">
              Send the details of your inbox and I&rsquo;ll tell you what it would take
              to get a working agent in front of it — and what it would not be worth
              doing yet.
            </p>
            <div className="mt-5 flex flex-col gap-2.5 sm:flex-row sm:items-center">
              <Link
                href="/try"
                className="inline-flex items-center justify-center rounded-md bg-[var(--pub-ink)] px-4 py-2.5 text-[14px] font-medium text-[var(--pub-panel)] hover:bg-[#2e2c28]"
              >
                Try it now — no signup
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-md border border-[var(--pub-line-strong)] px-4 py-2.5 text-[14px] font-medium text-[var(--pub-ink)] hover:bg-[var(--pub-panel)]"
              >
                Create an account instead
              </Link>
              <a
                href={PORTFOLIO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-[var(--pub-accent)] underline decoration-[var(--pub-line-strong)] underline-offset-2 hover:decoration-[var(--pub-accent)]"
              >
                djaouad.is-a.dev
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--pub-line)]">
        <div className="mx-auto flex max-w-5xl flex-col gap-1 px-4 py-6 text-[11px] leading-5 text-[var(--pub-ink-3)] sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span>SupportAI &middot; Next.js, NestJS, Postgres + pgvector, LangGraph</span>
          <span>
            Built by{" "}
            <a
              href={PORTFOLIO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--pub-ink-2)] underline decoration-[var(--pub-line-strong)] underline-offset-2 hover:text-[var(--pub-ink)]"
            >
              Djaouad Frih
            </a>{" "}
            &middot; djaouad.is-a.dev
          </span>
        </div>
      </footer>
    </div>
  );
}
