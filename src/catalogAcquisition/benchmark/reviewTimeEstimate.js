/**
 * Review time estimate from attention field count (same bands as v3 demo).
 */

export function estimateReviewMinutes(attentionCount = 0) {
  const n = Number(attentionCount) || 0;
  if (n <= 3) return { min: 2, max: 4, label: "2–4 min" };
  if (n <= 8) return { min: 4, max: 8, label: "4–8 min" };
  return { min: 8, max: 15, label: "8–15 min" };
}

export function averageReviewMinutes(estimates = []) {
  const mids = estimates
    .map((e) => (e.min + e.max) / 2)
    .filter(Number.isFinite);
  if (!mids.length) return null;
  return Math.round((mids.reduce((a, b) => a + b, 0) / mids.length) * 10) / 10;
}

/**
 * Extract headline metrics from a full benchmark report for provider comparison.
 */
export function extractBenchmarkMetrics(report = {}) {
  const eval_ = report.evaluation || {};
  const hallucination = report.hallucination || {};
  const coverage = report.evidenceCoverage || {};
  const gates = report.qualityGates || {};
  const populated = coverage.populatedCount || 0;
  const hallucinationCount = hallucination.count || 0;

  return {
    fieldAccuracy: eval_.fieldAccuracy ?? null,
    priceAccuracy: eval_.priceAccuracy ?? null,
    variantAccuracy: eval_.variantAccuracy ?? null,
    featureAccuracy: eval_.featureAccuracy ?? null,
    coverageScore:
      coverage.fieldCount > 0 ? populated / coverage.fieldCount : null,
    averageEvidenceQuality: coverage.averageEvidenceQuality ?? null,
    hallucinationRate: populated > 0 ? hallucinationCount / populated : null,
    hallucinationCriticalCount: hallucination.criticalCount || 0,
    gatePassRate: gates.passed ? 1 : 0,
    qualityGatesPassed: Boolean(gates.passed),
    attentionCount: report.attentionCount ?? null,
    reviewTimeEstimate: report.reviewTimeEstimate ?? null,
  };
}
