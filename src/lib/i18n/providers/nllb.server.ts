// Meta NLLB-200 adapter.
// Works against any HF-Inference-compatible endpoint that accepts
// { inputs, parameters: { src_lang, tgt_lang } }.
// Configure with NLLB_API_URL (required), NLLB_API_KEY (optional), NLLB_MODEL.
import type { TranslationProvider } from "./index.server";

function endpoint() {
  return process.env["NLLB_API_URL"];
}

const FLORES_SOURCE: Record<string, string> = { en: "eng_Latn" };

export const nllbProvider: TranslationProvider = {
  id: "nllb",
  label: "Meta NLLB-200",
  isConfigured: () => Boolean(endpoint()),
  // NLLB-200 support is declared per language via `nllbCode` in the config.
  supports: (lang) => Boolean(lang.nllbCode),
  async translateText({ text, sourceLanguage, target }) {
    const url = endpoint()!;
    const key = process.env["NLLB_API_KEY"];
    const model = process.env["NLLB_MODEL"] ?? "facebook/nllb-200-distilled-600M";

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(key ? { authorization: `Bearer ${key}` } : {}),
      },
      body: JSON.stringify({
        inputs: text,
        parameters: {
          src_lang: FLORES_SOURCE[sourceLanguage] ?? "eng_Latn",
          tgt_lang: target.nllbCode,
        },
        options: { wait_for_model: true },
      }),
    });

    if (!res.ok) {
      throw new Error(`NLLB request failed (${res.status}): ${(await res.text()).slice(0, 300)}`);
    }

    const body: unknown = await res.json();
    const out = extractText(body);
    if (!out) throw new Error("NLLB returned an unrecognised response shape");
    return { translatedText: out, provider: "nllb", model };
  },
};

function extractText(body: unknown): string | null {
  if (typeof body === "string") return body;
  if (Array.isArray(body)) return extractText(body[0]);
  if (body && typeof body === "object") {
    const o = body as Record<string, unknown>;
    for (const k of ["translation_text", "translated_text", "generated_text", "text"]) {
      if (typeof o[k] === "string") return o[k] as string;
    }
  }
  return null;
}
