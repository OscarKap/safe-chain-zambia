// Lovable AI Gemini fallback. This is intentionally last in each language's
// chain and never claims dedicated model support.
import { generateText } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import type { TranslationProvider } from "./index.server";

const MODEL = "google/gemini-3.6-flash";
const SYSTEM =
  "You translate Safe Chain interface text for a Zambian sexual-health, rights and safety app. " +
  "Preserve placeholders, URLs, names, emoji and punctuation. Keep the tone plain and respectful. " +
  "Never explain, never add quotes.";

function gateway() {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("Lovable AI is not configured");
  return createLovableAiGatewayProvider(key);
}

function stripFence(raw: string) {
  return raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/```$/, "").trim();
}

export const geminiProvider: TranslationProvider = {
  id: "gemini",
  label: "Lovable AI",
  isConfigured: () => Boolean(process.env["LOVABLE_API_KEY"]),
  supports: () => true,

  async translateText({ text, sourceLanguage, target, context }) {
    const { text: translatedText } = await generateText({
      model: gateway()(MODEL),
      system: `${SYSTEM} Return only the translation.`,
      prompt: `Translate from ${sourceLanguage} to ${target.name} (${target.nativeName}). Context: ${context ?? "Safe Chain user interface"}\n\nText:\n${text}`,
    });
    if (!translatedText.trim()) throw new Error("Gemini returned empty translation");
    return { translatedText: translatedText.trim(), provider: "gemini", model: MODEL };
  },

  /** One request for a whole page of strings — far fewer rate-limit slots. */
  async translateMany({ items, sourceLanguage, target }) {
    const numbered = items.map((it, i) => `${i + 1}. ${it.text.replace(/\n/g, " ")}`).join("\n");
    const { text: raw } = await generateText({
      model: gateway()(MODEL),
      system: `${SYSTEM} Reply with a JSON array of strings only — one translation per numbered input, in the same order and of the same length.`,
      prompt:
        `Translate each numbered line from ${sourceLanguage} into ${target.name} (${target.nativeName}). ` +
        `These are labels, headings and short paragraphs in a mobile app.\n\n${numbered}`,
    });

    let parsed: unknown;
    try {
      parsed = JSON.parse(stripFence(raw));
    } catch {
      throw new Error("Gemini batch response was not valid JSON");
    }
    if (!Array.isArray(parsed) || parsed.length !== items.length) {
      throw new Error("Gemini batch response did not match the requested items");
    }
    return parsed.map((value) => {
      const translatedText = String(value ?? "").trim();
      if (!translatedText) throw new Error("Gemini returned an empty translation in the batch");
      return { translatedText, provider: "gemini" as const, model: MODEL };
    });
  },
};
