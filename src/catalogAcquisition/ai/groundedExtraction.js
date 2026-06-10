/**
 * Two-pass evidence-grounded LLM extraction orchestrator.
 * Pass 1: discover evidence. Pass 2: normalize. Then programmatic rejection.
 */

import { parseAiJsonResponse } from "./extractionPrompt.js";
import {
  buildEvidencePassSystemPrompt,
  buildEvidencePassUserPrompt,
  buildNormalizePassSystemPrompt,
  buildNormalizePassUserPrompt,
} from "./groundedExtractionPrompt.js";
import { applyEvidenceGrounding, groundedVariantsToDraftRows } from "./evidenceGrounding.js";

function combineUsage(a = {}, b = {}) {
  const inputTokens = (a.inputTokens || 0) + (b.inputTokens || 0);
  const outputTokens = (a.outputTokens || 0) + (b.outputTokens || 0);
  return {
    inputTokens,
    outputTokens,
    promptTokens: inputTokens,
    completionTokens: outputTokens,
    totalTokens: inputTokens + outputTokens,
    passCount: 2,
  };
}

/**
 * @param {object} params
 * @param {string} params.content
 * @param {object} params.context
 * @param {Function} params.callChat — async ({ system, user, temperature }) => { content, usage }
 * @param {string} params.provider
 * @param {string} params.model
 */
export async function runGroundedTwoPassExtraction({
  content,
  context = {},
  callChat,
  provider,
  model,
}) {
  const pass1 = await callChat({
    system: buildEvidencePassSystemPrompt(),
    user: buildEvidencePassUserPrompt(content, context),
    temperature: 0,
  });

  const evidencePayload = parseAiJsonResponse(pass1.content);
  if (!evidencePayload?.evidenceItems && !evidencePayload?.variantEvidence) {
    return {
      ok: false,
      errors: ["Pass 1 returned no evidence items"],
      rawPass1: pass1.content,
      provider,
      model,
    };
  }

  const pass2 = await callChat({
    system: buildNormalizePassSystemPrompt(),
    user: buildNormalizePassUserPrompt(evidencePayload, context),
    temperature: 0,
  });

  const normalized = parseAiJsonResponse(pass2.content);
  if (!normalized?.fields) {
    return {
      ok: false,
      errors: ["Pass 2 returned unparseable JSON"],
      rawPass1: pass1.content,
      rawPass2: pass2.content,
      provider,
      model,
    };
  }

  const grounded = applyEvidenceGrounding(normalized, content, context);
  const draftVariants = groundedVariantsToDraftRows(grounded.variants);

  return {
    ok: true,
    fields: grounded.fields,
    variants: draftVariants,
    provider,
    model,
    extractionMode: "grounded-two-pass",
    evidencePayload,
    grounding: grounded.grounding,
    usage: combineUsage(pass1.usage, pass2.usage),
    rawPass1: pass1.content,
    rawPass2: pass2.content,
  };
}
