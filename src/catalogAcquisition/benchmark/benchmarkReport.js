/**
 * Full benchmark report assembly — shared by v4 and LLM benchmarks.
 */

import { evaluateExtractionAgainstGolden } from "./evaluateExtraction.js";
import { runConfidenceCalibration } from "./confidenceCalibration.js";
import { detectHallucinations } from "./hallucinationDetection.js";
import { buildEvidenceCoverageReport } from "./evidenceCoverage.js";
import { buildReviewMetricsReport } from "./reviewMetrics.js";
import { checkPublishQualityGates } from "./qualityGates.js";
import { classifyBenchmarkFailures } from "./failureClassification.js";

export function runFullBenchmarkReport({
  importRecord = {},
  goldenDossier = null,
  evidenceRecords = [],
  reviewSession = null,
  grounding = null,
} = {}) {
  const draft = importRecord.reviewedVehicle || importRecord.extractedVehicle || {};
  const mergedFields = importRecord.evidenceSummary || draft.evidence || {};

  const evaluation = goldenDossier
    ? evaluateExtractionAgainstGolden(goldenDossier, draft)
    : null;

  const calibration = goldenDossier
    ? runConfidenceCalibration(goldenDossier, draft, mergedFields)
    : null;

  const hallucination = detectHallucinations({
    extractedDraft: draft,
    mergedFields,
    evidenceRecords,
  });

  const evidenceCoverage = buildEvidenceCoverageReport(mergedFields);

  const reviewMetrics = reviewSession
    ? buildReviewMetricsReport(
        reviewSession,
        importRecord.extractedVehicle,
        importRecord.reviewedVehicle
      )
    : null;

  const qualityGates = checkPublishQualityGates(
    importRecord,
    evidenceRecords,
    goldenDossier
  );

  const failureDiagnostics = goldenDossier
    ? classifyBenchmarkFailures({
        golden: goldenDossier,
        extractedDraft: draft,
        hallucination,
        grounding: grounding || {},
      })
    : null;

  return {
    generatedAt: new Date().toISOString(),
    importId: importRecord.id,
    goldenId: goldenDossier?.id ?? null,
    evaluation,
    calibration,
    hallucination,
    evidenceCoverage,
    reviewMetrics,
    qualityGates,
    failureDiagnostics,
    grounding: grounding || null,
    metrics: evaluation
      ? {
          fieldAccuracy: evaluation.fieldAccuracy,
          variantAccuracy: evaluation.variantAccuracy,
          priceAccuracy: evaluation.priceAccuracy,
          featureAccuracy: evaluation.featureAccuracy,
        }
      : null,
  };
}

export function aggregateBenchmarkResults(reports = []) {
  const withEval = reports.filter((r) => r.evaluation);
  const avg = (key) => {
    const vals = withEval.map((r) => r.evaluation[key]).filter((n) => Number.isFinite(n));
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  };

  return {
    generatedAt: new Date().toISOString(),
    vehicleCount: reports.length,
    evaluatedCount: withEval.length,
    averageFieldAccuracy: avg("fieldAccuracy"),
    averageVariantAccuracy: avg("variantAccuracy"),
    averagePriceAccuracy: avg("priceAccuracy"),
    averageFeatureAccuracy: avg("featureAccuracy"),
    qualityGatePassRate:
      reports.length ?
        reports.filter((r) => r.qualityGates?.passed).length / reports.length
      : null,
    reports,
  };
}
