// Provider registry. Server-only: adapters read credentials from process.env.
import type { LanguageDef, ProviderId } from "@/lib/i18n/config";
import { nllbProvider } from "./nllb.server";
import { vamboProvider } from "./vambo.server";
import { jengaProvider } from "./jenga.server";
import { geminiProvider } from "./gemini.server";

export interface TranslateRequest {
  text: string;
  sourceLanguage: string;
  target: LanguageDef;
  context?: string;
}

export interface TranslateResult {
  translatedText: string;
  provider: ProviderId;
  model: string;
}

export interface TranslateManyRequest {
  items: { text: string; context?: string }[];
  sourceLanguage: string;
  target: LanguageDef;
}

export interface TranslationProvider {
  id: ProviderId;
  label: string;
  /** True when credentials/endpoint are present in the environment. */
  isConfigured: () => boolean;
  /** True when this provider can handle the given language. */
  supports: (lang: LanguageDef) => boolean;
  translateText: (req: TranslateRequest) => Promise<TranslateResult>;
  /**
   * Optional: translate several strings in one call. Providers that support it
   * avoid one network round trip (and one rate-limit slot) per string.
   * Returns results aligned with the request items.
   */
  translateMany?: (req: TranslateManyRequest) => Promise<TranslateResult[]>;
}

export const PROVIDERS: Record<ProviderId, TranslationProvider> = {
  nllb: nllbProvider,
  vambo: vamboProvider,
  jenga: jengaProvider,
  gemini: geminiProvider,
};

/** Ordered, usable providers for a language (configured + supports it). */
export function providerChain(lang: LanguageDef): TranslationProvider[] {
  return lang.providers
    .map((id) => PROVIDERS[id])
    .filter((p) => p && p.isConfigured() && p.supports(lang));
}
