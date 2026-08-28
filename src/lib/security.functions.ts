// Security server functions: public-form rate limiting, MFA recovery codes,
// step-up re-authentication and data-retention administration.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  admin, anonClient, auditLog, clientIp, consumeRecoveryCode, enforceRateLimit,
  generateRecoveryCodes, grantReauth, isSuperAdmin, RateLimitError, requireReauth,
  storeRecoveryCodes,
} from "@/lib/security.server";

const reportSchema = z.object({
  category: z.string().min(1).max(60),
  description: z.string().trim().min(20).max(4000),
  province: z.string().min(1).max(80),
  district: z.string().min(1).max(80),
  reporter_name: z.string().max(160).optional(),
  reporter_phone: z.string().max(60).optional(),
  priority: z.enum(["low", "normal", "high", "critical"]).optional(),
  gps_lat: z.number().nullable().optional(),
  gps_lng: z.number().nullable().optional(),
  // Bot protection
  website: z.string().max(200).optional(), // honeypot: must stay empty
  elapsedMs: z.number().int().nonnegative().optional(),
});

/** Public incident submission: honeypot + timing check + sliding-window IP rate limit. */
export const submitPublicReportFn = createServerFn({ method: "POST" })
  .inputValidator((d) => reportSchema.parse(d))
  .handler(async ({ data }) => {
    if (data.website && data.website.trim() !== "") {
      // Silently accept for bots, but store nothing.
      return { id: "00000000-0000-0000-0000-000000000000", status: "New" };
    }
    if (typeof data.elapsedMs === "number" && data.elapsedMs < 2500) {
      throw new Error("That was submitted a little too quickly. Please review your report and try again.");
    }

    try {
      await enforceRateLimit(
        {
          bucket: "public_report",
          windows: [
            { minutes: 10, max: 3, message: "You've sent several reports already. Please wait about 10 minutes before sending another. If this is an emergency, call the helpline on 116." },
            { minutes: 60 * 24, max: 12, message: "Daily report limit reached from this connection. Please contact the helpline on 116 for urgent help." },
          ],
        },
        clientIp(),
      );
    } catch (err) {
      if (err instanceof RateLimitError) throw new Error(err.message);
      throw err;
    }

    const db = await admin();
    const { data: row, error } = await db
      .from("reports")
      .insert({
        category: data.category,
        description: data.description,
        province: data.province,
        district: data.district,
        reporter_name: data.reporter_name ?? null,
        reporter_phone: data.reporter_phone ?? null,
        priority: data.priority ?? "normal",
        gps_lat: data.gps_lat ?? null,
        gps_lng: data.gps_lng ?? null,
        submitted_by: null,
      })
      .select("id,status")
      .single();
    if (error) throw new Error("We couldn't save your report. Please try again in a moment.");
    return { id: row.id, status: row.status };
  });

// ============ MFA recovery codes ============
export const issueRecoveryCodesFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const codes = generateRecoveryCodes(10);
    await storeRecoveryCodes(context.userId, codes);
    const db = await admin();
    await db.from("profiles").update({ mfa_enrolled_at: new Date().toISOString() }).eq("user_id", context.userId);
    await auditLog(context.userId, "mfa_recovery_codes_issued", "user", context.userId);
    return { codes };
  });

export const recoveryCodeStatusFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = await admin();
    const { data } = await db
      .from("mfa_recovery_codes")
      .select("used_at")
      .eq("user_id", context.userId);
    const total = data?.length ?? 0;
    const remaining = (data ?? []).filter((r) => !r.used_at).length;
    return { total, remaining };
  });

/** Unauthenticated rescue path: password + unused recovery code clears MFA factors. */
export const recoveryUnlockFn = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({
      email: z.string().email(),
      password: z.string().min(6).max(200),
      code: z.string().min(6).max(40),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    try {
      await enforceRateLimit(
        {
          bucket: "mfa_recovery",
          windows: [
            { minutes: 15, max: 5, message: "Too many recovery attempts. Please wait 15 minutes and try again." },
            { minutes: 60 * 24, max: 15, message: "Recovery is temporarily locked for this connection. Contact the Super Admin." },
          ],
        },
        clientIp(),
      );
    } catch (err) {
      if (err instanceof RateLimitError) throw new Error(err.message);
      throw err;
    }

    const auth = anonClient();
    const { data: signIn, error } = await auth.auth.signInWithPassword({
      email: data.email.trim().toLowerCase(),
      password: data.password,
    });
    const userId = signIn?.user?.id;
    if (error || !userId) throw new Error("Incorrect email, password or recovery code.");
    await auth.auth.signOut();

    const ok = await consumeRecoveryCode(userId, data.code);
    if (!ok) throw new Error("Incorrect email, password or recovery code.");

    const db = await admin();
    const { data: factors } = await db.auth.admin.mfa.listFactors({ userId });
    for (const f of factors?.factors ?? []) {
      await db.auth.admin.mfa.deleteFactor({ id: f.id, userId });
    }
    await db.from("profiles").update({ mfa_enrolled_at: null }).eq("user_id", userId);
    await auditLog(userId, "mfa_recovery_used", "user", userId);
    return { success: true };
  });

// ============ Step-up re-authentication ============
export const reauthFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ password: z.string().min(6).max(200) }).parse(d))
  .handler(async ({ data, context }) => {
    try {
      await enforceRateLimit(
        {
          bucket: "reauth",
          windows: [{ minutes: 15, max: 8, message: "Too many password confirmations. Please wait 15 minutes." }],
        },
        context.userId,
      );
    } catch (err) {
      if (err instanceof RateLimitError) throw new Error(err.message);
      throw err;
    }

    const db = await admin();
    const { data: userRes } = await db.auth.admin.getUserById(context.userId);
    const email = userRes?.user?.email;
    if (!email) throw new Error("Could not verify your account.");

    const auth = anonClient();
    const { error } = await auth.auth.signInWithPassword({ email, password: data.password });
    if (error) throw new Error("Incorrect password.");
    await auth.auth.signOut();

    const expiresAt = await grantReauth(context.userId);
    await auditLog(context.userId, "step_up_reauth", "user", context.userId);
    return { expiresAt };
  });

export const reauthStatusFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    try {
      await requireReauth(context.userId);
      return { valid: true };
    } catch {
      return { valid: false };
    }
  });

// ============ Data retention ============
export const getRetentionFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    if (!(await isSuperAdmin(context.userId))) throw new Error("Forbidden");
    const db = await admin();
    const { data: settings } = await db.from("retention_settings").select("*").eq("id", true).maybeSingle();
    const { data: runs } = await db
      .from("retention_purge_runs")
      .select("*")
      .order("ran_at", { ascending: false })
      .limit(20);
    return { settings, runs: runs ?? [] };
  });

export const updateRetentionFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      audit_log_days: z.number().int().min(30).max(3650),
      attachment_days: z.number().int().min(30).max(3650),
      notification_days: z.number().int().min(7).max(3650),
      rate_limit_days: z.number().int().min(1).max(365),
      auto_purge_enabled: z.boolean(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    if (!(await isSuperAdmin(context.userId))) throw new Error("Forbidden");
    await requireReauth(context.userId);
    const db = await admin();
    const { error } = await db
      .from("retention_settings")
      .update({ ...data, updated_at: new Date().toISOString(), updated_by: context.userId })
      .eq("id", true);
    if (error) throw new Error(error.message);
    await auditLog(context.userId, "retention_settings_updated", "retention", "settings", data);
    return { success: true };
  });

export const runRetentionPurgeFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ dryRun: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    if (!(await isSuperAdmin(context.userId))) throw new Error("Forbidden");
    if (!data.dryRun) await requireReauth(context.userId);
    const { runRetentionPurge } = await import("@/lib/retention.server");
    return runRetentionPurge({ dryRun: data.dryRun, source: "manual", actor: context.userId });
  });

export const exportAuditLogsFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ days: z.number().int().min(1).max(3650) }).parse(d))
  .handler(async ({ data, context }) => {
    if (!(await isSuperAdmin(context.userId))) throw new Error("Forbidden");
    const db = await admin();
    const since = new Date(Date.now() - data.days * 86_400_000).toISOString();
    const { data: rows, error } = await db
      .from("admin_activity_logs")
      .select("created_at, actor_user_id, actor_email, action, target_type, target_id, ip_address, metadata")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(5000);
    if (error) throw new Error(error.message);
    await auditLog(context.userId, "audit_logs_exported", "retention", "audit", { days: data.days });
    return { rows: rows ?? [] };
  });

export const listAuditLogsFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ limit: z.number().int().min(1).max(200).default(50) }).parse(d))
  .handler(async ({ data, context }) => {
    if (!(await isSuperAdmin(context.userId))) throw new Error("Forbidden");
    const db = await admin();
    const { data: rows } = await db
      .from("admin_activity_logs")
      .select("id, created_at, actor_user_id, actor_email, action, target_type, target_id, ip_address")
      .order("created_at", { ascending: false })
      .limit(data.limit);
    return { rows: rows ?? [] };
  });
