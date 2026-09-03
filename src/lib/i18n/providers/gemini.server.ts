// Lovable AI Gemini fallback. This is intentionally last in each language's
// chain and never claims dedicated model support.
import { generateText } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import type { TranslationProvider } from "./index.server";

export const geminiProvider: TranslationProvider = {
  id: "gemini",
  label: "Lovable AI",
  isConfigured: () => Boolean(process.env["LOVABLE_API_KEY"]),
  supports: () => true,
  async translateText({ text, sourceLanguage, target, context }) {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("Lovable AI is not configured");
    const gateway = createLovableAiGatewayProvider(key);
    const { text: translatedText } = await generateText({
      model: gateway("google/gemini-3.6-flash"),
      system: "You translate Safe Chain interface text. Preserve placeholders, URLs, names, and punctuation. Return only the translation, with no explanation.",
      prompt: `Translate from ${sourceLanguage} to ${target.name} (${target.nativeName}). Context: ${context ?? "Safe Chain user interface"}\n\nText:\n${text}`,
    });
    if (!translatedText.trim()) throw new Error("Gemini returned empty translation");
    return { translatedText: translatedText.trim(), provider: "gemini", model: "google/gemini-3.6-flash" };
  },
};
