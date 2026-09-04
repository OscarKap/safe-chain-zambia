// Client-callable translation endpoints. Credentials stay on the server.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { LANGUAGES, TRANSLATION_STATUSES, type LanguageCode } from "@/lib/i18n/config";

const langCodes = Object.keys(LANGUAGES) as [LanguageCode, ...LanguageCode[]];

const batchSchema = z.object({
  language: z.enum(langCodes),
  items: z
    .array(z.object({ text: z.string().min(1).max(4000), context: z.string().max(300).optional() }))
    .max(200),
});

/**
 * Public, cache-only translation lookup. Never calls an AI provider, so it is
 * safe to expose and cheap to call on every page.
 */
export const getTranslationsFn = createServerFn({ method: "POST" })
  .inputValidator((d) => batchSchema.parse(d))
  .handler(async ({ data }) => {
    const { translateBatch } = await import("./translate.server");
    const map = await translateBatch(data.items, data.language, { generateMissing: false });
    return { language: data.language, translations: map };
  });

async function assertAdmin(userId: string) {
  const { admin, isSuperAdmin } = await import("@/lib/security.server");
  if (await isSuperAdmin(userId)) return;
  const db = await admin();
  const { data } = await db
    .from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (!data) throw new Error("Forbidden: administrators only");
}

/** Admin-only: generate missing translations through the provider chain. */
export const generateTranslationsFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => batchSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { translateBatch } = await import("./translate.server");
    const map = await translateBatch(data.items, data.language, { generateMissing: true });
    return { language: data.language, translations: map };
  });

const listSchema = z.object({
  language: z.enum(langCodes).optional(),
  status: z.enum(TRANSLATION_STATUSES).optional(),
  q: z.string().max(200).optional(),
  limit: z.number().int().min(1).max(200).default(100),
});

export const listTranslationsFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => listSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { admin } = await import("@/lib/security.server");
    const db = await admin();
    let q = db
      .from("translations")
      .select("id, translation_key, source_text, target_language, translated_text, machine_text, context, provider, model, status, human_reviewed, reviewed_at, updated_at")
      .order("updated_at", { ascending: false })
      .limit(data.limit);
    if (data.language) q = q.eq("target_language", data.language);
    if (data.status) q = q.eq("status", data.status);
    if (data.q) q = q.ilike("source_text", `%${data.q}%`);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);

    const { data: failures } = await db
      .from("translation_failures")
      .select("id, translation_key, target_language, provider, error, created_at")
      .order("created_at", { ascending: false })
      .limit(20);

    return { rows: rows ?? [], failures: failures ?? [] };
  });

const reviewSchema = z.object({
  id: z.string().uuid(),
  translatedText: z.string().min(1).max(8000).optional(),
  status: z.enum(TRANSLATION_STATUSES),
});

/** Admin-only: edit / approve / reject / flag a translation for revision. */
export const reviewTranslationFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => reviewSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { admin, auditLog } = await import("@/lib/security.server");
    const db = await admin();
    const humanReviewed = data.status === "human_reviewed" || data.status === "approved";
    const patch: Record<string, unknown> = {
      status: data.status,
      human_reviewed: humanReviewed,
      reviewer: humanReviewed ? context.userId : null,
      reviewed_at: humanReviewed ? new Date().toISOString() : null,
    };
    if (data.translatedText) patch.translated_text = data.translatedText;
    const { error } = await db.from("translations").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    await auditLog(context.userId, "review_translation", "translation", data.id, { status: data.status });
    return { success: true };
  });

/** Admin-only: discard the current text and regenerate from the providers. */
export const retranslateFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { admin } = await import("@/lib/security.server");
    const db = await admin();
    const { data: row } = await db
      .from("translations")
      .select("source_text, context, target_language")
      .eq("id", data.id)
      .maybeSingle();
    if (!row) throw new Error("Translation not found");
    const { translateAndCache } = await import("./translate.server");
    const target = LANGUAGES[row.target_language as LanguageCode];
    if (!target) throw new Error("Unsupported language");
    const out = await translateAndCache({ text: row.source_text, context: row.context ?? undefined }, target);
    if (out.fallback) throw new Error("All configured providers failed. See translation failures.");
    return { success: true, text: out.text };
  });
