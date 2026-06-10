/**
 * Vehicle Creation Agent v1.1 — golden-aware benchmark helpers (workflow layer only).
 */

import { runFullBenchmarkReport } from "../../catalogAcquisition/benchmark/benchmarkReport.js";
import { evaluateExtractionAgainstGolden } from "../../catalogAcquisition/benchmark/evaluateExtraction.js";
import { FIELD_LABELS } from "../../catalogAcquisition/extractionSchema.js";

const CORRECTION_MINUTES_EACH = 0.5;
const PUBLISH_PROBABILITY_HIGH = 75;

export { PUBLISH_PROBABILITY_HIGH, CORRECTION_MINUTES_EACH };

/**
 * Run benchmark report when golden dossier is available.
 */
export function buildBenchmarkContext(importRecord, evidenceRecords = [], goldenDossier = null, pipelineDiagnostics = {}) {
  if (!goldenDossier) {
    return {
      hasGolden: false,
      goldenId: null,
      evaluation: null,
      benchmarkReport: null,
      estimatedCorrections: null,
    };
  }

  const benchmarkReport = runFullBenchmarkReport({
    importRecord,
    goldenDossier,
    evidenceRecords,
  });

  const evaluation = benchmarkReport.evaluation;
  const estimatedCorrections = estimateManualCorrectionsFromBenchmark(
    benchmarkReport,
    pipelineDiagnostics
  );

  return {
    hasGolden: true,
    goldenId: goldenDossier.id || goldenDossier.familySlug,
    evaluation,
    benchmarkReport,
    estimatedCorrections,
    qualityGates: benchmarkReport.qualityGates,
  };
}

/**
 * Golden benchmark delta — same formula as production validation.
 */
export function estimateManualCorrectionsFromBenchmark(
  benchmarkReport = {},
  pipelineDiagnostics = {}
) {
  if (!benchmarkReport?.evaluation) return null;

  const eval_ = benchmarkReport.evaluation;
  const fieldWrong = (eval_.field?.total || 0) - (eval_.field?.correct || 0);
  const featureWrong = (eval_.feature?.total || 0) - (eval_.feature?.correct || 0);
  const priceWrong = (eval_.price?.total || 0) - (eval_.price?.correct || 0);
  const variantMissing = (eval_.variant?.goldenCount || 0) - (eval_.variant?.matchedCount || 0);
  const attention = pipelineDiagnostics.attentionCount || 0;
  const conflicts = pipelineDiagnostics.conflictCount || 0;
  const hall = benchmarkReport.hallucination?.criticalCount || 0;

  return fieldWrong + featureWrong + priceWrong + variantMissing + attention + conflicts + hall;
}

/**
 * Fallback correction estimate without golden dossier.
 */
export function estimateManualCorrectionsHeuristic({
  attentionCount = 0,
  conflictCount = 0,
  missingCount = 0,
  benchmarkMismatchCount = 0,
} = {}) {
  return attentionCount + conflictCount + missingCount + benchmarkMismatchCount;
}

export function estimateCorrectionMinutes(corrections = 0) {
  const n = Math.max(0, Number(corrections) || 0);
  return Math.round(n * CORRECTION_MINUTES_EACH * 10) / 10;
}

/**
 * Publish probability 0–100 for operator trust signal.
 */
export function computePublishProbability({
  qualityGates = {},
  estimatedCorrections = null,
  conflictCount = 0,
  hasGolden = false,
  severeBenchmarkMismatch = false,
} = {}) {
  if (!qualityGates.passed) {
    const penalty = Math.min(90, (qualityGates.failureCount || 1) * 25);
    return Math.max(0, 100 - penalty);
  }

  let score = 92;
  if (estimatedCorrections != null) {
    score -= Math.min(55, estimatedCorrections * 2.5);
  } else if (!hasGolden) {
    score -= 25;
  }
  score -= conflictCount * 12;
  if (severeBenchmarkMismatch) score -= 30;
  if (hasGolden && qualityGates.passed && (estimatedCorrections ?? 99) <= 10) {
    score += 8;
  }
  return Math.round(Math.max(0, Math.min(100, score)));
}

export function isPublishProbabilityHigh(probability) {
  return (probability ?? 0) >= PUBLISH_PROBABILITY_HIGH;
}

export function hasSevereBenchmarkMismatch(evaluation = {}, estimatedCorrections = null) {
  if (estimatedCorrections != null && estimatedCorrections > 25) return true;
  const variant = evaluation?.variant;
  if (variant?.goldenCount && !variant.countMatch) {
    const gap = Math.abs((variant.goldenCount || 0) - (variant.extractedCount || 0));
    if (gap >= 2) return true;
  }
  const fieldWrong =
    (evaluation?.field?.total || 0) - (evaluation?.field?.correct || 0);
  const priceWrong =
    (evaluation?.price?.total || 0) - (evaluation?.price?.correct || 0);
  return fieldWrong + priceWrong > 15;
}

export function isCriticalGateFailure(qualityGates = {}, missingRequiredCount = 0) {
  if (!qualityGates.passed && (qualityGates.failureCount || 0) > 2) return true;
  if (missingRequiredCount >= 2) return true;
  const criticalGates = new Set([
    "variant_count_mismatch",
    "required_fields",
    "unresolved_conflicts",
    "evidence_missing",
  ]);
  return (qualityGates.failures || []).some((f) => criticalGates.has(f.gate));
}

function formatComparisonRow(comparison, category) {
  const label = FIELD_LABELS[comparison.fieldKey] || comparison.fieldKey;
  return {
    fieldKey: comparison.fieldKey,
    label,
    category,
    expected: comparison.expected,
    actual: comparison.actual,
    message:
      comparison.message ||
      `Golden mismatch: expected ${comparison.expected ?? "—"}, got ${comparison.actual ?? "—"}`,
  };
}

/**
 * Benchmark deltas not surfaced by attention-only field filtering.
 */
export function buildHiddenBenchmarkDeltas(evaluation = {}, attentionFieldKeys = []) {
  const attentionSet = new Set(attentionFieldKeys || []);
  const variant = [];
  const pricing = [];
  const missing = [];
  const features = [];

  if (evaluation?.variant) {
    const v = evaluation.variant;
    if (!v.countMatch) {
      variant.push({
        fieldKey: "variant_count",
        label: "Variant count",
        category: "variant",
        expected: v.goldenCount,
        actual: v.extractedCount,
        message: `Variant count ${v.extractedCount} vs golden ${v.goldenCount}`,
        hidden: !attentionSet.has("variant_count"),
      });
    }
    for (const match of v.matches || []) {
      if (match.matched) continue;
      const key = `variant:${match.golden?.variantName || "unknown"}`;
      variant.push({
        fieldKey: key,
        label: match.golden?.variantName || "Variant",
        category: "variant",
        expected: match.golden?.variantName,
        actual: match.extracted?.variantName ?? null,
        message: match.extracted
          ? `Variant mismatch: ${match.golden?.variantName}`
          : `Missing golden variant: ${match.golden?.variantName}`,
        hidden: !attentionSet.has(key),
      });
    }
  }

  for (const comparison of evaluation?.price?.comparisons || []) {
    if (comparison.correct || comparison.status === "skipped") continue;
    pricing.push({
      ...formatComparisonRow(comparison, "pricing"),
      hidden: !attentionSet.has(comparison.fieldKey),
    });
  }

  for (const comparison of evaluation?.field?.comparisons || []) {
    if (comparison.correct || comparison.status === "skipped") continue;
    const row = {
      ...formatComparisonRow(comparison, comparison.status === "missing" ? "missing" : "field"),
      hidden: !attentionSet.has(comparison.fieldKey),
    };
    if (comparison.status === "missing") {
      missing.push(row);
    } else {
      features.push(row);
    }
  }

  for (const comparison of evaluation?.feature?.comparisons || []) {
    if (comparison.correct || comparison.status === "skipped") continue;
    features.push({
      ...formatComparisonRow(comparison, "feature"),
      hidden: !attentionSet.has(comparison.fieldKey),
    });
  }

  const allRows = [...variant, ...pricing, ...missing, ...features];
  const hiddenRows = allRows.filter((r) => r.hidden !== false);

  return {
    variant,
    pricing,
    missing,
    features,
    rows: allRows,
    hiddenRows,
    totalCount: allRows.length,
    hiddenCount: hiddenRows.length,
  };
}

export function resolveGoldenId(job = {}, evidencePacket = {}) {
  return (
    job.familySlug ||
    job.goldenId ||
    evidencePacket.familySlug ||
    evidencePacket.extractedVehicle?.vehicle?.familySlug?.value ||
    evidencePacket.extractedVehicle?.vehicle?.familySlug ||
    null
  );
}

/**
 * Expected recommendation for validation accuracy measurement.
 */
export function expectedRecommendationV11({
  qualityGates = {},
  estimatedCorrections = null,
  conflictCount = 0,
  attentionCount = 0,
  publishProbability = 0,
  severeBenchmarkMismatch = false,
  acquisitionOk = true,
  missingRequiredCount = 0,
  hasGolden = false,
} = {}) {
  if (!acquisitionOk) return "BLOCKED";
  if (isCriticalGateFailure(qualityGates, missingRequiredCount)) return "BLOCKED";
  if (severeBenchmarkMismatch) return "BLOCKED";

  const corrections = estimatedCorrections ?? estimateManualCorrectionsHeuristic({
    attentionCount,
    conflictCount,
    missingCount: missingRequiredCount,
  });

  if (
    qualityGates.passed &&
    corrections <= 10 &&
    conflictCount === 0 &&
    attentionCount === 0 &&
    isPublishProbabilityHigh(publishProbability) &&
    (hasGolden || corrections <= 5)
  ) {
    return "READY";
  }

  if (!qualityGates.passed && !isCriticalGateFailure(qualityGates, missingRequiredCount)) {
    return "REVIEW_REQUIRED";
  }

  if (
    corrections > 10 ||
    attentionCount > 0 ||
    conflictCount > 0 ||
    !qualityGates.passed ||
    (hasGolden && corrections > 0)
  ) {
    return "REVIEW_REQUIRED";
  }

  return "REVIEW_REQUIRED";
}
