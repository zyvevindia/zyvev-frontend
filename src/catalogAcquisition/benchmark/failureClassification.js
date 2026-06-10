/**
 * Benchmark failure classification — diagnose extraction errors per field.
 */

import { flattenExtractionDraft } from "../extractionSchema.js";
import { compareField, extractFieldValue, BENCHMARK_FEATURE_KEYS } from "./compareUtils.js";
import { evaluateFieldAccuracy, evaluatePriceAccuracy, evaluateVariantAccuracy, evaluateFeatureAccuracy } from "./evaluateExtraction.js";

const FAILURE_TYPES = Object.freeze({
  MISSING_EXTRACTION: "missing_extraction",
  WRONG_EXTRACTION: "wrong_extraction",
  HALLUCINATION: "hallucination",
  MAPPING_ERROR: "mapping_error",
});

function goldenScalarFields(golden) {
  const fields = { ...(golden.fields || {}) };
  for (const key of BENCHMARK_FEATURE_KEYS) {
    if (golden.features?.[key] !== undefined) fields[key] = golden.features[key];
  }
  return fields;
}

function classifyFieldFailure({
  fieldKey,
  comparison,
  hallucinationFields = [],
  groundingRejected = [],
  flatEntry,
}) {
  const hallucinated = hallucinationFields.some((h) => h.fieldKey === fieldKey);
  const groundedReject = groundingRejected.find((r) => r.fieldKey === fieldKey);
  const hasValue = extractFieldValue(flatEntry) !== null && extractFieldValue(flatEntry) !== "";

  if (comparison?.status === "missing" || (!hasValue && comparison?.expected != null)) {
    if (groundedReject) {
      return {
        fieldKey,
        failureType: FAILURE_TYPES.HALLUCINATION,
        detail: `Rejected pre-publish: ${groundedReject.reason}`,
        expected: comparison?.expected,
        actual: comparison?.actual,
      };
    }
    return {
      fieldKey,
      failureType: FAILURE_TYPES.MISSING_EXTRACTION,
      detail: "Value absent in extraction",
      expected: comparison?.expected,
      actual: comparison?.actual,
    };
  }

  if (hallucinated) {
    return {
      fieldKey,
      failureType: FAILURE_TYPES.HALLUCINATION,
      detail: "Field flagged — no traceable evidence",
      expected: comparison?.expected,
      actual: comparison?.actual,
    };
  }

  if (groundedReject?.reason === "snippet_not_in_source") {
    return {
      fieldKey,
      failureType: FAILURE_TYPES.HALLUCINATION,
      detail: "Snippet not found in source (rejected by grounding)",
      expected: comparison?.expected,
      actual: groundedReject.fieldValue,
    };
  }

  if (comparison?.status === "incorrect") {
    const expected = comparison.expected;
    const actual = comparison.actual;
    const bothNumeric =
      Number.isFinite(Number(expected)) && Number.isFinite(Number(actual));
    if (
      bothNumeric &&
      String(expected).replace(/[^0-9.]/g, "") !== String(actual).replace(/[^0-9.]/g, "") &&
      String(fieldKey).match(/^(startingPrice|topVariantPrice|batteryCapacityKwh|claimedRangeKm)/)
    ) {
      return {
        fieldKey,
        failureType: FAILURE_TYPES.MAPPING_ERROR,
        detail: "Numeric value extracted but wrong mapping/normalization",
        expected,
        actual,
      };
    }
    return {
      fieldKey,
      failureType: FAILURE_TYPES.WRONG_EXTRACTION,
      detail: "Value present but incorrect vs golden",
      expected,
      actual,
    };
  }

  return null;
}

/**
 * Classify all benchmark failures for one golden vs extraction run.
 */
export function classifyBenchmarkFailures({
  golden,
  extractedDraft = {},
  hallucination = {},
  grounding = {},
} = {}) {
  const goldenFields = goldenScalarFields(golden);
  const flat = flattenExtractionDraft(extractedDraft);
  const features = extractedDraft.features || {};
  for (const key of BENCHMARK_FEATURE_KEYS) {
    if (features[key]) flat[key] = features[key];
  }

  const hallucinationFields = hallucination.fields || [];
  const groundingRejected = grounding.rejected || [];

  const failures = [];
  const counts = {
    missing_extraction: 0,
    wrong_extraction: 0,
    hallucination: 0,
    mapping_error: 0,
  };

  for (const [fieldKey, expected] of Object.entries(goldenFields)) {
    if (expected === null || expected === undefined) continue;
    const actual = extractFieldValue(flat[fieldKey]);
    const comparison = compareField(fieldKey, expected, actual);
    if (comparison.correct) continue;

    const classified = classifyFieldFailure({
      fieldKey,
      comparison,
      hallucinationFields,
      groundingRejected,
      flatEntry: flat[fieldKey],
    });
    if (classified) {
      failures.push(classified);
      counts[classified.failureType] = (counts[classified.failureType] || 0) + 1;
    }
  }

  const fieldEval = evaluateFieldAccuracy(golden, extractedDraft);
  const priceEval = evaluatePriceAccuracy(golden, extractedDraft);
  const variantEval = evaluateVariantAccuracy(golden, extractedDraft);
  const featureEval = evaluateFeatureAccuracy(golden, extractedDraft);

  return {
    generatedAt: new Date().toISOString(),
    goldenId: golden?.id,
    failureCount: failures.length,
    counts,
    failures: failures.slice(0, 50),
    accuracy: {
      field: fieldEval.accuracy,
      price: priceEval.accuracy,
      variant: variantEval.accuracy,
      feature: featureEval.accuracy,
    },
    groundingRejectedCount: groundingRejected.length,
    hallucinationCount: hallucination.count || 0,
  };
}

export { FAILURE_TYPES };
