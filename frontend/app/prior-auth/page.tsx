"use client";

import { useState, useRef, useEffect } from "react";
import { ShieldCheck, FileText, UserCheck, AlertTriangle, CheckCircle2, XCircle, Clock, Stethoscope } from "lucide-react";

// Seeded tenant holding the SAMPLE MRI/biologic/referral criteria docs
// (backend/prisma/seed-prior-auth.ts). Old id 85a535c5-… had an empty KB.
const COMPANY_ID = "d92ae4ed-c4fc-4fdc-9aa6-8dbc49e54bdc";
const WS_URL = "wss://ai-customer-support-backend-ldbf.onrender.com/ws?company=" + COMPANY_ID;

const CASES = [
  {
    id: "mri",
    title: "MRI Lumbar Spine",
    tag: "Incomplete documentation",
    request:
      "Prior authorization request: MRI lumbar spine without contrast. Patient: 45-year-old with low back pain for 4 weeks. No red-flag symptoms documented. No prior conservative treatment on file. Ordering: family medicine.",
    prompt:
      "Evaluate this prior authorization request against the SAMPLE MRI lumbar spine criteria in the knowledge base. Patient: 45-year-old, low back pain 4 weeks, no red flags documented, no conservative treatment on file. Give: 1) recommendation (approve / needs more info / flag for human review), 2) the exact criteria points that apply, 3) what documentation is missing.",
  },
  {
    id: "biologic",
    title: "Biologic Therapy",
    tag: "Ready for review",
    request:
      "Prior authorization request: biologic therapy. Diagnosis confirmed by rheumatology with labs (elevated CRP/ESR, TB screen negative). Documented trial and failure of methotrexate (6 months) and sulfasalazine (4 months). Specialist notes attached.",
    prompt:
      "Evaluate this prior authorization request against the SAMPLE biologic therapy criteria in the knowledge base. Confirmed rheumatology diagnosis, elevated CRP/ESR, TB screen negative, failed methotrexate 6 months and sulfasalazine 4 months, specialist notes attached. Give: 1) recommendation, 2) the exact criteria points met, 3) anything still missing.",
  },
  {
    id: "referral",
    title: "Cardiology Referral",
    tag: "Missing urgency",
    request:
      "Referral: cardiology for intermittent chest discomfort. Referring provider included history but no urgency level and no recent ECG attached. Patient stable per notes.",
    prompt:
      "Evaluate this referral against the SAMPLE referral review criteria in the knowledge base. Cardiology referral for intermittent chest discomfort, history included, no urgency level stated, no recent ECG attached, patient stable. Give: 1) recommended routing and urgency, 2) the exact criteria points that apply, 3) what goes to the exception queue and why.",
  },
];

type AuditEntry = { time: string; text: string };

export default function PriorAuthDemo() {
  const [activeCase, setActiveCase] = useState(CASES[0]);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [decision, setDecision] = useState<string | null>(null);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const convRef = useRef<string | null>(null);

  const stamp = () => new Date().toLocaleTimeString();

  const log = (text: string) => setAudit((a) => [...a, { time: stamp(), text }]);

  const ensureWs = () =>
    new Promise<WebSocket>((resolve, reject) => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return resolve(wsRef.current);
      const ws = new WebSocket(WS_URL);
      ws.onopen = () => {
        wsRef.current = ws;
        resolve(ws);
      };
      ws.onerror = () => reject(new Error("connect failed"));
    });

  useEffect(() => {
    return () => wsRef.current?.close();
  }, []);

  async function runCheck() {
    setLoading(true);
    setAnswer("");
    setDecision(null);
    setStatus("");
    log(`Check started for case: ${activeCase.title}`);
    // Free-tier backend sleeps when idle: first hit often fails or crawls.
    // Retry with backoff instead of one silent 90s hang.
    const waits = [0, 5000, 15000];
    for (let attempt = 0; attempt < waits.length; attempt++) {
      if (attempt > 0) {
        setStatus(`Backend warming up — retry ${attempt} of ${waits.length - 1}…`);
        log(`Retry ${attempt}: waiting ${waits[attempt] / 1000}s for cold backend`);
        await new Promise((r) => setTimeout(r, waits[attempt]));
      } else {
        setStatus("Connecting to evaluation backend…");
      }
      try {
        const ws = await ensureWs();
        setStatus("Agent reading criteria documents…");
        const { content, cited } = await new Promise<{ content: string; cited: boolean }>((resolve, reject) => {
          const timer = setTimeout(() => reject(new Error("timeout")), 60000);
          ws.onmessage = (e) => {
            try {
              const d = JSON.parse(e.data);
              if (d.type === "connected" && d.conversationId) convRef.current = d.conversationId;
              if (d.type === "error") {
                clearTimeout(timer);
                reject(new Error("backend-error"));
              }
              if (d.type === "message") {
                clearTimeout(timer);
                resolve({ content: d.content, cited: !!d.cited });
              }
            } catch {
              /* ignore malformed frames */
            }
          };
          ws.send(JSON.stringify({ event: "chat", data: { message: activeCase.prompt, conversationId: convRef.current, companyId: COMPANY_ID } }));
        });
        setAnswer(content);
        // Honest audit: only claim a *cited* evaluation when the backend
        // flagged citations. A citation-less answer is a draft, not a decision.
        if (cited) log("Agent returned cited evaluation");
        else log("Agent answered without citations — treat as draft, not a decision");
        setStatus("");
        setLoading(false);
        return;
      } catch (err) {
        log(`Attempt ${attempt + 1} failed (${err instanceof Error ? err.message : "unknown"})`);
        try { wsRef.current?.close(); } catch { /* ignore */ }
        wsRef.current = null;
      }
    }
    setAnswer("The evaluation backend did not respond after 3 attempts (free-tier hosting sleeps when idle, or all LLM providers errored). The criteria documents and review flow below still show exactly how the walkthrough works — retry in a minute, or book a live call and I will run it with you.");
    log("Backend unavailable after 3 attempts — asked visitor to retry or book live run");
    setStatus("");
    setLoading(false);
  }

  function decide(kind: "approved" | "human-review" | "denied") {
    setDecision(kind);
    log(
      kind === "approved"
        ? `Reviewer decision: APPROVED ${activeCase.title} (demo action — in production this writes to the case record)`
        : kind === "human-review"
          ? `Reviewer decision: SENT TO HUMAN REVIEW ${activeCase.title} with full context (demo action)`
          : `Reviewer decision: DENIED ${activeCase.title} — requires reviewer sign-off in production (demo action)`
    );
  }

  return (
    <main className="min-h-screen bg-[#0B1120] text-slate-200">
      <div className="mx-auto max-w-6xl px-5 py-10">
        <div className="flex items-center gap-3">
          <Stethoscope className="h-7 w-7 text-blue-400" />
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Prior Authorization Walkthrough</h1>
        </div>
        <p className="mt-2 text-sm text-slate-400">
          Live evaluation build — no login needed. All clinical content on this page is{" "}
          <span className="font-semibold text-amber-300">SAMPLE data for evaluation only, not medical advice</span>. Answers come
          from the production RAG agent reading sample criteria documents.
        </p>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">1 · Pick a sample case</h2>
            <div className="mt-3 space-y-3">
              {CASES.map((c) => (
                <button
                  key={c.id}
                  onClick={() => { setActiveCase(c); setAnswer(""); setDecision(null); }}
                  className={`w-full rounded-xl border p-4 text-left transition ${activeCase.id === c.id ? "border-blue-500 bg-blue-500/10" : "border-slate-800 bg-slate-900 hover:border-slate-600"}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">{c.title}</span>
                    <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-[11px] text-slate-300">{c.tag}</span>
                  </div>
                  <p className="mt-2 text-[13px] leading-relaxed text-slate-400">{c.request}</p>
                </button>
              ))}
            </div>
            <button
              onClick={runCheck}
              disabled={loading}
              className="mt-4 w-full rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
            >
              {loading ? "Checking against criteria…" : "2 · Check against criteria"}
            </button>
            {status && <p className="mt-2 text-center text-[12px] text-slate-400">{status}</p>}
          </div>

          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Agent evaluation (cited)</h2>
            <div className="mt-3 min-h-[220px] rounded-xl border border-slate-800 bg-slate-900 p-4 text-[13px] leading-relaxed whitespace-pre-wrap">
              {answer || <span className="text-slate-500">Pick a case and run the check. The agent reads the sample criteria documents and cites the exact rules that apply.</span>}
            </div>

            {answer && (
              <div className="mt-4">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">3 · Reviewer decision (demo actions)</h2>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button onClick={() => decide("approved")} className="flex items-center gap-1.5 rounded-lg bg-green-600/20 border border-green-600/40 px-4 py-2 text-sm text-green-300 hover:bg-green-600/30">
                    <CheckCircle2 className="h-4 w-4" /> Approve
                  </button>
                  <button onClick={() => decide("human-review")} className="flex items-center gap-1.5 rounded-lg bg-amber-600/20 border border-amber-600/40 px-4 py-2 text-sm text-amber-300 hover:bg-amber-600/30">
                    <UserCheck className="h-4 w-4" /> Send to human review
                  </button>
                  <button onClick={() => decide("denied")} className="flex items-center gap-1.5 rounded-lg bg-red-600/20 border border-red-600/40 px-4 py-2 text-sm text-red-300 hover:bg-red-600/30">
                    <XCircle className="h-4 w-4" /> Deny (needs sign-off)
                  </button>
                </div>
              </div>
            )}

            <h2 className="mt-5 text-sm font-semibold uppercase tracking-wider text-slate-400">Audit trail</h2>
            <div className="mt-2 rounded-xl border border-slate-800 bg-slate-900 p-4 text-[12px]">
              {audit.length === 0 && <p className="text-slate-500">Every check and decision is logged with a timestamp — the same record production writes to the case file.</p>}
              {audit.map((a, i) => (
                <p key={i} className="py-1 text-slate-300"><span className="font-mono text-slate-500">{a.time}</span> — {a.text}</p>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <h2 className="flex items-center gap-2 font-semibold text-white"><ShieldCheck className="h-5 w-5 text-green-400" /> What this proves vs what is new</h2>
            <ul className="mt-3 space-y-2 text-[13px] text-slate-300">
              <li><span className="text-green-400 font-semibold">Working today:</span> RAG over criteria docs with citations, review queue with human escalation, exception handling, timestamped audit trail, embeddable chat.</li>
              <li><span className="text-amber-300 font-semibold">New for production:</span> your real criteria documents, EHR/payer integrations, BAA-covered hosting, role-based reviewer permissions, denial sign-off workflow.</li>
            </ul>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <h2 className="flex items-center gap-2 font-semibold text-white"><FileText className="h-5 w-5 text-blue-400" /> Hosting, security, commercial</h2>
            <ul className="mt-3 space-y-2 text-[13px] text-slate-300">
              <li><Clock className="mr-1 inline h-4 w-4" /> Hosting: Dockerized, region-flexible (Vercel/Render now; AWS/GCP under BAA for PHI).</li>
              <li><AlertTriangle className="mr-1 inline h-4 w-4" /> PHI: encryption in transit/at rest, audit logs, BAA with infra vendors, security responsibilities in writing.</li>
              <li>Commercial: fixed-scope pilot first, partnership structures flexible — talk to me: oufr29@gmail.com · calendly.com/oufr29/30min</li>
            </ul>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          Built by Djaouad Frih — djaouad.tech · Live systems: chat.djaouad.tech · customer.djaouad.tech · docs.djaouad.tech
        </p>
      </div>
    </main>
  );
}
