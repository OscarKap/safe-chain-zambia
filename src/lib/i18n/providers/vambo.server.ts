// Vambo AI adapter. The endpoint contract is deployment-configured and is
// intentionally not guessed: set VAMBO_API_URL to the documented endpoint.
import type { TranslationProvider } from "./index.server";

export const vamboProvider: TranslationProvider = {
  id: "vambo",
  label: "Vambo AI",
  isConfigured: () => Boolean(process.env["VAMBO_API_URL"] && process.env["VAMBO_API_KEY"]),
  supports: (lang) => Boolean(lang.vamboCode),
  async translateText({ text, sourceLanguage, target, context }) {
    const url = process.env["VAMBO_API_URL"];
    const key = process.env["VAMBO_API_KEY"];
    if (!url || !key || !target.vamboCode) throw new Error("Vambo is not configured for this language");
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
      body: JSON.stringify({ text, source_language: sourceLanguage, target_language: target.vamboCode, context }),
    });
    if (!res.ok) throw new Error(`Vambo request failed (${res.status}): ${(await res.text()).slice(0, 300)}`);
    const body = (await res.json()) as Record<string, unknown>;
    const translatedText = typeof body.translated_text === "string" ? body.translated_text : typeof body.translation === "string" ? body.translation : null;
    if (!translatedText) throw new Error("Vambo returned no translated text");
    return { translatedText, provider: "vambo", model: typeof body.model === "string" ? body.model : "configured" };
  },
};
