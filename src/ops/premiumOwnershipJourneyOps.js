/**
 * Premium ownership journeys — PREMIUM_READY target ≥90% on active tier-1 EVs.
 */

import { scoreCatalogHealth } from "./catalogHealthScore.js";
import { buildTier1FamilyMediaRows } from "./tier1MediaHealth.js";
import { PUBLIC_BETA_TIER1_FAMILIES } from "./publicBetaTier1.js";
import { extractFamilySlug } from "../utils/modelFamily.js";
import { buildRecommendationRealismReport } from "./recommendationRealismOps.js";
import { buildAuthorityDepthReport } from "./authorityDepthOps.js";
import {
  scoreOwnershipRealismForCar,
  scoreChargingRealismForCar,
  scoreTrustCompleteness,
} from "./ownershipIntelligenceOps.js";

export const PREMIUM_OWNERSHIP_STATUS = Object.freeze({
  PREMIUM_READY: "PREMIUM_READY",
  GOOD: "GOOD",
  NEEDS_IMPROVEMENT: "NEEDS_IMPROVEMENT",
});

const PREMIUM_READY_TARGET_PCT = 90;

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

export function scorePremiumOwnershipJourney({
  familySlug,
  label,
  cars = [],
  mediaRow = null,
  realismReport = null,
  authorityDepth = null,
} = {}) {
  const variants = carsForFamily(familySlug, cars);
  const representative = variants[0] || null;
  const inCatalog = variants.length > 0;

  const health = representative
    ? scoreCatalogHealth(representative)
    : { status: "NEEDS_REVIEW" };

  const own = representative
    ? scoreOwnershipRealismForCar(representative)
    : { ownershipRealismMaturity: 0, issues: [] };
  const chg = representative
    ? scoreChargingRealismForCar(representative)
    : { chargingRealismScore: 0, chargingPracticalityMaturity: 0, issues: [] };
  const trust = representative
    ? scoreTrustCompleteness(representative)
    : { trustCompleteness: 0, recommendationMaturity: 0 };

  const mediaQuality = inCatalog ? mediaRow?.completenessPercent ?? 0 : 0;
  const compareQuality =
    inCatalog && health.status !== "NEEDS_REVIEW"
      ? variants.length >= 2
        ? 94
        : 78
      : 0;
  const guideSupport =
    authorityDepth?.byFamily?.[familySlug]?.guideSupportScore ?? 55;
  const recommendationRealism =
    avgRealismForFamily(familySlug, realismReport) ?? (inCatalog ? 50 : 0);
  const seoMaturity =
    inCatalog && representative?.catalogMeta?.seoReady !== false ? 82 : 40;
  const leadReadiness =
    inCatalog && health.status !== "NEEDS_REVIEW" ? 85 : 28;

  const composite = inCatalog
    ? Math.round(
        mediaQuality * 0.12 +
          compareQuality * 0.1 +
          own.ownershipRealismMaturity * 0.18 +
          chg.chargingPracticalityMaturity * 0.18 +
          trust.trustCompleteness * 0.14 +
          guideSupport * 0.1 +
          trust.recommendationMaturity * 0.1 +
          recommendationRealism * 0.08
      )
    : 0;

  const ownershipIssues = [...own.issues, ...chg.issues];
  let status = PREMIUM_OWNERSHIP_STATUS.NEEDS_IMPROVEMENT;

  if (
    inCatalog &&
    composite >= 88 &&
    mediaQuality >= 80 &&
    own.ownershipRealismMaturity >= 72 &&
    chg.chargingPracticalityMaturity >= 72 &&
    trust.trustCompleteness >= 75 &&
    trust.recommendationMaturity >= 72
  ) {
    status = PREMIUM_OWNERSHIP_STATUS.PREMIUM_READY;
  } else if (inCatalog && composite >= 70) {
    status = PREMIUM_OWNERSHIP_STATUS.GOOD;
  }

  return {
    familySlug,
    label,
    status,
    inCatalog,
    compositeScore: composite,
    mediaQuality,
    compareQuality,
    ownershipRealism: own.ownershipRealismMaturity,
    ownershipRealismMaturity: own.ownershipRealismMaturity,
    practicalityConfidence: own.practicalityConfidence,
    ownershipNuanceScore: own.ownershipNuanceScore,
    chargingRealism: chg.chargingRealismScore,
    chargingRealismScore: chg.chargingRealismScore,
    chargingPracticalityMaturity: chg.chargingPracticalityMaturity,
    chargingTrustConfidence: chg.chargingTrustConfidence,
    trustCompleteness: trust.trustCompleteness,
    recommendationMaturity: trust.recommendationMaturity,
    guideSupport,
    leadReadiness,
    recommendationRealism,
    seoMaturity,
    variantCount: variants.length,
    ownershipIssues,
    hints: buildHints({ inCatalog, status, own, chg, trust, mediaQuality }),
  };
}

function buildHints({ inCatalog, status, own, chg, trust, mediaQuality }) {
  const hints = [];
  if (!inCatalog) hints.push("Catalog variants required");
  if (mediaQuality < 80) hints.push("Media roles ≥80% for premium ownership feel");
  if (own.ownershipRealismMaturity < 72) {
    hints.push("Deepen ownership realism — TCO, city/highway, family context");
  }
  if (chg.chargingPracticalityMaturity < 72) {
    hints.push("Complete AC/DC/apartment charging practicality");
  }
  if (trust.trustCompleteness < 75) hints.push("Raise trust strip + governance confidence");
  if (status !== PREMIUM_OWNERSHIP_STATUS.PREMIUM_READY) {
    hints.push(`Target ${PREMIUM_READY_TARGET_PCT}% PREMIUM_READY on active EVs`);
  }
  return hints;
}

export function buildPremiumOwnershipJourneyReport(ctx = {}) {
  const realismReport = buildRecommendationRealismReport(ctx);
  const authorityDepth = buildAuthorityDepthReport(ctx);
  const mediaRows = buildTier1FamilyMediaRows();
  const mediaBySlug = Object.fromEntries(mediaRows.map((r) => [r.familySlug, r]));

  const rows = PUBLIC_BETA_TIER1_FAMILIES.map(({ slug, label }) =>
    scorePremiumOwnershipJourney({
      familySlug: slug,
      label,
      cars: ctx.cars,
      mediaRow: mediaBySlug[slug],
      realismReport,
      authorityDepth,
    })
  ).sort((a, b) => b.compositeScore - a.compositeScore);

  const active = rows.filter((r) => r.inCatalog);
  const statusCounts = {
    [PREMIUM_OWNERSHIP_STATUS.PREMIUM_READY]: 0,
    [PREMIUM_OWNERSHIP_STATUS.GOOD]: 0,
    [PREMIUM_OWNERSHIP_STATUS.NEEDS_IMPROVEMENT]: 0,
  };
  for (const r of rows) {
    statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
  }

  const premiumReadyPct =
    active.length > 0
      ? Math.round(
          (statusCounts[PREMIUM_OWNERSHIP_STATUS.PREMIUM_READY] / active.length) *
            100
        )
      : 0;

  const weakOwnershipClusters = {};
  for (const r of rows) {
    for (const issue of r.ownershipIssues || []) {
      weakOwnershipClusters[issue] = (weakOwnershipClusters[issue] || 0) + 1;
    }
  }

  return {
    rows,
    statusCounts,
    activeCount: active.length,
    premiumReadyPct,
    goalMet: premiumReadyPct >= PREMIUM_READY_TARGET_PCT,
    targetPct: PREMIUM_READY_TARGET_PCT,
    premiumReady: rows.filter(
      (r) => r.status === PREMIUM_OWNERSHIP_STATUS.PREMIUM_READY
    ),
    needsWork: rows.filter(
      (r) => r.status === PREMIUM_OWNERSHIP_STATUS.NEEDS_IMPROVEMENT
    ),
    weakOwnershipClusters: Object.entries(weakOwnershipClusters)
      .map(([issue, count]) => ({ issue, count }))
      .sort((a, b) => b.count - a.count),
    avgOwnershipRealism:
      active.length > 0
        ? Math.round(
            active.reduce((s, r) => s + r.ownershipRealismMaturity, 0) /
              active.length
          )
        : 0,
    avgChargingRealism:
      active.length > 0
        ? Math.round(
            active.reduce((s, r) => s + r.chargingPracticalityMaturity, 0) /
              active.length
          )
        : 0,
    generatedAt: new Date().toISOString(),
  };
}
