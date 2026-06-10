/**
 * OpenAI provider — evidence-grounded two-pass extraction (default).
 */

import {
  buildExtractionSystemPrompt,
  buildExtractionUserPrompt,
  parseAiJsonResponse,
} from "../extractionPrompt.js";
import { runGroundedTwoPassExtraction } from "../groundedExtraction.js";

async function callOpenAiChat({ apiKey, model, system, user, temperature = 0 }) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenAI HTTP ${res.status}: ${errText.slice(0, 200)}`);
  }

  const data = await res.json();
  const usage = data.usage
    ? {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        inputTokens: data.usage.prompt_tokens,
        outputTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      }
    : null;

  return {
    content: data.choices?.[0]?.message?.content || "",
    usage,
  };
}

export async function extractWithOpenAi(content, context = {}, config = {}) {
  const apiKey = config.apiKey;
  const model = config.model || "gpt-4o-mini";
  if (!apiKey) {
    return { ok: false, errors: ["OpenAI API key not configured"] };
  }

  const useGrounded = config.grounded !== false;

  if (useGrounded) {
    try {
      const result = await runGroundedTwoPassExtraction({
        content,
        context,
        provider: "openai",
        model,
        callChat: (msg) =>
          callOpenAiChat({
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
        extractionMethod: "ai-openai-grounded-two-pass",
      };
    } catch (err) {
      return { ok: false, errors: [err?.message || "OpenAI grounded extraction failed"] };
    }
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: buildExtractionSystemPrompt() },
        { role: "user", content: buildExtractionUserPrompt(content, context) },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    return { ok: false, errors: [`OpenAI HTTP ${res.status}: ${errText.slice(0, 200)}`] };
  }

  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content || "";
  const parsed = parseAiJsonResponse(raw);
  if (!parsed?.fields) {
    return { ok: false, errors: ["OpenAI returned unparseable JSON"], raw };
  }

  const usage = data.usage
    ? {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        inputTokens: data.usage.prompt_tokens,
        outputTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      }
    : null;

  return {
    ok: true,
    fields: parsed.fields,
    variants: parsed.variants || [],
    provider: "openai",
    model,
    raw,
    usage,
    extractionMode: "legacy-single-pass",
  };
}
