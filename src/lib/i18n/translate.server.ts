// Translation service: cache-first lookup, provider fallback chain,
// failure logging. Server-only.
import {
  DEFAULT_LANGUAGE, LANGUAGES, makeTranslationKey,
  type LanguageCode, type LanguageDef,
} from "@/lib/i18n/config";
import { providerChain } from "./providers/index.server";

async function db() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export interface TranslateItem {
  text: string;
  context?: string;
}

export interface TranslatedItem {
  key: string;
  source: string;
  text: string;
  /** true when the English source was returned because translation failed. */
  fallback: boolean;
}

/** Cache-only read. Used on public request paths so no AI call is triggered. */
export async function readCached(
  items: TranslateItem[],
  target: LanguageCode,
): Promise<Record<string, string>> {
  if (target === DEFAULT_LANGUAGE || items.length === 0) return {};
  const keys = items.map((i) => makeTranslationKey(i.text, i.context));
  const supabase = await db();
  const { data } = await supabase
    .from("translations")
    .select("translation_key, translated_text, status")
    .eq("target_language", target)
    .in("translation_key", keys);

  const out: Record<string, string> = {};
  for (const row of data ?? []) {
    if (["machine_translated", "human_reviewed", "approved"].includes(row.status)) {
      out[row.translation_key] = row.translated_text;
    }
  }
  return out;
}

async function logFailure(key: string, text: string, target: string, provider: string | null, error: string) {
  const supabase = await db();
  await supabase.from("translation_failures").insert({
    translation_key: key, source_text: text.slice(0, 2000),
    target_language: target, provider, error: error.slice(0, 1000),
  });
}

/** Translate one string through the language's provider chain, then cache it. */
export async function translateAndCache(
  item: TranslateItem,
  target: LanguageDef,
): Promise<TranslatedItem> {
  const key = makeTranslationKey(item.text, item.context);
  const chain = providerChain(target);

  for (const provider of chain) {
    try {
      const res = await provider.translateText({
        text: item.text,
        sourceLanguage: DEFAULT_LANGUAGE,
        target,
        context: item.context,
      });
      const supabase = await db();
      await supabase.from("translations").upsert(
        {
          translation_key: key,
          source_text: item.text,
          source_language: DEFAULT_LANGUAGE,
          target_language: target.code,
          translated_text: res.translatedText,
          machine_text: res.translatedText,
          context: item.context ?? null,
          provider: res.provider,
          model: res.model,
          status: "machine_translated",
        },
        { onConflict: "translation_key,target_language", ignoreDuplicates: false },
      );
      return { key, source: item.text, text: res.translatedText, fallback: false };
    } catch (err) {
      await logFailure(key, item.text, target.code, provider.id, err instanceof Error ? err.message : String(err));
    }
  }

  if (chain.length === 0) {
    await logFailure(key, item.text, target.code, null, "No configured provider supports this language");
  }
  // Never surface an error to the user: fall back to approved English.
  return { key, source: item.text, text: item.text, fallback: true };
}

/**
 * Batch entry point. Returns a source-text → translated-text map.
 * Cached entries never trigger an AI call.
 */
export async function translateBatch(
  items: TranslateItem[],
  targetCode: LanguageCode,
  options: { generateMissing: boolean },
): Promise<Record<string, string>> {
  const target = LANGUAGES[targetCode];
  if (!target || targetCode === DEFAULT_LANGUAGE) return {};

  const unique = new Map<string, TranslateItem>();
  for (const i of items) {
    if (i.text.trim()) unique.set(makeTranslationKey(i.text, i.context), i);
  }

  const cached = await readCached([...unique.values()], targetCode);
  const result: Record<string, string> = {};
  const missing: TranslateItem[] = [];

  for (const [key, item] of unique) {
    const hit = cached[key];
    if (hit) result[item.text] = hit;
    else missing.push(item);
  }

  if (!options.generateMissing) return result;

  // Prefer a provider that can translate a whole chunk in one call: far fewer
  // requests means far fewer provider rate-limit rejections.
  const chain = providerChain(target);
  const batching = chain.find((p) => typeof p.translateMany === "function");
  const remaining: TranslateItem[] = [];

  if (batching?.translateMany) {
    for (let i = 0; i < missing.length; i += 20) {
      const chunk = missing.slice(i, i + 20);
      try {
        const out = await batching.translateMany({
          items: chunk,
          sourceLanguage: DEFAULT_LANGUAGE,
          target,
        });
        const supabase = await db();
        await supabase.from("translations").upsert(
          chunk.map((item, idx) => ({
            translation_key: makeTranslationKey(item.text, item.context),
            source_text: item.text,
            source_language: DEFAULT_LANGUAGE,
            target_language: target.code,
            translated_text: out[idx]!.translatedText,
            machine_text: out[idx]!.translatedText,
            context: item.context ?? null,
            provider: out[idx]!.provider,
            model: out[idx]!.model,
            status: "machine_translated",
          })),
          { onConflict: "translation_key,target_language", ignoreDuplicates: false },
        );
        chunk.forEach((item, idx) => { result[item.text] = out[idx]!.translatedText; });
      } catch (err) {
        await logFailure("batch", chunk[0]?.text ?? "", target.code, batching.id,
          err instanceof Error ? err.message : String(err));
        remaining.push(...chunk);
      }
    }
  } else {
    remaining.push(...missing);
  }

  // Anything the batch path couldn't do goes one at a time, sequentially.
  for (const item of remaining) {
    const out = await translateAndCache(item, target);
    if (!out.fallback) result[item.text] = out.text;
  }
  return result;
}
