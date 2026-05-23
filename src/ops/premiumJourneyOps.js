/**
 * Premium tier-1 EV journeys — PREMIUM_READY target ≥85% on active catalog families.
 */

import { buildVehicleIntelligence } from "../intelligence/buildVehicleIntelligence.js";
import { buildCompareScoreInsight } from "../utils/compareConfidence.js";
import { scoreCatalogHealth } from "./catalogHealthScore.js";
import { buildTier1FamilyMediaRows } from "./tier1MediaHealth.js";
import { PUBLIC_BETA_TIER1_FAMILIES } from "./publicBetaTier1.js";
import { extractFamilySlug } from "../utils/modelFamily.js";
import { buildRecommendationRealismReport } from "./recommendationRealismOps.js";
import { buildAuthorityDepthReport } from "./authorityDepthOps.js";

export const PREMIUM_JOURNEY_STATUS = Object.freeze({
  PREMIUM_READY: "PREMIUM_READY",
  GOOD: "GOOD",
  NEEDS_IMPROVEMENT: "NEEDS_IMPROVEMENT",
});

function carsForFamily(familySlug, cars = []) {
  return cars.filter((c) => extractFamilySlug(c.slug) === familySlug);
}

function avgRealismForFamily(familySlug, realismReport) {
  const rows = (realismReport?.rows || []).filter((r) =>
    String(r.pairSlug || "").includes(familySlug)
  );
  if (!rows.length) return null;
  return Math.round(
    rows.reduce((s, r) => s + r.realismScore, 0) / rows.length
  );
}

/**
 * @param {object} params
 */
export function scorePremiumJourney({
  familySlug,
  label,
  cars = [],
  mediaRow = null,
  traffic = {},
  realismReport = null,
  authorityDepth = null,
} = {}) {
  const variants = carsForFamily(familySlug, cars);
  const representative = variants[0] || null;
  const inCatalog = variants.length > 0;
  const catalogReady = !familySlug.includes("windsor") || inCatalog;

  const health = representative
    ? scoreCatalogHealth(representative)
    : { status: "NEEDS_REVIEW" };
  const intel = representative ? buildVehicleIntelligence(representative) : null;
  const insight = representative
    ? buildCompareScoreInsight(representative)
    : { confidence: "low" };

  const mediaQuality = inCatalog ? mediaRow?.completenessPercent ?? 0 : 0;
  const compareQuality =
    inCatalog && health.status !== "NEEDS_REVIEW"
      ? variants.length >= 2
        ? 92
        : 75
      : 0;
  const trustCompleteness =
    insight.confidence === "high" ? 90 : insight.confidence === "medium" ? 72 : 48;
  const guideSupport =
    authorityDepth?.byFamily?.[familySlug]?.guideSupportScore ?? 55;
  const leadReadiness = inCatalog && health.status !== "NEEDS_REVIEW" ? 82 : 30;
  const recommendationRealism =
    avgRealismForFamily(familySlug, realismReport) ?? (inCatalog ? 55 : 0);
  const seoMaturity = inCatalog && representative?.catalogMeta?.seoReady !== false ? 80 : 45;
  const ownershipIntelligence = intel?.ownership?.hasData
    ? intel?.charging?.hasData
      ? 88
      : 72
    : inCatalog
      ? 42
      : 0;

  const composite = inCatalog
    ? Math.round(
        mediaQuality * 0.16 +
          compareQuality * 0.14 +
          trustCompleteness * 0.14 +
          guideSupport * 0.1 +
          leadReadiness * 0.1 +
          recommendationRealism * 0.16 +
          seoMaturity * 0.08 +
          ownershipIntelligence * 0.12
      )
    : 0;

  let status = PREMIUM_JOURNEY_STATUS.NEEDS_IMPROVEMENT;
  if (
    inCatalog &&
    catalogReady &&
    composite >= 85 &&
    mediaQuality >= 75 &&
    recommendationRealism >= 70
  ) {
    status = PREMIUM_JOURNEY_STATUS.PREMIUM_READY;
  } else if (inCatalog && composite >= 68) {
    status = PREMIUM_JOURNEY_STATUS.GOOD;
  }

  return {
    familySlug,
    label,
    status,
    inCatalog,
    catalogReady,
    compositeScore: composite,
    mediaQuality,
    compareQuality,
    trustCompleteness,
    guideSupport,
    leadReadiness,
    recommendationRealism,
    seoMaturity,
    ownershipIntelligence,
    variantCount: variants.length,
    hints: buildPremiumHints({
      inCatalog,
      mediaQuality,
      recommendationRealism,
      intel,
      status,
    }),
  };
}

function buildPremiumHints({ inCatalog, mediaQuality, recommendationRealism, intel, status }) {
  const hints = [];
  if (!inCatalog) hints.push("Awaiting catalog variants");
  if (mediaQuality < 75) hints.push("Raise manifest media completeness to 75%+");
  if (recommendationRealism < 70) hints.push("Tune compare pairs involving this family");
  if (!intel?.charging?.hasData) hints.push("Complete charging practicality intelligence");
  if (!intel?.ownership?.hasData) hints.push("Complete ownership cost intelligence");
  if (status !== PREMIUM_JOURNEY_STATUS.PREMIUM_READY) {
    hints.push("Target PREMIUM_READY: composite ≥85 with media ≥75%");
  }
  return hints;
}

export function buildPremiumJourneyReport(ctx = {}) {
  const realismReport = buildRecommendationRealismReport(ctx);
  const authorityDepth = buildAuthorityDepthReport(ctx);
  const mediaRows = buildTier1FamilyMediaRows();
  const mediaBySlug = Object.fromEntries(mediaRows.map((r) => [r.familySlug, r]));

  const rows = PUBLIC_BETA_TIER1_FAMILIES.map(({ slug, label }) =>
    scorePremiumJourney({
      familySlug: slug,
      label,
      cars: ctx.cars,
      mediaRow: mediaBySlug[slug],
      traffic: ctx.traffic,
      realismReport,
      authorityDepth,
    })
  ).sort((a, b) => b.compositeScore - a.compositeScore);

  const active = rows.filter((r) => r.inCatalog);
  const statusCounts = {
    [PREMIUM_JOURNEY_STATUS.PREMIUM_READY]: 0,
    [PREMIUM_JOURNEY_STATUS.GOOD]: 0,
    [PREMIUM_JOURNEY_STATUS.NEEDS_IMPROVEMENT]: 0,
  };
  for (const r of rows) {
    statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
  }

  const premiumReadyPct =
    active.length > 0
      ? Math.round(
          (statusCounts[PREMIUM_JOURNEY_STATUS.PREMIUM_READY] / active.length) * 100
        )
      : 0;

  return {
    rows,
    statusCounts,
    activeCount: active.length,
    premiumReadyPct,
    goalMet: premiumReadyPct >= 85,
    premiumReady: rows.filter(
      (r) => r.status === PREMIUM_JOURNEY_STATUS.PREMIUM_READY
    ),
    needsWork: rows.filter(
      (r) => r.status === PREMIUM_JOURNEY_STATUS.NEEDS_IMPROVEMENT
    ),
    generatedAt: new Date().toISOString(),
  };
}
