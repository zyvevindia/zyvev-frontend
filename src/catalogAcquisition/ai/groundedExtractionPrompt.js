/**
 * Two-pass evidence-grounded extraction prompts.
 * Pass 1: find verbatim evidence only. Pass 2: normalize from evidence only.
 */

import { ALL_SCALAR_FIELD_KEYS } from "../extractionSchema.js";

export function buildEvidencePassSystemPrompt() {
  return `You are an evidence discovery engine for EV catalog extraction (EVSavari, India market).

YOUR ONLY JOB (Pass 1): Find verbatim text snippets from the source that explicitly state vehicle specifications.

STRICT RULES:
- Copy snippets exactly as they appear in the source (minor whitespace normalization OK).
- Do NOT interpret, normalize, infer, estimate, or guess values.
- Do NOT output schema field values — only raw evidence snippets.
- If a specification is not explicitly stated, do not invent evidence.
- Include variant-level evidence when trim names and prices appear together.

Respond with ONLY valid JSON.`;
}

export function buildEvidencePassUserPrompt(content, context = {}) {
  const fieldHints = ALL_SCALAR_FIELD_KEYS.join(", ");
  return `Source type: ${context.sourceType || "unknown"}
Source URL: ${context.sourceUrl || "n/a"}
Source name: ${context.sourceName || "n/a"}

Schema field hints (for labeling evidence only — do not extract values yet):
${fieldHints}

Source content:
"""
${String(content).slice(0, 120_000)}
"""

Return JSON:
{
  "evidenceItems": [
    {
      "fieldKey": "batteryCapacityKwh",
      "verbatimSnippet": "55 kWh battery pack",
      "contextLine": "surrounding line from source"
    }
  ],
  "variantEvidence": [
    {
      "variantNameSnippet": "Creative 45",
      "items": [
        { "fieldKey": "price", "verbatimSnippet": "₹17,99,000" },
        { "fieldKey": "battery", "verbatimSnippet": "45 kWh" }
      ]
    }
  ]
}`;
}

export function buildNormalizePassSystemPrompt() {
  return `You are a schema normalizer for EV catalog extraction (EVSavari, India market).

YOUR ONLY JOB (Pass 2): Map provided evidence snippets to structured fields.

STRICT RULES:
- Output a field ONLY when a provided evidence snippet explicitly supports it.
- Every output field MUST include: value, confidence (0-100), sourceSnippet (verbatim from evidence), sourceType.
- sourceSnippet MUST be copied from the evidence items — never fabricate snippets.
- If evidence is insufficient for a field, omit the field entirely (do not use null placeholders).
- Do NOT infer, estimate, or guess. Never use world knowledge.
- Prices: integers in INR without currency symbols.
- Booleans: true/false only when explicitly stated.
- Variants: only when variant evidence is provided.

Respond with ONLY valid JSON.`;
}

export function buildNormalizePassUserPrompt(evidencePayload, context = {}) {
  const fieldList = ALL_SCALAR_FIELD_KEYS.join(", ");
  return `Source type for all fields: ${context.sourceType || "OEM_WEBSITE"}
Source URL: ${context.sourceUrl || "n/a"}

Evidence from Pass 1 (ONLY use these snippets):
${JSON.stringify(evidencePayload, null, 2)}

Normalize to schema fields: ${fieldList}

Return JSON:
{
  "fields": {
    "brand": {
      "value": "Tata",
      "confidence": 95,
      "sourceSnippet": "verbatim snippet from evidence",
      "sourceType": "${context.sourceType || "OEM_WEBSITE"}"
    }
  },
  "variants": [
    {
      "variantName": {
        "value": "Creative 45",
        "confidence": 92,
        "sourceSnippet": "Creative 45",
        "sourceType": "${context.sourceType || "OEM_WEBSITE"}"
      },
      "price": {
        "value": 1799000,
        "confidence": 90,
        "sourceSnippet": "₹17,99,000",
        "sourceType": "${context.sourceType || "OEM_WEBSITE"}"
      }
    }
  ]
}`;
}
