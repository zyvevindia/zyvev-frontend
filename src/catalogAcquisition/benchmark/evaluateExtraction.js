/**
 * Compare extracted/reviewed vehicle against golden benchmark dossier.
 */

import { flattenExtractionDraft, ALL_SCALAR_FIELD_KEYS } from "../extractionSchema.js";
import {
  BENCHMARK_FEATURE_KEYS,
  compareField,
  extractFieldValue,
  priceTolerance,
  variantNameSimilarity,
} from "./compareUtils.js";

const SCALAR_BENCHMARK_KEYS = ALL_SCALAR_FIELD_KEYS.filter(
  (k) => !BENCHMARK_FEATURE_KEYS.includes(k)
);

function flatFromDraft(draft) {
  const flat = flattenExtractionDraft(draft);
  const features = draft.features || {};
  for (const key of BENCHMARK_FEATURE_KEYS) {
    if (features[key]) flat[key] = features[key];
  }
  return flat;
}

function goldenScalarFields(golden) {
  const fields = { ...(golden.fields || {}) };
  for (const key of BENCHMARK_FEATURE_KEYS) {
    if (golden.features?.[key] !== undefined) fields[key] = golden.features[key];
  }
  return fields;
}

export function evaluateFieldAccuracy(golden, extractedDraft) {
  const goldenFields = goldenScalarFields(golden);
  const flat = flatFromDraft(extractedDraft);
  const comparisons = [];

  for (const key of [...SCALAR_BENCHMARK_KEYS, ...BENCHMARK_FEATURE_KEYS]) {
    if (goldenFields[key] === undefined || goldenFields[key] === null) continue;
    const actual = extractFieldValue(flat[key]);
    comparisons.push(compareField(key, goldenFields[key], actual));
  }

  const scored = comparisons.filter((c) => c.status !== "skipped");
  const correct = scored.filter((c) => c.correct).length;
  const total = scored.length;

  return {
    accuracy: total ? correct / total : null,
    correct,
    total,
    comparisons,
  };
}

export function evaluateFeatureAccuracy(golden, extractedDraft) {
  const goldenFeatures = {
    ...(golden.features || {}),
    adas: golden.fields?.adas,
  };
  const flat = flatFromDraft(extractedDraft);
  const comparisons = [];

  for (const key of BENCHMARK_FEATURE_KEYS) {
    if (goldenFeatures[key] === undefined || goldenFeatures[key] === null) continue;
    const actual = extractFieldValue(flat[key]);
    comparisons.push(compareField(key, goldenFeatures[key], actual));
  }

  const scored = comparisons.filter((c) => c.status !== "skipped");
  const correct = scored.filter((c) => c.correct).length;
  const total = scored.length;

  return {
    accuracy: total ? correct / total : null,
    correct,
    total,
    comparisons,
  };
}

export function evaluatePriceAccuracy(golden, extractedDraft) {
  const goldenFields = golden.fields || {};
  const flat = flatFromDraft(extractedDraft);
  const priceKeys = ["startingPrice", "topVariantPrice", "exShowroomPrice"];
  const comparisons = [];

  for (const key of priceKeys) {
    if (goldenFields[key] == null) continue;
    const actual = extractFieldValue(flat[key]);
    comparisons.push(compareField(key, goldenFields[key], actual));
  }

  const variantComparisons = evaluateVariantAccuracy(golden, extractedDraft).matches
    .filter((m) => m.golden && m.extracted)
    .map((m) => ({
      fieldKey: `variant:${m.golden.variantName}:price`,
      status: priceTolerance(m.golden.priceInr, m.extracted.priceInr) ? "correct" : "incorrect",
      correct: priceTolerance(m.golden.priceInr, m.extracted.priceInr),
      expected: m.golden.priceInr,
      actual: m.extracted.priceInr,
    }));

  const all = [...comparisons, ...variantComparisons].filter((c) => c.status !== "skipped");
  const correct = all.filter((c) => c.correct).length;

  return {
    accuracy: all.length ? correct / all.length : null,
    correct,
    total: all.length,
    comparisons: all,
  };
}

export function evaluateVariantAccuracy(golden, extractedDraft) {
  const goldenVariants = golden.variants || [];
  const extractedVariants = (extractedDraft.variants || [])
    .filter((v) => !v.rejected)
    .map((v) => ({
      variantName: extractFieldValue(v.variantName),
      priceInr: extractFieldValue(v.price),
      batteryKwh: extractFieldValue(v.battery),
      rangeKm: extractFieldValue(v.range),
    }))
    .filter((v) => v.variantName);

  const matches = [];
  const usedExtracted = new Set();

  for (const gv of goldenVariants) {
    let best = null;
    let bestScore = 0;
    let bestIdx = -1;

    extractedVariants.forEach((ev, idx) => {
      if (usedExtracted.has(idx)) return;
      const score = variantNameSimilarity(gv.variantName, ev.variantName);
      if (score > bestScore) {
        bestScore = score;
        best = ev;
        bestIdx = idx;
      }
    });

    if (bestScore >= 0.5 && bestIdx >= 0) {
      usedExtracted.add(bestIdx);
      matches.push({
        golden: gv,
        extracted: best,
        similarity: bestScore,
        matched: true,
      });
    } else {
      matches.push({ golden: gv, extracted: null, similarity: 0, matched: false });
    }
  }

  const matchedCount = matches.filter((m) => m.matched).length;

  return {
    accuracy: goldenVariants.length ? matchedCount / goldenVariants.length : null,
    matchedCount,
    goldenCount: goldenVariants.length,
    extractedCount: extractedVariants.length,
    countMatch: extractedVariants.length === goldenVariants.length,
    matches,
  };
}

export function evaluateExtractionAgainstGolden(golden, extractedDraft) {
  const field = evaluateFieldAccuracy(golden, extractedDraft);
  const variant = evaluateVariantAccuracy(golden, extractedDraft);
  const price = evaluatePriceAccuracy(golden, extractedDraft);
  const feature = evaluateFeatureAccuracy(golden, extractedDraft);

  return {
    goldenId: golden.id,
    familySlug: golden.familySlug,
    evaluatedAt: new Date().toISOString(),
    fieldAccuracy: field.accuracy,
    variantAccuracy: variant.accuracy,
    priceAccuracy: price.accuracy,
    featureAccuracy: feature.accuracy,
    field,
    variant,
    price,
    feature,
    summary: {
      fieldCorrect: field.correct,
      fieldTotal: field.total,
      variantMatched: variant.matchedCount,
      variantGoldenCount: variant.goldenCount,
      variantExtractedCount: variant.extractedCount,
      variantCountMatch: variant.countMatch,
      priceCorrect: price.correct,
      priceTotal: price.total,
      featureCorrect: feature.correct,
      featureTotal: feature.total,
    },
  };
}

export function findGoldenByFamilySlug(goldenManifest, familySlug) {
  return (goldenManifest?.vehicles || []).find((v) => v.familySlug === familySlug) || null;
}
