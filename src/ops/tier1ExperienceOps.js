/**
 * Tier-1 EV experience scoring — PREMIUM_READY / GOOD / NEEDS_IMPROVEMENT.
 */

import { buildVehicleIntelligence } from "../intelligence/buildVehicleIntelligence.js";
import { buildCompareScoreInsight } from "../utils/compareConfidence.js";
import { scoreCatalogHealth } from "./catalogHealthScore.js";
import { buildTier1FamilyMediaRows } from "./tier1MediaHealth.js";
import { PUBLIC_BETA_TIER1_FAMILIES } from "./publicBetaTier1.js";
import { extractFamilySlug } from "../utils/modelFamily.js";

export const TIER1_EXPERIENCE_STATUS = Object.freeze({
  PREMIUM_READY: "PREMIUM_READY",
  GOOD: "GOOD",
  NEEDS_IMPROVEMENT: "NEEDS_IMPROVEMENT",
});

function carsForFamily(familySlug, cars = []) {
  return cars.filter(
    (c) => extractFamilySlug(c.slug) === familySlug
  );
}

function trafficScoreForFamily(familySlug, traffic = {}) {
  const slug = familySlug.toLowerCase();
  const views =
    (traffic.topViewedEvs || []).find(
      (r) => String(r.label || "").toLowerCase().includes(slug)
    )?.count || 0;
  const compareHits = (traffic.topComparePages || []).filter((r) =>
    String(r.label || "").includes(slug)
  ).length;
  const leadHits = (traffic.topConvertingPages || []).filter((r) =>
    String(r.label || "").includes(slug)
  ).length;
  return views * 2 + compareHits * 8 + leadHits * 12;
}

/**
 * @param {object} params
 */
export function scoreTier1Experience({
  familySlug,
  label = familySlug,
  cars = [],
  mediaRow = null,
  traffic = {},
} = {}) {
  const variants = carsForFamily(familySlug, cars);
  const representative = variants[0] || null;
  const inCatalog = variants.length > 0;

  const health = representative
    ? scoreCatalogHealth(representative)
    : { status: "NEEDS_REVIEW", reasons: ["Not in live catalog"] };

  const insight = representative
    ? buildCompareScoreInsight(representative)
    : { confidence: "low" };
  const intel = representative
    ? buildVehicleIntelligence(representative)
    : null;

  const mediaCompleteness = mediaRow?.completenessPercent ?? 0;
  const imageCompleteness = inCatalog
    ? mediaCompleteness >= 75
      ? 90
      : mediaCompleteness >= 50
        ? 65
        : 40
    : 0;

  const compareReadiness = inCatalog
    ? health.status !== "NEEDS_REVIEW" && variants.length >= 1
      ? variants.length >= 2
        ? 95
        : 78
      : 45
    : 0;

  const trustCompleteness = inCatalog
    ? insight.confidence === "high"
      ? 92
      : insight.confidence === "medium"
        ? 72
        : 48
    : 0;

  const leadReadiness = inCatalog && health.status !== "NEEDS_REVIEW" ? 80 : 35;

  const seoMaturity = inCatalog
    ? representative?.catalogMeta?.seoReady !== false
      ? 82
      : 58
    : 0;

  const recommendationConfidence =
    insight.confidence === "high" ? 88 : insight.confidence === "medium" ? 68 : 42;

  const ownershipRealism = intel?.ownership?.hasData
    ? intel?.charging?.hasData
      ? 88
      : 70
    : inCatalog
      ? 45
      : 0;

  const composite = inCatalog
    ? Math.round(
        compareReadiness * 0.2 +
          imageCompleteness * 0.18 +
          trustCompleteness * 0.18 +
          leadReadiness * 0.12 +
          seoMaturity * 0.1 +
          recommendationConfidence * 0.12 +
          ownershipRealism * 0.1
      )
    : 0;

  let status = TIER1_EXPERIENCE_STATUS.NEEDS_IMPROVEMENT;
  if (inCatalog && composite >= 82 && imageCompleteness >= 75) {
    status = TIER1_EXPERIENCE_STATUS.PREMIUM_READY;
  } else if (inCatalog && composite >= 65) {
    status = TIER1_EXPERIENCE_STATUS.GOOD;
  }

  const priorityScore = trafficScoreForFamily(familySlug, traffic);

  return {
    familySlug,
    label,
    status,
    inCatalog,
    variantCount: variants.length,
    compositeScore: composite,
    compareReadiness,
    imageCompleteness,
    trustCompleteness,
    leadReadiness,
    seoMaturity,
    recommendationConfidence,
    ownershipRealism,
    catalogHealth: health.status,
    priorityScore,
    hints: buildTier1Hints({
      inCatalog,
      mediaRow,
      health,
      insight,
      intel,
    }),
  };
}

function buildTier1Hints({ inCatalog, mediaRow, health, insight, intel }) {
  const hints = [];
  if (!inCatalog) hints.push("Add catalog variants for this family");
  if (mediaRow && mediaRow.completenessPercent < 75) {
    hints.push("Complete hero + compare + gallery manifest images");
  }
  if (health?.status === "NEEDS_REVIEW") {
    hints.push(`Catalog: ${(health.reasons || []).join("; ") || "needs review"}`);
  }
  if (insight.confidence === "low") {
    hints.push("Publish or verify specs to raise recommendation confidence");
  }
  if (intel && !intel.charging?.hasData) {
    hints.push("Charging practicality data incomplete");
  }
  if (intel && !intel.ownership?.hasData) {
    hints.push("Ownership cost signals incomplete");
  }
  return hints;
}

export function buildTier1ExperienceReport(ctx = {}) {
  const cars = ctx.cars || [];
  const traffic = ctx.traffic || {};
  const mediaRows = buildTier1FamilyMediaRows();
  const mediaBySlug = Object.fromEntries(
    mediaRows.map((r) => [r.familySlug, r])
  );

  const rows = PUBLIC_BETA_TIER1_FAMILIES.map(({ slug, label }) =>
    scoreTier1Experience({
      familySlug: slug,
      label,
      cars,
      mediaRow: mediaBySlug[slug],
      traffic,
    })
  ).sort((a, b) => b.priorityScore - a.priorityScore);

  const statusCounts = {
    [TIER1_EXPERIENCE_STATUS.PREMIUM_READY]: 0,
    [TIER1_EXPERIENCE_STATUS.GOOD]: 0,
    [TIER1_EXPERIENCE_STATUS.NEEDS_IMPROVEMENT]: 0,
  };
  for (const r of rows) {
    statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
  }

  const inCatalogRows = rows.filter((r) => r.inCatalog);
  const avgComposite =
    inCatalogRows.length > 0
      ? Math.round(
          inCatalogRows.reduce((s, r) => s + r.compositeScore, 0) /
            inCatalogRows.length
        )
      : 0;

  return {
    rows,
    statusCounts,
    avgComposite,
    premiumReady: rows.filter(
      (r) => r.status === TIER1_EXPERIENCE_STATUS.PREMIUM_READY
    ),
    needsImprovement: rows.filter(
      (r) => r.status === TIER1_EXPERIENCE_STATUS.NEEDS_IMPROVEMENT
    ),
    mediaCoveragePercent: Math.round(
      (mediaRows.filter((m) => m.completenessPercent >= 75).length /
        Math.max(mediaRows.length, 1)) *
        100
    ),
    generatedAt: new Date().toISOString(),
  };
}
