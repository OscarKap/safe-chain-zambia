// JengaNLP/JengaAI adapter interface.
// No endpoint or payload is invented here. Configure JENGA_API_URL only after
// selecting the contract supplied by the Jenga deployment.
import type { TranslationProvider } from "./index.server";

export const jengaProvider: TranslationProvider = {
  id: "jenga",
  label: "JengaNLP",
  isConfigured: () => Boolean(process.env["JENGA_API_URL"] && process.env["JENGA_API_KEY"]),
  supports: (lang) => Boolean(lang.jengaCode),
  async translateText() {
    throw new Error("JengaNLP adapter is available but no API contract is configured");
  },
};
