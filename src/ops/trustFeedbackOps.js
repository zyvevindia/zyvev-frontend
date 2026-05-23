/**
 * Trust feedback intelligence — converts doubt signals into ops clusters.
 */

import { listUsageLearningEvents } from "./usageLearningBuffer.js";
import { aggregateCompareBehavior } from "./behavioralTrustOps.js";
import { buildRecommendationMaturityReport } from "./recommendationMaturityOps.js";
import { buildOwnershipRealismReport } from "./ownershipRealismOps.js";
import { buildChargingPracticalityReport } from "./chargingPracticalityOps.js";
import { buildBehavioralIntelligenceReport } from "./behavioralIntelligenceOps.js";
import { buildCompareQualityReport } from "./compareQualityOps.js";
import { buildMediaStagingReport } from "./mediaStagingOps.js";
import { buildCompareCalibrationReport } from "./compareCalibrationOps.js";
import { buildFreshnessAutomationReport } from "./catalogFreshnessAutomation.js";
import { buildPerformanceReliabilityReport } from "./performanceReliabilityOps.js";

function pairKeyFromPath(path = "") {
  const m = String(path).match(/\/compare\/([^?#/]+)/i);
  return m ? m[1].toLowerCase() : "";
}

function countByPair(events, type) {
  const map = {};
  for (const e of events) {
    if (e.type !== type) continue;
    const slug =
      e.meta?.pairSlug ||
      pairKeyFromPath(e.meta?.sourcePage) ||
      "_unknown";
    map[slug] = (map[slug] || 0) + 1;
  }
  return Object.entries(map)
    .map(([pairSlug, count]) => ({ pairSlug, count }))
    .sort((a, b) => b.count - a.count);
}

function doubtClusters(events) {
  const byPair = countByPair(events, "recommendation_doubted");
  const themes = {};
  for (const e of events.filter((x) => x.type === "recommendation_doubted")) {
    const reason = e.meta?.reason || "usage_unclear";
    themes[reason] = (themes[reason] || 0) + 1;
  }
  return {
    byPair: byPair.slice(0, 12),
    themes: Object.entries(themes)
      .map(([theme, count]) => ({ theme, count }))
      .sort((a, b) => b.count - a.count),
  };
}

function switchAfterDoubt(events) {
  let switches = 0;
  const bySession = {};
  for (const e of events) {
    const sid = e.meta?.sessionId || "default";
    if (!bySession[sid]) bySession[sid] = [];
    bySession[sid].push(e);
  }
  for (const list of Object.values(bySession)) {
    let doubted = false;
    for (const e of list) {
      if (e.type === "recommendation_doubted") doubted = true;
      if (doubted && e.type === "compare_started") {
        switches += 1;
        doubted = false;
      }
    }
  }
  return switches;
}

function trustFrictionScore(global, doubtCount, abandonAfterGuidance) {
  const started = global.compare_started || 1;
  const doubtRate = doubtCount / started;
  const abandonRate = (abandonAfterGuidance || 0) / started;
  const tooltipRate = (global.trust_tooltip_opened || 0) / started;
  return Math.round(
    Math.min(100, doubtRate * 120 + abandonRate * 80 + tooltipRate * 30)
  );
}

/**
 * @param {object} ctx
 */
export function buildTrustFeedbackReport(ctx = {}) {
  const events = listUsageLearningEvents();
  const { global, byPair } = aggregateCompareBehavior(events);
  const maturity = buildRecommendationMaturityReport(ctx);
  const ownership = buildOwnershipRealismReport(ctx);
  const charging = buildChargingPracticalityReport(ctx);
  const behavioral = buildBehavioralIntelligenceReport(ctx);
  const compareQuality = buildCompareQualityReport(ctx);

  const doubt = doubtClusters(events);
  const abandonAfterGuidance = countByPair(
    events,
    "compare_abandon_after_guidance"
  );
  const compareSwitchAfterDoubt = switchAfterDoubt(events);

  const doubtCount = events.filter(
    (e) => e.type === "recommendation_doubted"
  ).length;

  const confusingPairs = Object.entries(byPair)
    .filter(([, row]) => {
      const started = row.started || 0;
      return (
        started >= 2 &&
        (row.abandoned > row.completed ||
          row.tooltips > started)
      );
    })
    .map(([pairSlug, row]) => ({
      pairSlug,
      started: row.started,
      abandoned: row.abandoned,
      tooltips: row.tooltips,
    }))
    .sort((a, b) => b.abandoned - a.abandoned)
    .slice(0, 10);

  const weakOwnershipGroups = ownership.rows
    .filter(
      (r) =>
        r.flags?.length > 0 ||
        r.status === "NEEDS_REVIEW" ||
        r.status === "LOW_CONFIDENCE"
    )
    .slice(0, 10);

  const chargingConfusion = charging.rows
    .filter((r) => r.flags?.length >= 2)
    .slice(0, 8);

  const volatilityHotspots = maturity.rows
    .filter((r) => r.trustVolatility >= 50)
    .slice(0, 10);

  const lowConfidenceJourneys = compareQuality.rows
    .filter((r) => r.status === "NEEDS_REVIEW")
    .slice(0, 8);

  const recommendationConfidenceGap = Math.round(
    Math.max(
      0,
      (maturity.statusCounts?.MATURE ?? 0) +
        (maturity.statusCounts?.TRUSTED ?? 0) -
        doubt.byPair.length * 2
    )
  );

  const compareRealismDisagreement = maturity.immatureRecommendationPairs
    .filter((p) =>
      p.flags?.includes("unrealistic_compare_separation") ||
      p.flags?.includes("contradictory_ownership_suggestions")
    )
    .length;

  const friction = trustFrictionScore(
    global,
    doubtCount,
    abandonAfterGuidance.reduce((n, r) => n + r.count, 0)
  );

  const overconfidentDistrusted = maturity.rows.filter(
    (r) =>
      r.recommendationMaturityScore >= 70 &&
      doubt.byPair.some((d) => d.pairSlug.includes(String(r.slug || "")))
  );

  const highTrafficLowTrust = maturity.weakConfidenceHighTraffic || [];

  return {
    trustFrictionScore: friction,
    recommendationConfidenceGap,
    compareRealismDisagreement,
    doubtClusters: doubt,
    compareSwitchAfterDoubt,
    mostDoubtedComparePairs: doubt.byPair,
    abandonedAfterGuidance: abandonAfterGuidance.slice(0, 10),
    weakestMaturityClusters: maturity.immatureRecommendationPairs.slice(0, 10),
    trustVolatilityHotspots: volatilityHotspots,
    confusingComparePairs: confusingPairs,
    weakOwnershipRealismGroups: weakOwnershipGroups,
    chargingPracticalityConfusion: chargingConfusion,
    lowConfidenceTrustJourneys: lowConfidenceJourneys,
    overconfidentButDistrusted: overconfidentDistrusted.slice(0, 6),
    highTrafficLowTrust,
    guidanceEngagementQuality: behavioral.guidanceEngagement ?? 0,
    compareConfusionTrend: behavioral.recommendationStabilityTrend,
    guidanceConfusionSpikes:
      behavioral.confusionIndicators?.includes(
        "abandon_after_guidance_exceeds_completion"
      ) ?? false,
    generatedAt: new Date().toISOString(),
    exportMeta: {
      reportType: "trust-feedback",
      version: 1,
      generatedAt: new Date().toISOString(),
      reviewOwner: "trust-ops",
    },
  };
}

/**
 * Public beta cockpit cards — grouped ops navigation with severity.
 */
export function buildPublicBetaCockpit(ctx = {}) {
  const trustFeedback = buildTrustFeedbackReport(ctx);
  const maturity = buildRecommendationMaturityReport(ctx);
  const ownership = buildOwnershipRealismReport(ctx);
  const behavioral = buildBehavioralIntelligenceReport(ctx);
  const mediaStaging = buildMediaStagingReport();
  const calibration = buildCompareCalibrationReport(ctx);
  const freshness = buildFreshnessAutomationReport({
    cars: ctx.cars,
    traffic: ctx.traffic,
  });
  const perf = buildPerformanceReliabilityReport({
    ...ctx,
    freshnessEscalations:
      freshness.queue?.filter((q) => q.escalated)?.length ?? 0,
  });

  const needsReviewCount =
    (ownership.statusCounts?.NEEDS_REVIEW ?? 0) +
    (ownership.statusCounts?.LOW_CONFIDENCE ?? 0) +
    (maturity.statusCounts?.NEEDS_REVIEW ?? 0) +
    (maturity.statusCounts?.LOW_CONFIDENCE ?? 0);

  const highRiskClusters =
    trustFeedback.weakestMaturityClusters.length +
    (behavioral.weakRecommendationClusters?.length ?? 0);

  const mediaAlerts = perf.mediaRegressionAlert ? 1 : 0;
  const weakOwnership = ownership.weakApartmentPracticality?.length ?? 0;
  const lowConfidenceCompare =
    calibration.needsEditorial?.length ??
    behavioral.lowTrustComparePairs?.length ??
    0;

  const cards = [
    {
      id: "needs-review",
      label: "Needs review now",
      count: needsReviewCount,
      severity: needsReviewCount > 5 ? "high" : needsReviewCount > 0 ? "medium" : "low",
      summary: `${needsReviewCount} vehicles or maturity rows need editorial review`,
      to: "/admin/ownership-intelligence",
      group: "trust",
    },
    {
      id: "high-risk-clusters",
      label: "High-risk recommendation clusters",
      count: highRiskClusters,
      severity: highRiskClusters > 3 ? "high" : "medium",
      summary: "Immature compare pairs and weak recommendation clusters",
      to: "/admin/recommendation-maturity",
      group: "trust",
    },
    {
      id: "trust-feedback",
      label: "Trust feedback & doubt",
      count: trustFeedback.mostDoubtedComparePairs.length,
      severity: trustFeedback.trustFrictionScore > 45 ? "high" : "low",
      summary: `Friction score ${trustFeedback.trustFrictionScore} — doubt and guidance signals`,
      to: "/admin/trust-feedback",
      group: "trust",
    },
    {
      id: "media-regression",
      label: "Media regression alerts",
      count: mediaAlerts,
      severity: mediaAlerts ? "high" : "low",
      summary: mediaAlerts
        ? "Image fallback or payload regression detected"
        : "No media regression this week",
      to: "/admin/media-health",
      group: "media",
    },
    {
      id: "weak-ownership",
      label: "Weak ownership realism",
      count: weakOwnership,
      severity: weakOwnership > 4 ? "medium" : "low",
      summary: "Apartment or highway practicality flags",
      to: "/admin/ownership-intelligence",
      group: "ownership",
    },
    {
      id: "low-confidence-compare",
      label: "Low-confidence compare hotspots",
      count: lowConfidenceCompare,
      severity: lowConfidenceCompare > 2 ? "medium" : "low",
      summary: "Pairs needing calibration or behavioral review",
      to: "/admin/compare-calibration",
      group: "compare",
    },
  ];

  const navGroups = [
    {
      title: "Intelligence",
      links: [
        { to: "/admin/catalog-intelligence", label: "Catalog intelligence" },
        { to: "/admin/ownership-intelligence", label: "Ownership intelligence" },
        { to: "/admin/recommendation-maturity", label: "Recommendation maturity" },
        { to: "/admin/behavioral-intelligence", label: "Behavioral intelligence" },
        { to: "/admin/trust-feedback", label: "Trust feedback" },
      ],
    },
    {
      title: "Media & catalog",
      links: [
        { to: "/admin/media-health", label: "Media health" },
        { to: "/admin/media-staging", label: "Media staging" },
        { to: "/admin/catalog-freshness", label: "Catalog freshness" },
      ],
    },
    {
      title: "Compare",
      links: [
        { to: "/admin/compare-calibration", label: "Compare calibration" },
      ],
    },
  ];

  return {
    cards,
    navGroups,
    trustDecayShortcuts: maturity.trustDecayAlerts || [],
    weakClusterShortcuts: trustFeedback.weakestMaturityClusters.slice(0, 5),
    unresolvedAlertCount:
      needsReviewCount + highRiskClusters + mediaAlerts + mediaStaging.unresolvedFamilies?.length,
    trustFeedback,
    generatedAt: new Date().toISOString(),
  };
}
