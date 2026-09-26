'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { API_BASE } from '../lib/api';

const DEMO_CHAT_SRC = `${API_BASE}/widget?company=demo`;

const POLL_MS = 2500;
const REQUEST_TIMEOUT_MS = 9000;
const MIN_SPLASH_MS = 700;
const IFRAME_FALLBACK_MS = 15000;
const CONTINUE_AFTER_MS = 45000;
const FADE_MS = 350;

type Overlay = 'shown' | 'fading' | 'gone';

/**
 * The demo card plus the entry splash. The Render free instance sleeps between
 * pings, so a first-time visitor can hit a minute of dead iframe — this keeps
 * them on a branded screen until /health answers and the widget has loaded,
 * with an escape hatch so nobody is ever trapped behind the splash.
 */
export function DemoChatSlot() {
  const [overlay, setOverlay] = useState<Overlay>('shown');
  const [serverUp, setServerUp] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);

  const startedAtRef = useRef(0);
  const dismissedRef = useRef(false);
  const timeoutIdsRef = useRef<number[]>([]);

  const later = useCallback((fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms);
    timeoutIdsRef.current.push(id);
  }, []);

  const dismiss = useCallback(() => {
    if (dismissedRef.current) return;
    dismissedRef.current = true;
    const wait = Math.max(0, MIN_SPLASH_MS - (Date.now() - startedAtRef.current));
    later(() => {
      setOverlay('fading');
      later(() => setOverlay('gone'), FADE_MS);
    }, wait);
  }, [later]);

  // Start the clock and poll the backend until it answers (CORS is open: *).
  useEffect(() => {
    startedAtRef.current = Date.now();
    let cancelled = false;
    let retryId = 0;
    let inflight: AbortController | null = null;

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
      inflight?.abort();
    };
  }, []);

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

  // Esc leaves the splash.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dismiss]);

  // Clear pending fades if the page unloads mid-transition.
  useEffect(
    () => () => {
      timeoutIdsRef.current.forEach((id) => window.clearTimeout(id));
    },
    [],
  );

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
      <div className="overflow-hidden border border-[var(--pub-line-strong)] bg-[#0b0f14]">
        <div className="flex items-center justify-between border-b border-[#1b222c] px-3 py-2 text-[11px] text-[#8a97a6]">
          <span>Live agent &middot; demo workspace</span>
          <span>no login</span>
        </div>
        {serverUp ? (
          <iframe
            src={DEMO_CHAT_SRC}
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
                onClick={dismiss}
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
