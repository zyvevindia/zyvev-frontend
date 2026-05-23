/**
 * Compare quality learning — STRONG / ACCEPTABLE / NEEDS_REVIEW (deterministic).
 */

import {
  auditCompareSetCredibility,
  dedupeComparePills,
  buildCompareScoreInsight,
} from "../utils/compareConfidence.js";

export const COMPARE_QUALITY_STATUS = Object.freeze({
  STRONG: "STRONG",
  ACCEPTABLE: "ACCEPTABLE",
  NEEDS_REVIEW: "NEEDS_REVIEW",
});

function parsePairSlugs(pairSlug = "") {
  const s = String(pairSlug || "").trim().toLowerCase();
  if (!s.includes("-vs-")) return [s].filter(Boolean);
  return s.split("-vs-").map((p) => p.trim()).filter(Boolean);
}

function findCarsForPair(pairSlug, cars = []) {
  const parts = parsePairSlugs(pairSlug);
  const found = [];
  for (const part of parts) {
    const match =
      cars.find((c) => String(c.slug || "").toLowerCase() === part) ||
      cars.find((c) => String(c.slug || "").toLowerCase().startsWith(`${part}-`));
    if (match) found.push(match);
  }
  return found;
}

function resolveBetterAtPills(car) {
  const meta = car?.catalogMeta || {};
  const fromAdvantages = (meta.strongestAdvantages || [])
    .map((item) =>
      typeof item === "string" ? item : item?.label || item?.title
    )
    .filter(Boolean);
  return dedupeComparePills(fromAdvantages);
}

/**
 * Score a single compare pair using catalog + traffic signals.
 */
export function scoreComparePairQuality({
  pairSlug = "",
  cars = [],
  trend = null,
} = {}) {
  const vehicles = findCarsForPair(pairSlug, cars);
  const issues = [];
  const credibility = auditCompareSetCredibility(vehicles);
  const scores = vehicles.map((c) => buildCompareScoreInsight(c));

  if (vehicles.length < 2) {
    issues.push("incomplete_catalog_pair");
  }
  for (const w of credibility.warnings || []) {
    issues.push(w.code);
  }

  const allPills = vehicles.flatMap(resolveBetterAtPills);
  if (allPills.length !== new Set(allPills.map((p) => p.toLowerCase())).size) {
    issues.push("duplicate_pills_within_vehicle");
  }

  const lowConfidence = scores.some((s) => s.confidence === "low");
  if (lowConfidence) issues.push("low_confidence_scores");

  const started = Number(trend?.started ?? 0);
  const completionRate = Number(trend?.completionRate);
  if (started >= 6 && !Number.isNaN(completionRate) && completionRate < 45) {
    issues.push("low_engagement");
  }
  if (started >= 6 && !Number.isNaN(completionRate) && completionRate < 30) {
    issues.push("high_bounce_heuristic");
  }

  const scoreValues = scores.map((s) => s.score).filter((n) => n != null);
  if (scoreValues.length >= 2) {
    const gap = Math.max(...scoreValues) - Math.min(...scoreValues);
    if (gap > 35) issues.push("weak_score_separation");
    if (gap < 5) issues.push("contradictory_flat_scores");
  }

  let status = COMPARE_QUALITY_STATUS.STRONG;
  if (
    issues.includes("incomplete_catalog_pair") ||
    issues.includes("duplicate_strengths") ||
    issues.includes("low_confidence_scores") ||
    issues.includes("high_bounce_heuristic")
  ) {
    status = COMPARE_QUALITY_STATUS.NEEDS_REVIEW;
  } else if (issues.length > 0) {
    status = COMPARE_QUALITY_STATUS.ACCEPTABLE;
  }

  const credibilityScore =
    status === COMPARE_QUALITY_STATUS.STRONG
      ? 85
      : status === COMPARE_QUALITY_STATUS.ACCEPTABLE
        ? 65
        : 40;

  const compareQualityScore = Math.max(
    0,
    credibilityScore -
      issues.filter((i) =>
        ["low_engagement", "weak_score_separation"].includes(i)
      ).length *
        8
  );

  return {
    pairSlug,
    status,
    issues,
    credibilityScore,
    compareQualityScore,
    recommendationConfidence:
      status === COMPARE_QUALITY_STATUS.STRONG
        ? "high"
        : status === COMPARE_QUALITY_STATUS.ACCEPTABLE
          ? "medium"
          : "low",
    vehicles: vehicles.map((c) => c.slug),
    traffic: trend
      ? { started, completionRate }
      : null,
  };
}

/**
 * @param {object} ctx from loadPostLaunchOpsContext
 */
export function buildCompareQualityReport(ctx = {}) {
  const cars = ctx.cars || [];
  const trends = ctx.traffic?.compareTrends || [];
  const slugsSeen = new Set();

  const rows = [];
  for (const trend of trends) {
    const slug = String(trend.slug || trend.pairSlug || "").trim();
    if (!slug || slugsSeen.has(slug)) continue;
    slugsSeen.add(slug);
    rows.push(
      scoreComparePairQuality({ pairSlug: slug, cars, trend })
    );
  }

  for (const item of ctx.compareImprovement || []) {
    const slug = String(item.pairSlug || "").trim();
    if (!slug || slugsSeen.has(slug)) continue;
    slugsSeen.add(slug);
    rows.push(scoreComparePairQuality({ pairSlug: slug, cars }));
  }

  const statusCounts = {
    [COMPARE_QUALITY_STATUS.STRONG]: 0,
    [COMPARE_QUALITY_STATUS.ACCEPTABLE]: 0,
    [COMPARE_QUALITY_STATUS.NEEDS_REVIEW]: 0,
  };
  for (const r of rows) {
    statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
  }

  return {
    rows: rows.sort((a, b) => {
      const order = { NEEDS_REVIEW: 0, ACCEPTABLE: 1, STRONG: 2 };
      return (order[a.status] ?? 9) - (order[b.status] ?? 9);
    }),
    statusCounts,
    generatedAt: new Date().toISOString(),
  };
}
