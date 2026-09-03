/**
 * Central localisation configuration (client-safe).
 *
 * Adding another Zambian language = add an entry to `LANGUAGES` plus the
 * provider codes it is actually supported by. Nothing else needs to change.
 * See docs/localisation.md.
 */

export type LanguageCode = "en" | "bem" | "nya" | "toi" | "loz";

export type ProviderId = "nllb" | "vambo" | "jenga" | "gemini";

export interface LanguageDef {
  code: LanguageCode;
  /** English name */
  name: string;
  /** Endonym shown in the switcher */
  nativeName: string;
  /**
   * Provider chain, highest quality first. A provider is only used when it is
   * both listed here AND configured (credentials/endpoint present on server).
   */
  providers: ProviderId[];
  /** NLLB-200 FLORES-200 code, when the language exists in NLLB-200. */
  nllbCode?: string;
  /** ISO code sent to Vambo AI / JengaNLP when enabled. */
  vamboCode?: string;
  jengaCode?: string;
}

/**
 * Verified support notes (do not widen without checking the provider docs):
 * - NLLB-200 (FLORES-200) contains Bemba (bem_Latn), Nyanja/Chichewa (nya_Latn)
 *   and Tonga-Zambia (toi_Latn). It does NOT contain Lozi (Silozi).
 * - Vambo AI covers a set of African languages incl. Bemba and Nyanja; the exact
 *   endpoint/codes are configured per deployment, so the adapter stays disabled
 *   until VAMBO_API_URL + VAMBO_API_KEY are set.
 * - JengaNLP: integration interface only. No endpoint is assumed; it is enabled
 *   only when JENGA_API_URL + JENGA_API_KEY are configured.
 * - Gemini (via Lovable AI) is a general-purpose fallback/benchmark engine. It
 *   is never preferred over a dedicated Zambian-language model.
 */
export const LANGUAGES: Record<LanguageCode, LanguageDef> = {
  en: { code: "en", name: "English", nativeName: "English", providers: [] },
  bem: {
    code: "bem",
    name: "Bemba",
    nativeName: "ChiBemba",
    providers: ["vambo", "nllb", "jenga", "gemini"],
    nllbCode: "bem_Latn",
    vamboCode: "bem",
    jengaCode: "bem",
  },
  nya: {
    code: "nya",
    name: "Nyanja",
    nativeName: "Chinyanja",
    providers: ["nllb", "vambo", "jenga", "gemini"],
    nllbCode: "nya_Latn",
    vamboCode: "nya",
    jengaCode: "nya",
  },
  toi: {
    code: "toi",
    name: "Tonga",
    nativeName: "Chitonga",
    providers: ["nllb", "jenga", "gemini"],
    nllbCode: "toi_Latn",
    jengaCode: "toi",
  },
  loz: {
    code: "loz",
    name: "Lozi",
    nativeName: "Silozi",
    // Not present in NLLB-200. Until a dedicated provider is verified, Lozi is
    // served by the general-purpose fallback engine only.
    providers: ["jenga", "gemini"],
    jengaCode: "loz",
  },
};

export const LANGUAGE_ORDER: LanguageCode[] = ["en", "bem", "nya", "toi", "loz"];

export const DEFAULT_LANGUAGE: LanguageCode = "en";

export const LANGUAGE_STORAGE_KEY = "safechain.lang";

export function isLanguageCode(v: unknown): v is LanguageCode {
  return typeof v === "string" && v in LANGUAGES;
}

export const TRANSLATION_STATUSES = [
  "draft",
  "machine_translated",
  "human_reviewed",
  "approved",
  "needs_revision",
] as const;
export type TranslationStatus = (typeof TRANSLATION_STATUSES)[number];

/** Stable, deterministic key for a piece of source text (+ optional context). */
export function makeTranslationKey(text: string, context?: string): string {
  const input = `${text}\u0000${context ?? ""}`;
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 16777619) >>> 0;
    h2 = Math.imul(h2 + c, 2246822519) >>> 0;
  }
  const slug = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return `${slug || "text"}.${h1.toString(36)}${h2.toString(36)}`;
}
