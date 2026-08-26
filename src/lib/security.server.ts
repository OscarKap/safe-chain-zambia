// Server-only security helpers: hashing, IP resolution, rate limiting,
// step-up re-authentication grants. Never imported by client code directly.
import { getRequest } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

/** Publishable-key client used only to verify a password (no session persisted). */
export function anonClient() {
  return createClient<Database>(
    process.env["SUPABASE_URL"]!,
    process.env["SUPABASE_PUBLISHABLE_KEY"]!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

export function clientIp(): string {
  const req = getRequest();
  const h = req?.headers;
  const raw =
    h?.get("cf-connecting-ip") ??
    h?.get("x-real-ip") ??
    h?.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";
  return raw || "unknown";
}

export interface RateRule {
  bucket: string;
  /** Sliding windows evaluated in order, e.g. 3 per 10 min, 8 per day. */
  windows: { minutes: number; max: number; message: string }[];
}

export class RateLimitError extends Error {
  retryAfterMinutes: number;
  constructor(message: string, retryAfterMinutes: number) {
    super(message);
    this.name = "RateLimitError";
    this.retryAfterMinutes = retryAfterMinutes;
  }
}

/** Records an attempt and throws a friendly error once a window is exceeded. */
export async function enforceRateLimit(rule: RateRule, key: string): Promise<void> {
  const db = await admin();
  const keyHash = await sha256(`${rule.bucket}:${key}`);
  const longest = Math.max(...rule.windows.map((w) => w.minutes));
  const since = new Date(Date.now() - longest * 60_000).toISOString();

  const { data } = await db
    .from("rate_limit_events")
    .select("created_at")
    .eq("bucket", rule.bucket)
    .eq("key_hash", keyHash)
    .gte("created_at", since);

  const stamps = (data ?? []).map((r) => new Date(r.created_at).getTime());
  for (const w of rule.windows) {
    const cutoff = Date.now() - w.minutes * 60_000;
    if (stamps.filter((t) => t >= cutoff).length >= w.max) {
      throw new RateLimitError(w.message, w.minutes);
    }
  }

  await db.from("rate_limit_events").insert({ bucket: rule.bucket, key_hash: keyHash });
}

// ============ Step-up re-authentication ============
export const REAUTH_TTL_MINUTES = 10;

export async function grantReauth(userId: string, scope = "sensitive") {
  const db = await admin();
  const expiresAt = new Date(Date.now() + REAUTH_TTL_MINUTES * 60_000).toISOString();
  await db.from("admin_reauth_grants").insert({ user_id: userId, scope, expires_at: expiresAt });
  return expiresAt;
}

export async function requireReauth(userId: string, scope = "sensitive") {
  const db = await admin();
  const { data } = await db
    .from("admin_reauth_grants")
    .select("id, expires_at")
    .eq("user_id", userId)
    .eq("scope", scope)
    .is("consumed_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("expires_at", { ascending: false })
    .limit(1);
  const grant = data?.[0];
  if (!grant) {
    throw new Error("REAUTH_REQUIRED: Please confirm your password to continue.");
  }
  return grant.id;
}

export async function isSuperAdmin(userId: string) {
  const db = await admin();
  const { data } = await db
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "super_admin")
    .maybeSingle();
  return !!data;
}

// ============ MFA recovery codes ============
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateRecoveryCodes(count = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const bytes = crypto.getRandomValues(new Uint8Array(10));
    const raw = Array.from(bytes).map((b) => ALPHABET[b % ALPHABET.length]).join("");
    codes.push(`${raw.slice(0, 5)}-${raw.slice(5)}`);
  }
  return codes;
}

export function normalizeCode(code: string) {
  return code.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export async function storeRecoveryCodes(userId: string, codes: string[]) {
  const db = await admin();
  await db.from("mfa_recovery_codes").delete().eq("user_id", userId);
  const rows = await Promise.all(
    codes.map(async (c) => ({ user_id: userId, code_hash: await sha256(normalizeCode(c)) })),
  );
  const { error } = await db.from("mfa_recovery_codes").insert(rows);
  if (error) throw new Error(error.message);
}

export async function consumeRecoveryCode(userId: string, code: string) {
  const db = await admin();
  const hash = await sha256(normalizeCode(code));
  const { data } = await db
    .from("mfa_recovery_codes")
    .select("id")
    .eq("user_id", userId)
    .eq("code_hash", hash)
    .is("used_at", null)
    .maybeSingle();
  if (!data) return false;
  await db.from("mfa_recovery_codes").update({ used_at: new Date().toISOString() }).eq("id", data.id);
  return true;
}

export async function auditLog(
  actorUserId: string | null,
  action: string,
  targetType?: string,
  targetId?: string,
  metadata: Record<string, unknown> = {},
) {
  const db = await admin();
  await db.from("admin_activity_logs").insert({
    actor_user_id: actorUserId,
    action,
    target_type: targetType ?? null,
    target_id: targetId ?? null,
    metadata: metadata as never,
    ip_address: clientIp(),
  });
}
