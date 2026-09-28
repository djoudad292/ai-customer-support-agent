'use client';

import { type ComponentType, useCallback, useEffect, useRef, useState } from 'react';
import { CalendarCheck, Headphones, PackageSearch, Ticket, UserCheck } from 'lucide-react';
import { API_BASE } from '../lib/api';

const DEMO_CHAT_SRC = `${API_BASE}/widget?company=demo`;

const POLL_MS = 2500;
const REQUEST_TIMEOUT_MS = 9000;
const MIN_SPLASH_MS = 700;
const IFRAME_FALLBACK_MS = 15000;
const CONTINUE_AFTER_MS = 45000;
const FADE_MS = 350;
const RELOAD_AFTER_MS = 10000;
const SPLASH_DISMISSED_KEY = 'supportai-try-splash-dismissed';

type ExecutedAction = {
  type: 'ticket' | 'appointment' | 'lead' | 'order' | 'escalate';
  ok: boolean;
  id?: string;
  detail: string;
};
type ActivityRow = { key: string; action: ExecutedAction };

const ACTION_TYPES = new Set<ExecutedAction['type']>(['ticket', 'appointment', 'lead', 'order', 'escalate']);

const ACTION_ICONS: Record<ExecutedAction['type'], ComponentType<{ className?: string }>> = {
  ticket: Ticket,
  appointment: CalendarCheck,
  lead: UserCheck,
  order: PackageSearch,
  escalate: Headphones,
};

const ACTION_LABELS: Record<ExecutedAction['type'], string> = {
  ticket: 'Opened support ticket',
  appointment: 'Booked appointment',
  lead: 'Saved contact',
  order: 'Checked order',
  escalate: 'Handed off to a human',
};

function isSplashDismissed(): boolean {
  try {
    return window.sessionStorage.getItem(SPLASH_DISMISSED_KEY) === '1';
  } catch {
    return false;
  }
}

function markSplashDismissed(): void {
  try {
    window.sessionStorage.setItem(SPLASH_DISMISSED_KEY, '1');
  } catch {
    // storage unavailable (e.g. private mode) — best effort only
  }
}

type Overlay = 'shown' | 'fading' | 'gone';

/**
 * The demo card plus the entry splash. The Render free instance sleeps between
 * pings, so a first-time visitor can hit a minute of dead iframe — this keeps
 * them on a branded screen until /health answers and the widget has loaded,
 * with an escape hatch so nobody is ever trapped behind the splash.
 */
export function DemoChatSlot({ starter }: { starter?: string }) {
  const [overlay, setOverlay] = useState<Overlay>(
    isSplashDismissed() ? 'gone' : 'shown',
  );
  const [serverUp, setServerUp] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [activity, setActivity] = useState<ActivityRow[]>([]);

  const startedAtRef = useRef(0);
  const dismissedRef = useRef(false);
  const timeoutIdsRef = useRef<number[]>([]);
  const reloadTimerRef = useRef<number | null>(null);

  const later = useCallback((fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms);
    timeoutIdsRef.current.push(id);
  }, []);

  const clearReloadTimer = useCallback(() => {
    if (reloadTimerRef.current !== null) {
      window.clearTimeout(reloadTimerRef.current);
      reloadTimerRef.current = null;
    }
  }, []);

  // Auto dismissal: probe success, iframe load, fallback timer. No persistence.
  const dismiss = useCallback(() => {
    if (dismissedRef.current) return;
    dismissedRef.current = true;
    clearReloadTimer();
    const wait = Math.max(0, MIN_SPLASH_MS - (Date.now() - startedAtRef.current));
    later(() => {
      setOverlay('fading');
      later(() => setOverlay('gone'), FADE_MS);
    }, wait);
  }, [later, clearReloadTimer]);

  // User dismissal: Esc or "Open the page". Persists across the reload loop.
  const dismissUser = useCallback(() => {
    markSplashDismissed();
    dismiss();
  }, [dismiss]);

  // Start the clock and poll the backend until it answers (CORS is open: *).
  useEffect(() => {
    startedAtRef.current = Date.now();
    let cancelled = false;
    let retryId = 0;
    let inflight: AbortController | null = null;

    // If the visitor hasn't dismissed the splash, give the backend 10s to
    // respond before reloading — the fresh load restarts the cycle, stopping
    // only when /health answers or the user dismisses. The dismissedRef guard
    // also prevents rescheduling during the fade-out (overlay transitions).
    if (overlay !== 'gone' && !dismissedRef.current) {
      reloadTimerRef.current = window.setTimeout(() => {
        window.location.reload();
      }, RELOAD_AFTER_MS);
    }

    const probe = async () => {
      inflight?.abort();
      const ctrl = new AbortController();
      inflight = ctrl;
      const hardStop = window.setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);
      try {
        const res = await fetch(`${API_BASE}/health`, {
          signal: ctrl.signal,
          cache: 'no-store',
        });
        if (res.ok) {
          const data = (await res.json().catch(() => null)) as { status?: string } | null;
          if (data && (data.status === 'ok' || data.status === 'degraded')) {
            window.clearTimeout(hardStop);
            clearReloadTimer();
            if (!cancelled) setServerUp(true);
            return;
          }
        }
      } catch {
        // asleep or unreachable — poll again
      }
      window.clearTimeout(hardStop);
      if (!cancelled) retryId = window.setTimeout(probe, POLL_MS);
    };
    void probe();

    return () => {
      cancelled = true;
      window.clearTimeout(retryId);
      clearReloadTimer();
      inflight?.abort();
    };
  }, [overlay, clearReloadTimer]);

  // Elapsed clock for the status copy; stops once the splash is gone.
  useEffect(() => {
    if (overlay === 'gone') return;
    const iv = window.setInterval(
      () => setElapsedMs(Date.now() - startedAtRef.current),
      500,
    );
    return () => window.clearInterval(iv);
  }, [overlay]);

  // Never trap the visitor if the widget loads without firing onLoad.
  useEffect(() => {
    if (!serverUp || overlay === 'gone') return;
    const id = window.setTimeout(dismiss, IFRAME_FALLBACK_MS);
    return () => window.clearTimeout(id);
  }, [serverUp, overlay, dismiss]);

  // Esc leaves the splash (user-initiated: persists across the reload loop).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismissUser();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dismissUser]);

  // Clear pending fades if the page unloads mid-transition.
  useEffect(
    () => () => {
      timeoutIdsRef.current.forEach((id) => window.clearTimeout(id));
    },
    [],
  );

  // Listen for live LangGraph side-effects posted from the widget iframe.
  useEffect(() => {
    const targetOrigin = new URL(API_BASE).origin;
    const handler = (e: MessageEvent) => {
      if (e.origin !== targetOrigin) return;
      const d = e.data as unknown;
      if (
        !d ||
        typeof d !== 'object' ||
        (d as { source?: unknown }).source !== 'supportai-widget' ||
        (d as { kind?: unknown }).kind !== 'agent-executed' ||
        !Array.isArray((d as { executed?: unknown }).executed)
      )
        return;
      const raw = (d as { executed: unknown[] }).executed;
      const newRows: ActivityRow[] = [];
      raw.forEach((entry, index) => {
        if (!entry || typeof entry !== 'object') return;
        const t = (entry as { type?: unknown }).type;
        if (typeof t !== 'string' || !ACTION_TYPES.has(t as ExecutedAction['type'])) return;
        const ok = (entry as { ok?: unknown }).ok === true;
        if (typeof (entry as { detail?: unknown }).detail !== 'string') return;
        const id =
          typeof (entry as { id?: unknown }).id === 'string'
            ? (entry as { id: string }).id
            : undefined;
        newRows.push({
          key: `${e.timeStamp}-${index}-${Date.now()}`,
          action: {
            type: t as ExecutedAction['type'],
            ok,
            id,
            detail: (entry as { detail: string }).detail,
          },
        });
      });
      if (newRows.length > 0) {
        setActivity((prev) => [...prev, ...newRows].slice(-12));
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  const sec = Math.floor(elapsedMs / 1000);
  const statusText =
    sec < 15
      ? 'Waking the live demo server…'
      : sec < 45
        ? 'Free servers sleep after quiet periods — the first wake usually takes under a minute.'
        : 'Still starting. Open the page and the chat will appear here the moment it connects.';
  const showContinue = sec >= CONTINUE_AFTER_MS / 1000 && overlay === 'shown';

  return (
    <>
      <div className="lg:grid lg:grid-cols-[1fr_260px] lg:items-start lg:gap-8">
        <div className="overflow-hidden border border-[var(--pub-line-strong)] bg-[#0b0f14]">
          <div className="flex items-center justify-between border-b border-[#1b222c] px-3 py-2 text-[11px] text-[#8a97a6]">
            <span>Live agent &middot; demo workspace</span>
            <span>no login</span>
          </div>
          {serverUp ? (
            <iframe
              key={starter || "default"}
              src={
                starter
                  ? `${DEMO_CHAT_SRC}&starter=${encodeURIComponent(starter)}`
                  : DEMO_CHAT_SRC
              }
              title="Live AI customer support agent demo"
              className="block h-[520px] w-full border-0"
              onLoad={() => dismiss()}
            />
          ) : (
            <div
              className="flex h-[520px] flex-col items-center justify-center gap-3 px-8 text-center"
              role="status"
            >
              <span
                className="h-5 w-5 animate-spin rounded-full border-2 border-[#2a333f] border-t-[#4c9a83]"
                aria-hidden="true"
              />
              <p className="text-[13px] text-[#c9d1db]">The live demo server is waking up…</p>
              <p className="max-w-[16rem] text-[11px] leading-relaxed text-[#8a97a6]">
                The chat drops into this window the moment it connects — no account
                either way.
              </p>
            </div>
          )}
        </div>

        <aside className="lg:sticky lg:top-24 self-start">
          <div className="overflow-hidden border border-[var(--pub-line-strong)] bg-[#0b0f14]">
            <div className="px-3 py-2">
              <div className="flex items-baseline justify-between gap-2">
                <div>
                  <span className="text-[11px] uppercase tracking-wide text-[#8a97a6]">
                    What the agent did
                  </span>
                  <span className="ml-2 text-[11px] text-[#5d6875]">Live · this session</span>
                </div>
                
              </div>
              {activity.length === 0 ? (
                <p className="mt-1 text-[11px] text-[#5d6875]">
                  As the agent works — opening tickets, booking, saving contacts —
                  each step will be explained here.
                </p>
              ) : (
                <ul
                  className="mt-1.5 flex flex-col gap-1"
                  role="log"
                  aria-live="polite"
                  aria-label="What the agent did"
                >
                  {activity.map((row) => {
                    const Icon = ACTION_ICONS[row.action.type];
                    const prefix = row.action.ok ? '✓ ' : '✗ ';
                    const idPart = row.action.id ? ` ${row.action.id}` : '';
                    return (
                      <li
                        key={row.key}
                        className="flex items-start gap-2 text-[11px] leading-snug"
                      >
                        <Icon
                          className={`mt-px h-3 w-3 shrink-0 ${row.action.ok ? 'text-[#4c9a83]' : 'text-[#c96b6b]'}`}
                          aria-hidden="true"
                        />
                        <span
                          className={row.action.ok ? 'text-[#b9c7c1]' : 'text-[#d8a7ab]'}
                        >
                          {prefix}
                          {ACTION_LABELS[row.action.type]}
                          {idPart}
                          {' · '}
                          {row.action.detail}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </aside>
      </div>

      {overlay !== 'gone' && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center px-6 transition-opacity duration-300 ${
            overlay === 'fading' ? 'opacity-0' : 'opacity-100'
          }`}
          style={{ backgroundColor: 'var(--pub-bg)' }}
          role="status"
          aria-live="polite"
        >
          <div className="w-full max-w-[20rem] text-center">
            <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-[var(--pub-ink-3)]">
              SupportAI
            </div>
            <div className="mt-2 text-[15px] font-medium text-[var(--pub-ink)]">
              AI customer support &middot; live demo
            </div>
            <div className="mt-8 flex justify-center">
              <span
                className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--pub-line-strong)] border-t-[var(--pub-accent)]"
                aria-hidden="true"
              />
            </div>
            <p className="mt-6 text-[13px] leading-relaxed text-[var(--pub-ink-2)]">
              {statusText}
            </p>
            <p
              className="mt-1.5 text-[11px] tabular-nums text-[var(--pub-ink-3)]"
              aria-hidden="true"
            >
              {sec}s
            </p>
            {showContinue && (
              <button
                type="button"
                onClick={dismissUser}
                className="mt-6 rounded-md border border-[var(--pub-line-strong)] px-4 py-2 text-[13px] font-medium text-[var(--pub-ink)] hover:bg-[var(--pub-panel)]"
              >
                Open the page
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
