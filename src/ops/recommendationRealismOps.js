/**
 * Recommendation realism engine — TRUSTED / GOOD / NEEDS_REVIEW (deterministic).
 */

import { buildVehicleIntelligence } from "../intelligence/buildVehicleIntelligence.js";
import {
  auditCompareSetCredibility,
  buildCompareScoreInsight,
} from "../utils/compareConfidence.js";
import {
  scoreComparePairQuality,
  buildCompareQualityReport,
} from "./compareQualityOps.js";

export const REALISM_STATUS = Object.freeze({
  TRUSTED: "TRUSTED",
  GOOD: "GOOD",
  NEEDS_REVIEW: "NEEDS_REVIEW",
});

function findCarsForPair(pairSlug, cars = []) {
  const parts = String(pairSlug || "")
    .toLowerCase()
    .split("-vs-")
    .filter(Boolean);
  const found = [];
  for (const part of parts) {
    const match =
      cars.find((c) => String(c.slug || "").toLowerCase() === part) ||
      cars.find((c) =>
        String(c.slug || "").toLowerCase().startsWith(`${part}-`)
      );
    if (match) found.push(match);
  }
  return found;
}

function scoreOwnershipRealism(vehicles = []) {
  if (!vehicles.length) return 0;
  let sum = 0;
  for (const car of vehicles) {
    const intel = buildVehicleIntelligence(car);
    const insight = buildCompareScoreInsight(car);
    let pts = 50;
    if (intel?.ownership?.hasData) pts += 25;
    if (insight.confidence === "high") pts += 20;
    else if (insight.confidence === "medium") pts += 10;
    if (car?.catalogMeta?.estimated === true) pts -= 15;
    sum += Math.max(0, Math.min(100, pts));
  }
  return Math.round(sum / vehicles.length);
}

function scoreChargingRealism(vehicles = []) {
  if (!vehicles.length) return 0;
  let sum = 0;
  for (const car of vehicles) {
    const intel = buildVehicleIntelligence(car);
    let pts = 45;
    if (intel?.charging?.hasData) pts += 35;
    if (intel?.charging?.dcTimeMin) pts += 10;
    if (intel?.charging?.practicalitySummary) pts += 10;
    sum += Math.max(0, Math.min(100, pts));
  }
  return Math.round(sum / vehicles.length);
}

function scoreRecommendationNuance(vehicles = [], issues = []) {
  let score = 78;
  if (issues.includes("contradictory_flat_scores")) score -= 22;
  if (issues.includes("duplicate_strengths")) score -= 18;
  if (issues.includes("weak_score_separation")) score -= 12;
  const pills = vehicles.flatMap((c) => c?.catalogMeta?.strongestAdvantages || []);
  if (pills.length >= 4) score += 5;
  return Math.max(0, Math.min(100, score));
}

function scoreConfidenceMaturity(vehicles = [], baseConfidence = "medium") {
  const insights = vehicles.map((c) => buildCompareScoreInsight(c));
  const low = insights.filter((i) => i.confidence === "low").length;
  const high = insights.filter((i) => i.confidence === "high").length;
  let score =
    baseConfidence === "high" ? 88 : baseConfidence === "medium" ? 68 : 48;
  score -= low * 12;
  score += high * 4;
  const missingData = vehicles.filter(
    (c) => (c?.catalogMeta?.dataQualityScore ?? 100) < 75
  ).length;
  score -= missingData * 8;
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * @param {object} params
 */
export function scoreRecommendationRealism({
  pairSlug = "",
  cars = [],
  trend = null,
} = {}) {
  const vehicles = findCarsForPair(pairSlug, cars);
  const base = scoreComparePairQuality({ pairSlug, cars, trend });
  const credibility = auditCompareSetCredibility(vehicles);
  const issues = [...base.issues];

  for (const w of credibility.warnings || []) {
    if (w.code === "large_score_gap" && !issues.includes("weak_score_separation")) {
      issues.push("unrealistic_score_gap");
    }
    if (w.code === "duplicate_strengths") {
      issues.push("contradictory_recommendation_logic");
    }
  }

  const ownershipRealismScore = scoreOwnershipRealism(vehicles);
  const chargingRealismScore = scoreChargingRealism(vehicles);
  const recommendationNuanceScore = scoreRecommendationNuance(vehicles, issues);
  const confidenceMaturityScore = scoreConfidenceMaturity(
    vehicles,
    base.recommendationConfidence
  );

  if (ownershipRealismScore < 55) issues.push("weak_ownership_realism");
  if (chargingRealismScore < 55) issues.push("weak_charging_practicality");
  if (confidenceMaturityScore < 50) issues.push("low_confidence_outcome");
  if (base.recommendationConfidence === "high" && confidenceMaturityScore < 60) {
    issues.push("overconfident_messaging_risk");
  }

  const realismScore = Math.round(
    ownershipRealismScore * 0.22 +
      chargingRealismScore * 0.22 +
      recommendationNuanceScore * 0.2 +
      confidenceMaturityScore * 0.2 +
      base.compareQualityScore * 0.16
  );

  let status = REALISM_STATUS.GOOD;
  if (
    realismScore >= 82 &&
    !issues.includes("overconfident_messaging_risk") &&
    ownershipRealismScore >= 65 &&
    chargingRealismScore >= 65
  ) {
    status = REALISM_STATUS.TRUSTED;
  } else if (
    realismScore < 58 ||
    issues.includes("incomplete_catalog_pair") ||
    issues.includes("overconfident_messaging_risk") ||
    issues.includes("contradictory_recommendation_logic")
  ) {
    status = REALISM_STATUS.NEEDS_REVIEW;
  }

  const humanReviewSuggested =
    status === REALISM_STATUS.NEEDS_REVIEW ||
    issues.includes("unrealistic_score_gap") ||
    issues.includes("overconfident_messaging_risk");

  const editorialHint = humanReviewSuggested
    ? "Human review suggested — align headline pick with charging/ownership realism."
    : status === REALISM_STATUS.GOOD
      ? "Acceptable — spot-check city vs highway copy on next editorial pass."
      : null;

  return {
    pairSlug,
    status,
    issues,
    realismScore,
    ownershipRealismScore,
    chargingRealismScore,
    recommendationNuanceScore,
    confidenceMaturityScore,
    humanReviewSuggested,
    editorialHint,
    vehicles: vehicles.map((c) => c.slug),
    traffic: base.traffic,
  };
}

export function buildRecommendationRealismReport(ctx = {}) {
  const quality = buildCompareQualityReport(ctx);
  const rows = quality.rows.map((row) =>
    scoreRecommendationRealism({
      pairSlug: row.pairSlug,
      cars: ctx.cars,
      trend: row.traffic,
    })
  );

  const statusCounts = {
    [REALISM_STATUS.TRUSTED]: 0,
    [REALISM_STATUS.GOOD]: 0,
    [REALISM_STATUS.NEEDS_REVIEW]: 0,
  };
  for (const r of rows) {
    statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
  }

  const clusters = {};
  for (const r of rows.filter((x) => x.status === REALISM_STATUS.NEEDS_REVIEW)) {
    const key = r.issues[0] || "other";
    clusters[key] = (clusters[key] || 0) + 1;
  }

  const weakClusters = Object.entries(clusters)
    .map(([issue, count]) => ({ issue, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const sorted = [...rows].sort((a, b) => b.realismScore - a.realismScore);

  return {
    rows: sorted,
    statusCounts,
    trusted: sorted.filter((r) => r.status === REALISM_STATUS.TRUSTED).slice(0, 6),
    needsReview: sorted
      .filter((r) => r.status === REALISM_STATUS.NEEDS_REVIEW)
      .slice(0, 8),
    humanReviewQueue: rows.filter((r) => r.humanReviewSuggested),
    weakRecommendationClusters: weakClusters,
    avgRealismScore:
      rows.length > 0
        ? Math.round(rows.reduce((s, r) => s + r.realismScore, 0) / rows.length)
        : 0,
    generatedAt: new Date().toISOString(),
  };
}
