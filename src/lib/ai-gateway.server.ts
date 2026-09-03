import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

/** Server-only Lovable AI provider. Never import this module from client code. */
export function createLovableAiGatewayProvider(apiKey: string) {
  return createOpenAICompatible({
    name: "lovable-ai",
    baseURL: "https://ai.gateway.lovable.dev/v1",
    headers: { "Lovable-API-Key": apiKey },
  });
}
