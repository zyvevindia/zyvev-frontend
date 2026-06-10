/**
 * LLM extraction prompt — EVSavari schema v2 + variant matrix.
 * Legacy single-pass prompts. LLM providers default to grounded two-pass
 * (see groundedExtractionPrompt.js).
 */

import { ALL_SCALAR_FIELD_KEYS } from "../extractionSchema.js";

export function buildExtractionSystemPrompt() {
  return `You are an EV catalog data extraction engine for the Indian market (EVSavari).
Extract structured vehicle specifications from OEM brochures, websites, and reference pages.
Return ONLY valid JSON matching the schema. Use null for unknown fields.
For each scalar field provide { "value": ..., "confidence": 0-100 }.
Confidence reflects extraction certainty, not marketing claims.
For boolean features use true/false. Prices in INR as integers without currency symbols.
Include a "variants" array when trim/variant matrices are present with per-variant price, battery, range, charging, featureHighlights.`;
}

export function buildExtractionUserPrompt(content, context = {}) {
  const fieldList = ALL_SCALAR_FIELD_KEYS.join(", ");
  return `Source type: ${context.sourceType || "unknown"}
Source URL: ${context.sourceUrl || "n/a"}
Source name: ${context.sourceName || "n/a"}

Extract all available fields: ${fieldList}

Also extract variants array when present.

Content:
"""
${String(content).slice(0, 120_000)}
"""

Respond with JSON:
{
  "fields": {
    "brand": { "value": "Tata", "confidence": 95 },
    ...
  },
  "variants": [
    {
      "variantName": "Creative+",
      "price": { "value": 1849000, "confidence": 90 },
      "battery": { "value": 40, "confidence": 92 },
      "range": { "value": 453, "confidence": 88 },
      "acChargingKw": { "value": 7.2, "confidence": 85 },
      "dcChargingKw": { "value": 50, "confidence": 85 },
      "featureHighlights": { "value": "ADAS, sunroof", "confidence": 70 }
    }
  ]
}`;
}

export function parseAiJsonResponse(raw = "") {
  const text = String(raw).trim();
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1].trim() : text;

  try {
    return JSON.parse(candidate);
  } catch {
    const start = candidate.indexOf("{");
    const end = candidate.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(candidate.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}
