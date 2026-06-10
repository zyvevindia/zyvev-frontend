/**
 * Evidence-aware AI extraction — produces evidence records, not publish payloads.
 */

import { aiFieldsToEvidenceRecords, normalizeVariantRow } from "../evidenceRecord.js";
import { runAiProviderExtraction } from "./providers/index.js";
import { resolveAiExtractionConfig } from "./config.js";

/**
 * Extract content → evidence records + variant rows for one source.
 * @param {object} params
 */
export async function extractSourceToEvidence(params = {}) {
  const {
    importId,
    content,
    sourceType,
    sourceName,
    sourceUrl,
    trustScore,
    aiConfig,
  } = params;

  if (!content?.trim()) {
    return { ok: false, errors: ["Empty content"], records: [], variants: [] };
  }

  const context = { sourceType, sourceName, sourceUrl };
  const aiResult = await runAiProviderExtraction(content, context, aiConfig);

  if (!aiResult.ok && !aiResult.fields) {
    return { ok: false, errors: aiResult.errors || ["AI extraction failed"], records: [], variants: [] };
  }

  const extractionMethod =
    aiResult.extractionMethod ||
    (aiResult.provider === "heuristic" ? "heuristic-v1" : `ai-${aiResult.provider}`);

  const records = aiFieldsToEvidenceRecords(aiResult.fields || {}, {
    importId,
    sourceType,
    sourceName,
    sourceUrl,
    trustScore,
    extractionMethod,
  });

  const variants = (aiResult.variants || []).map(normalizeVariantRow);

  return {
    ok: true,
    records,
    variants,
    meta: {
      provider: aiResult.provider,
      model: aiResult.model,
      extractionMethod,
      fieldCount: records.length,
      variantCount: variants.length,
      fallbackFrom: aiResult.fallbackFrom,
      configured: (aiConfig || resolveAiExtractionConfig()).configured,
    },
  };
}

/**
 * Merge variant rows from multiple sources — highest avg confidence wins per name.
 * @param {object[][]} variantLists
 */
export function mergeVariantExtractions(variantLists = []) {
  const byName = new Map();

  for (const list of variantLists) {
    for (const v of list || []) {
      const name = String(v.variantName || "").trim();
      if (!name) continue;
      const key = name.toLowerCase();
      const score = [
        v.price?.confidence,
        v.battery?.confidence,
        v.range?.confidence,
      ]
        .filter(Number.isFinite)
        .reduce((a, b, _, arr) => a + b / arr.length, 0);

      const prev = byName.get(key);
      if (!prev || score > prev._score) {
        byName.set(key, { ...v, variantName: name, _score: score });
      }
    }
  }

  return [...byName.values()].map(({ _score, ...v }) => v);
}

export { resolveAiExtractionConfig, runAiProviderExtraction };
