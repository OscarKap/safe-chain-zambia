// Admin/staff session policy: short idle timeout, absolute session lifetime,
// and periodic access-token rotation.
import { supabase } from "@/integrations/supabase/client";

export const IDLE_TIMEOUT_MS = 20 * 60 * 1000; // 20 minutes without activity
export const ABSOLUTE_LIFETIME_MS = 8 * 60 * 60 * 1000; // 8 hours max per sign-in
export const ROTATE_EVERY_MS = 10 * 60 * 1000; // rotate the access token every 10 minutes

const START_KEY = "safechain.session.startedAt";
const LAST_KEY = "safechain.session.lastActivity";

export function markSessionStart() {
  const now = String(Date.now());
  try {
    localStorage.setItem(START_KEY, now);
    localStorage.setItem(LAST_KEY, now);
  } catch { /* storage unavailable */ }
}

export function clearSessionMarks() {
  try {
    localStorage.removeItem(START_KEY);
    localStorage.removeItem(LAST_KEY);
  } catch { /* ignore */ }
}

function touch() {
  try { localStorage.setItem(LAST_KEY, String(Date.now())); } catch { /* ignore */ }
}

function read(key: string): number | null {
  try {
    const v = localStorage.getItem(key);
    return v ? Number(v) : null;
  } catch { return null; }
}

export type SessionEndReason = "idle" | "expired";

/**
 * Starts the policy watchers. Returns a cleanup function.
 * `onEnd` is called when the session must be terminated.
 */
export function startSessionPolicy(onEnd: (reason: SessionEndReason) => void) {
  if (typeof window === "undefined") return () => { /* noop */ };

  if (read(START_KEY) === null) markSessionStart();

  const events: (keyof WindowEventMap)[] = ["mousedown", "keydown", "touchstart", "scroll", "focus"];
  for (const e of events) window.addEventListener(e, touch, { passive: true });

  const check = window.setInterval(() => {
    const started = read(START_KEY);
    const last = read(LAST_KEY);
    const now = Date.now();
    if (started !== null && now - started > ABSOLUTE_LIFETIME_MS) { onEnd("expired"); return; }
    if (last !== null && now - last > IDLE_TIMEOUT_MS) { onEnd("idle"); }
  }, 30_000);

  const rotate = window.setInterval(() => {
    const last = read(LAST_KEY);
    // Only rotate while the user is actually active.
    if (last !== null && Date.now() - last < IDLE_TIMEOUT_MS) {
      void supabase.auth.refreshSession();
    }
  }, ROTATE_EVERY_MS);

  return () => {
    for (const e of events) window.removeEventListener(e, touch);
    window.clearInterval(check);
    window.clearInterval(rotate);
  };
}
