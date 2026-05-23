/**
 * Compare calibration — CALIBRATED / ACCEPTABLE / NEEDS_TUNING (beta sprint).
 */

import { buildVehicleIntelligence } from "../intelligence/buildVehicleIntelligence.js";
import {
  scoreComparePairQuality,
  buildCompareQualityReport,
} from "./compareQualityOps.js";

export const CALIBRATION_STATUS = Object.freeze({
  CALIBRATED: "CALIBRATED",
  ACCEPTABLE: "ACCEPTABLE",
  NEEDS_TUNING: "NEEDS_TUNING",
});

const LEGACY_TO_CALIBRATION = {
  STRONG: CALIBRATION_STATUS.CALIBRATED,
  ACCEPTABLE: CALIBRATION_STATUS.ACCEPTABLE,
  NEEDS_REVIEW: CALIBRATION_STATUS.NEEDS_TUNING,
};

function auditPracticality(vehicles = []) {
  const issues = [];
  for (const car of vehicles) {
    const intel = buildVehicleIntelligence(car);
    if (!intel?.charging?.hasData) {
      issues.push(`weak_charging:${car.slug}`);
    }
    if (!intel?.ownership?.hasData) {
      issues.push(`weak_ownership:${car.slug}`);
    }
  }
  return issues;
}

/**
 * Extended calibration row from compare quality + practicality.
 */
export function scoreCompareCalibration({ pairSlug, cars = [], trend = null } = {}) {
  const parts = pairSlug.includes("-vs-")
    ? pairSlug.split("-vs-")
    : [pairSlug];
  const vehicles = parts
    .map((p) =>
      cars.find(
        (c) =>
          String(c.slug || "").toLowerCase() === p.trim() ||
          String(c.slug || "").toLowerCase().startsWith(`${p.trim()}-`)
      )
    )
    .filter(Boolean);

  const base = scoreComparePairQuality({ pairSlug, cars, trend });
  const practicalityIssues = auditPracticality(vehicles);
  const issues = [...base.issues, ...practicalityIssues];

  let status = LEGACY_TO_CALIBRATION[base.status] || CALIBRATION_STATUS.ACCEPTABLE;
  if (
    practicalityIssues.length >= 2 ||
    issues.includes("contradictory_flat_scores")
  ) {
    status = CALIBRATION_STATUS.NEEDS_TUNING;
  }

  const recommendationConfidencePct =
    base.recommendationConfidence === "high"
      ? 88
      : base.recommendationConfidence === "medium"
        ? 68
        : 45;

  const trustQualityScore = Math.max(
    0,
    Math.min(
      100,
      base.credibilityScore -
        practicalityIssues.length * 6 -
        (issues.includes("weak_score_separation") ? 10 : 0)
    )
  );

  const calibrationScore = Math.round(
    (base.compareQualityScore + trustQualityScore) / 2
  );

  const compareMaturityLevel =
    status === CALIBRATION_STATUS.CALIBRATED
      ? "mature"
      : status === CALIBRATION_STATUS.ACCEPTABLE
        ? "developing"
        : "early";

  const editorialReviewSuggested =
    status === CALIBRATION_STATUS.NEEDS_TUNING ||
    issues.includes("high_bounce_heuristic") ||
    issues.includes("duplicate_strengths");

  return {
    ...base,
    status,
    issues,
    calibrationScore,
    trustQualityScore,
    recommendationConfidencePct,
    compareMaturityLevel,
    editorialReviewSuggested,
    editorialHint: editorialReviewSuggested
      ? "Editorial review suggested — verify strengths, charging copy, and score gap."
      : null,
    practicalityIssues,
  };
}

export function buildCompareCalibrationReport(ctx = {}) {
  const quality = buildCompareQualityReport(ctx);
  const rows = quality.rows.map((row) =>
    scoreCompareCalibration({
      pairSlug: row.pairSlug,
      cars: ctx.cars,
      trend: row.traffic,
    })
  );

  const statusCounts = {
    [CALIBRATION_STATUS.CALIBRATED]: 0,
    [CALIBRATION_STATUS.ACCEPTABLE]: 0,
    [CALIBRATION_STATUS.NEEDS_TUNING]: 0,
  };
  for (const r of rows) {
    statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
  }

  const sorted = [...rows].sort(
    (a, b) => b.calibrationScore - a.calibrationScore
  );

  return {
    rows: sorted,
    statusCounts,
    strongest: sorted.filter((r) => r.status === CALIBRATION_STATUS.CALIBRATED).slice(0, 5),
    weakest: sorted
      .filter((r) => r.status === CALIBRATION_STATUS.NEEDS_TUNING)
      .slice(0, 5),
    needsEditorial: rows.filter((r) => r.editorialReviewSuggested),
    generatedAt: new Date().toISOString(),
  };
}
