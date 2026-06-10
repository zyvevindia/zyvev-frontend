/**
 * AI extraction provider configuration — env-driven.
 */

export const AI_PROVIDER_IDS = Object.freeze({
  OPENAI: "openai",
  ANTHROPIC: "anthropic",
  HEURISTIC: "heuristic",
});

/**
 * @returns {{ provider: string, configured: boolean, model?: string, issues: string[] }}
 */
export function resolveAiExtractionConfig(env = process.env) {
  const preferred = (env.CATALOG_AI_PROVIDER || env.EVSAVARI_AI_PROVIDER || "").toLowerCase();
  const openaiKey = env.OPENAI_API_KEY || env.VITE_OPENAI_API_KEY;
  const anthropicKey = env.ANTHROPIC_API_KEY || env.VITE_ANTHROPIC_API_KEY;
  const openaiModel = env.CATALOG_OPENAI_MODEL || "gpt-4o-mini";
  const anthropicModel = env.CATALOG_ANTHROPIC_MODEL || "claude-3-5-haiku-latest";

  const issues = [];

  if (preferred === AI_PROVIDER_IDS.ANTHROPIC && anthropicKey) {
    return {
      provider: AI_PROVIDER_IDS.ANTHROPIC,
      configured: true,
      model: anthropicModel,
      apiKey: anthropicKey,
      issues,
    };
  }

  if (preferred === AI_PROVIDER_IDS.OPENAI && openaiKey) {
    return {
      provider: AI_PROVIDER_IDS.OPENAI,
      configured: true,
      model: openaiModel,
      apiKey: openaiKey,
      issues,
    };
  }

  if (openaiKey) {
    return {
      provider: AI_PROVIDER_IDS.OPENAI,
      configured: true,
      model: openaiModel,
      apiKey: openaiKey,
      issues,
    };
  }

  if (anthropicKey) {
    return {
      provider: AI_PROVIDER_IDS.ANTHROPIC,
      configured: true,
      model: anthropicModel,
      apiKey: anthropicKey,
      issues,
    };
  }

  issues.push("No LLM API key configured — using heuristic fallback");
  return {
    provider: AI_PROVIDER_IDS.HEURISTIC,
    configured: false,
    issues,
  };
}
