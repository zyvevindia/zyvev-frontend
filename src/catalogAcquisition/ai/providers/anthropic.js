/**
 * Anthropic provider — evidence-grounded two-pass extraction (default).
 */

import {
  buildExtractionSystemPrompt,
  buildExtractionUserPrompt,
  parseAiJsonResponse,
} from "../extractionPrompt.js";
import { runGroundedTwoPassExtraction } from "../groundedExtraction.js";

async function callAnthropicChat({ apiKey, model, system, user, temperature = 0 }) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      temperature,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Anthropic HTTP ${res.status}: ${errText.slice(0, 200)}`);
  }

  const data = await res.json();
  const usage = data.usage
    ? {
        inputTokens: data.usage.input_tokens,
        outputTokens: data.usage.output_tokens,
        totalTokens: (data.usage.input_tokens || 0) + (data.usage.output_tokens || 0),
      }
    : null;

  return {
    content: data.content?.find((c) => c.type === "text")?.text || "",
    usage,
  };
}

export async function extractWithAnthropic(content, context = {}, config = {}) {
  const apiKey = config.apiKey;
  const model = config.model || "claude-3-5-haiku-latest";
  if (!apiKey) {
    return { ok: false, errors: ["Anthropic API key not configured"] };
  }

  const useGrounded = config.grounded !== false;

  if (useGrounded) {
    try {
      const result = await runGroundedTwoPassExtraction({
        content,
        context,
        provider: "anthropic",
        model,
        callChat: (msg) =>
          callAnthropicChat({
            apiKey,
            model,
            system: msg.system,
            user: msg.user,
            temperature: msg.temperature,
          }),
      });
      if (!result.ok) return result;
      return {
        ...result,
        extractionMethod: "ai-anthropic-grounded-two-pass",
      };
    } catch (err) {
      return { ok: false, errors: [err?.message || "Anthropic grounded extraction failed"] };
    }
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      temperature: 0.1,
      system: buildExtractionSystemPrompt(),
      messages: [{ role: "user", content: buildExtractionUserPrompt(content, context) }],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    return { ok: false, errors: [`Anthropic HTTP ${res.status}: ${errText.slice(0, 200)}`] };
  }

  const data = await res.json();
  const raw = data.content?.find((c) => c.type === "text")?.text || "";
  const parsed = parseAiJsonResponse(raw);
  if (!parsed?.fields) {
    return { ok: false, errors: ["Anthropic returned unparseable JSON"], raw };
  }

  const usage = data.usage
    ? {
        inputTokens: data.usage.input_tokens,
        outputTokens: data.usage.output_tokens,
        totalTokens: (data.usage.input_tokens || 0) + (data.usage.output_tokens || 0),
      }
    : null;

  return {
    ok: true,
    fields: parsed.fields,
    variants: parsed.variants || [],
    provider: "anthropic",
    model,
    raw,
    usage,
    extractionMode: "legacy-single-pass",
  };
}
