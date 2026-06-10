/**
 * AI provider registry — OpenAI, Anthropic, heuristic fallback.
 */

import { AI_PROVIDER_IDS, resolveAiExtractionConfig } from "../config.js";
import { extractWithOpenAi } from "./openai.js";
import { extractWithAnthropic } from "./anthropic.js";
import { extractWithHeuristic } from "./heuristic.js";

export async function runAiProviderExtraction(content, context = {}, configOverride = null) {
  const config = configOverride || resolveAiExtractionConfig();

  if (config.provider === AI_PROVIDER_IDS.OPENAI && config.configured) {
    const r = await extractWithOpenAi(content, context, config);
    if (r.ok) return r;
    const fallback = await extractWithHeuristic(content, context);
    return { ...fallback, fallbackFrom: "openai", fallbackErrors: r.errors };
  }

  if (config.provider === AI_PROVIDER_IDS.ANTHROPIC && config.configured) {
    const r = await extractWithAnthropic(content, context, config);
    if (r.ok) return r;
    const fallback = await extractWithHeuristic(content, context);
    return { ...fallback, fallbackFrom: "anthropic", fallbackErrors: r.errors };
  }

  return extractWithHeuristic(content, context);
}

export { extractWithOpenAi, extractWithAnthropic, extractWithHeuristic };
