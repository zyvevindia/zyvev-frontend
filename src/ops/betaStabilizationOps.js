/**
 * Public beta stabilization — weekly summaries and review queues from existing ops only.
 */

import { ensureArray } from "../utils/compareArrayUtils.js";
import { listUsageLearningEvents } from "./usageLearningBuffer.js";
import { aggregateCompareBehavior } from "./behavioralTrustOps.js";
import { buildBehavioralIntelligenceReport, getBehavioralIntelligenceWeeklySnapshots } from "./behavioralIntelligenceOps.js";
import { buildTrustFeedbackReport } from "./trustFeedbackOps.js";
import { buildCompareQualityReport } from "./compareQualityOps.js";
import { buildRecommendationMaturityReport, RECOMMENDATION_MATURITY_STATUS } from "./recommendationMaturityOps.js";
import { buildOwnershipRealismReport } from "./ownershipRealismOps.js";
import { buildChargingPracticalityReport } from "./chargingPracticalityOps.js";
import { buildTrustedConversionReport } from "./trustedConversionOps.js";
import { buildConversionInsightsReport } from "./conversionInsightsOps.js";
import { buildPerformanceReliabilityReport } from "./performanceReliabilityOps.js";
import { buildSeoAuthorityReport } from "./seoAuthorityOps.js";
import { getTrustedBetaWeeklySnapshots } from "./trustedBetaOps.js";
import { rankCompareDropOffHotspots } from "./trafficObservationOps.js";
import { buildGrowthLearningReport } from "./growthLearningOps.js";
import { buildRecommendationRefinementReport } from "./recommendationRefinementOps.js";
import { buildConversionRefinementReport } from "./conversionRefinementOps.js";
import { buildContentUsefulnessReport } from "./contentUsefulnessOps.js";
import { buildMediaPolishReport } from "../utils/mediaAudit.js";
import { buildAcquisitionCalibrationReport } from "./acquisitionCalibrationOps.js";
import { buildMarketValidationReport } from "./marketValidationOps.js";
import { buildAdoptionGrowthReport } from "./authorityDistributionOps.js";

const STABILIZATION_WEEKLY_KEY = "evsavari-beta-stabilization-weekly-v1";

function readWeekly() {
  try {
    const raw = localStorage.getItem(STABILIZATION_WEEKLY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeWeekly(arr) {
  try {
    localStorage.setItem(STABILIZATION_WEEKLY_KEY, JSON.stringify(arr.slice(0, 10)));
  } catch {
    /* quota */
  }
}

export function recordBetaStabilizationWeekly(snapshot) {
  const week = new Date().toISOString().slice(0, 10);
  const filtered = readWeekly().filter((s) => s.week !== week);
  writeWeekly([{ week, at: new Date().toISOString(), ...snapshot }, ...filtered]);
}

export function getBetaStabilizationWeeklySnapshots() {
  return readWeekly().slice(0, 8);
}

function countByType(events, type) {
  return events.filter((e) => e.type === type).length;
}

function guidanceOpens(events) {
  return events.filter((e) =>
    [
      "ownership_tooltip_opened",
      "compare_confidence_expanded",
      "suitability_guidance_opened",
      "charging_practicality_opened",
      "trust_tooltip_opened",
    ].includes(e.type)
  ).length;
}

function topCompareJourneys(ctx, events) {
  const { byPair } = aggregateCompareBehavior(events);
  return Object.entries(byPair)
    .filter(([slug]) => slug !== "_global_compare")
    .map(([pairSlug, row]) => ({
      pairSlug,
      started: row.started,
      completed: row.completed,
      abandoned: row.abandoned,
      doubted: row.doubted || 0,
      guidanceOpened: row.guidanceOpened || 0,
    }))
    .sort((a, b) => b.started - a.started)
    .slice(0, 10);
}

/**
 * Operational weekly summary — aggregates existing reports, no new scoring engines.
 */
export function buildBetaWeeklySummary(ctx = {}) {
  const events = listUsageLearningEvents();
  const behavioral = buildBehavioralIntelligenceReport(ctx);
  const trustFeedback = buildTrustFeedbackReport(ctx);
  const compareQuality = buildCompareQualityReport(ctx);
  const maturity = buildRecommendationMaturityReport(ctx);
  const ownership = buildOwnershipRealismReport(ctx);
  const charging = buildChargingPracticalityReport(ctx);
  const conversion = buildTrustedConversionReport(ctx);
  const conversionInsights = buildConversionInsightsReport(ctx);
  const dropoffs = rankCompareDropOffHotspots(ctx.compareTrends || []);

  const repeatedEv = behavioral.repeatedEvInterest || [];
  const compareCompletionTrend = behavioral.compareCompletionPct;
  const trustStabilityTrend = behavioral.recommendationStabilityTrend;

  const mostConfusing = trustFeedback.confusingComparePairs?.length
    ? trustFeedback.confusingComparePairs
  : behavioral.highBounceComparePairs?.map((pairSlug) => ({ pairSlug })) || [];

  const mostTrusted = compareQuality.rows
    .filter((r) => r.status === "STRONG" || r.status === "ACCEPTABLE")
    .sort((a, b) => b.credibilityScore - a.credibilityScore)
    .slice(0, 8);

  const highestOwnershipConfidence = [...ownership.rows]
    .sort((a, b) => b.ownershipRealismScore - a.ownershipRealismScore)
    .slice(0, 8)
    .map((r) => ({
      slug: r.slug,
      name: r.name,
      score: r.ownershipRealismScore,
      status: r.status,
    }));

  const weakestChargingJourneys = charging.rows
    .filter((r) => r.flags?.length > 0 || r.composite < 55)
    .slice(0, 8);

  const snapshot = {
    compareCompletionPct: compareCompletionTrend,
    trustStabilityTrend,
    doubtCount: countByType(events, "recommendation_doubted"),
    guidanceOpens: guidanceOpens(events),
    engagementQuality: behavioral.engagementQuality,
  };
  recordBetaStabilizationWeekly(snapshot);

  return {
    week: new Date().toISOString().slice(0, 10),
    topCompareJourneys: topCompareJourneys(ctx, events),
    highestConvertingComparePairs: behavioral.topConvertingComparePairs || [],
    highBounceComparePairs: behavioral.highBounceComparePairs || [],
    mostDoubtedRecommendations: trustFeedback.mostDoubtedComparePairs || [],
    mostOpenedTrustGuidance: {
      total: guidanceOpens(events),
      byType: {
        ownership: countByType(events, "ownership_tooltip_opened"),
        confidence: countByType(events, "compare_confidence_expanded"),
        suitability: countByType(events, "suitability_guidance_opened"),
        charging: countByType(events, "charging_practicality_opened"),
        tooltip: countByType(events, "trust_tooltip_opened"),
      },
    },
    repeatEvInterest: repeatedEv,
    compareCompletionTrend,
    trustStabilityTrend,
    mostConfusingComparePairs: mostConfusing.slice(0, 8),
    mostTrustedComparePairs: mostTrusted,
    highestOwnershipConfidenceEvs: highestOwnershipConfidence,
    weakestChargingPracticalityJourneys: weakestChargingJourneys,
    dropoffHotspots: dropoffs.slice(0, 6),
    weeklySnapshots: getBetaStabilizationWeeklySnapshots(),
    behavioralWeekly: getBehavioralIntelligenceWeeklySnapshots(),
    betaWeekly: getTrustedBetaWeeklySnapshots(),
    generatedAt: new Date().toISOString(),
    exportMeta: {
      reportType: "beta-weekly-summary",
      version: 1,
      generatedAt: new Date().toISOString(),
      reviewOwner: "beta-ops",
    },
  };
}

/**
 * Trust conversion signals — derived from existing conversion ops.
 */
export function buildTrustConversionSignals(ctx = {}) {
  const events = listUsageLearningEvents();
  const behavioral = buildBehavioralIntelligenceReport(ctx);
  const conversion = buildTrustedConversionReport(ctx);
  const insights = buildConversionInsightsReport(ctx);
  const { global } = aggregateCompareBehavior(events);

  const leadStarted = global.lead_started || 0;
  const leadSubmitted = global.lead_submitted || 0;
  const tooltips = global.trust_tooltip_opened || 0;
  const guidance =
    (global.ownership_tooltip_opened || 0) +
    (global.compare_confidence_expanded || 0);

  const compareLeadConfidenceTrend =
    behavioral.compareCompletionPct >= 50 && leadSubmitted >= leadStarted * 0.2
      ? "improving"
      : behavioral.compareCompletionPct < 35
        ? "weak"
        : "stable";

  const trustAssistedConversionIndicator =
    tooltips + guidance > 0 && leadSubmitted > 0
      ? Math.round(
          Math.min(100, ((tooltips + guidance) / Math.max(1, leadStarted)) * 40 + 30)
        )
      : null;

  const recommendationClarityIndicator = Math.max(
    0,
    100 -
      (countByType(events, "recommendation_doubted") || 0) * 8 -
      (global.compare_abandon_after_guidance || 0) * 6
  );

  const trustAssistedConversionQuality =
    trustAssistedConversionIndicator != null &&
    recommendationClarityIndicator >= 58
      ? "healthy"
      : trustAssistedConversionIndicator != null
        ? "developing"
        : "insufficient_signal";

  return {
    compareLeadConfidenceTrend,
    trustAssistedConversionIndicator,
    trustAssistedConversionQuality,
    recommendationClarityIndicator,
    recommendationAssistedLeadTrend:
      guidance > 0 && leadSubmitted > 0 ? compareLeadConfidenceTrend : "stable",
    weakCtaPaths: insights.weakCtaPages?.slice(0, 6) || [],
    abandonmentAfterGuidance: global.compare_abandon_after_guidance || 0,
    doubtFlows: countByType(events, "recommendation_doubted"),
    avgConversionTrust: conversion.avgConversionTrust,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Beta observation health checks for controlled growth.
 */
export function buildBetaObservationSummary(ctx = {}) {
  const stability = buildBetaStabilitySummary(ctx);
  const behavioral = buildBehavioralIntelligenceReport(ctx);
  const maturity = buildRecommendationMaturityReport(ctx);
  const ownership = buildOwnershipRealismReport(ctx);
  const weekly = getBetaStabilizationWeeklySnapshots();
  const prev = weekly[1];
  const cur = weekly[0];

  const recommendationStabilityTrend = behavioral.recommendationStabilityTrend;
  const trustQualityEvolution =
    stability.betaStabilityTrend === "improving"
      ? "improving"
      : stability.betaStabilityTrend === "declining"
        ? "watch"
        : "stable";
  const compareRealismEvolution = maturity.maturityTrend;
  const ownershipRealismImproving =
    cur?.compareCompletionPct != null &&
    prev?.compareCompletionPct != null &&
    ownership.trustedPct >= 60;

  const safeToScaleTraffic =
    stability.betaStabilityTrend !== "declining" &&
    behavioral.engagementQuality >= 50 &&
    stability.regressionEarlyWarning.length <= 1;

  const trustStabilityHealthy =
    trustQualityEvolution !== "watch" &&
    !behavioral.confusionIndicators?.includes("elevated_recommendation_doubt");

  const recommendationMaturityStable =
    maturity.maturityTrend !== "realism_regression" &&
    (maturity.statusCounts?.NEEDS_REVIEW ?? 0) +
      (maturity.statusCounts?.LOW_CONFIDENCE ?? 0) <
      5;

  return {
    betaObservationTrend: stability.betaStabilityTrend,
    recommendationStabilityTrend,
    trustQualityEvolution,
    compareRealismEvolution,
    operationalConfidenceEvolution: stability.operationalConfidenceTrend,
    growthQualityTrend: behavioral.engagementQuality >= 55 ? "healthy" : "building",
    safeToScaleTraffic,
    trustStabilityHealthy,
    recommendationMaturityStable,
    ownershipRealismImproving,
    trustCalibrationSnapshot: {
      engagementQuality: behavioral.engagementQuality,
      trustedMaturityPct: maturity.trustedPct,
      ownershipTrustedPct: ownership.trustedPct,
    },
    growthQualitySnapshot: {
      compareCompletionPct: behavioral.compareCompletionPct,
      guidanceEngagement: behavioral.guidanceEngagement,
    },
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Calibration review queues — filtered views of existing maturity/realism reports.
 */
export function buildCalibrationReviewQueues(ctx = {}) {
  const maturity = buildRecommendationMaturityReport(ctx);
  const ownership = buildOwnershipRealismReport(ctx);

  const calibrationReviewQueue = maturity.rows
    .filter(
      (r) =>
        r.status === RECOMMENDATION_MATURITY_STATUS.DEVELOPING ||
        r.humanReviewSuggested
    )
    .slice(0, 15);

  const unstableRecommendationQueue = ensureArray(maturity.comparePairs)
    .filter(
      (p) =>
        p.trustVolatility >= 45 ||
        p.flags?.includes("overconfident_but_distrusted")
    )
    .slice(0, 12);

  const weakRealismReviewQueue = ownership.rows
    .filter(
      (r) =>
        r.status === "NEEDS_REVIEW" ||
        r.status === "LOW_CONFIDENCE" ||
        r.flags?.length >= 2
    )
    .slice(0, 15);

  return {
    calibrationReviewQueue,
    unstableRecommendationQueue,
    weakRealismReviewQueue,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Regression early warning + beta stability trend.
 */
export function buildBetaStabilitySummary(ctx = {}) {
  const perf = buildPerformanceReliabilityReport(ctx);
  const behavioral = buildBehavioralIntelligenceReport(ctx);
  const seo = buildSeoAuthorityReport(ctx);
  const weekly = getTrustedBetaWeeklySnapshots();
  const prev = weekly[1];
  const current = weekly[0];

  const betaStabilityTrend =
    prev?.betaStabilityScore != null &&
    current?.betaStabilityScore != null &&
    current.betaStabilityScore < prev.betaStabilityScore - 8
      ? "declining"
      : prev?.betaStabilityScore != null &&
          current.betaStabilityScore > prev.betaStabilityScore + 5
        ? "improving"
        : "stable";

  const operationalConfidenceTrend =
    prev?.operationalConfidence != null &&
    current?.operationalConfidence != null &&
    current.operationalConfidence < prev.operationalConfidence - 6
      ? "watch"
      : "stable";

  const warnings = [];
  if (perf.mediaRegressionAlert) warnings.push("media_fallback_regression");
  if (perf.compareLatencyAlert) warnings.push("compare_latency");
  if (perf.ownershipIntelligencePerformanceWarnings?.length) {
    warnings.push(...perf.ownershipIntelligencePerformanceWarnings);
  }
  if (behavioral.confusionIndicators?.length) {
    warnings.push(...behavioral.confusionIndicators.slice(0, 3));
  }

  return {
    betaStabilityTrend,
    operationalConfidenceTrend,
    regressionEarlyWarning: warnings,
    performance: perf,
    seoAuthorityReadiness: seo.compareSeoMaturity,
    topicalAuthorityScore: seo.topicalAuthorityScore,
    generatedAt: new Date().toISOString(),
    releaseMeta: {
      phase: "controlled-public-beta-stabilization",
      generatedAt: new Date().toISOString(),
      betaStabilityTrend,
    },
  };
}

/**
 * Full stabilization bundle for public beta ops cockpit.
 */
/**
 * Operational maturity + weekly snapshot exports for controlled beta.
 */
export function buildOperationalMaturitySummary(ctx = {}) {
  const observation = buildBetaObservationSummary(ctx);
  const seo = buildSeoAuthorityReport(ctx);
  const refinement = buildRecommendationRefinementReport(ctx);
  const conversion = buildConversionRefinementReport(ctx);
  const weekly = buildBetaWeeklySummary(ctx);

  return {
    scalingReadinessEvolution: observation.safeToScaleTraffic
      ? "ready_with_monitoring"
      : "hold_acquisition",
    operationalMaturityTrend: observation.operationalConfidenceEvolution,
    trustStabilityTrend: observation.trustQualityEvolution,
    recommendationConfidenceEvolution: refinement.recommendationConfidenceDrift,
    authorityQualityTrend: seo.authorityQualityTrend || seo.authorityDepthTrend,
    conversionTrustTrend: conversion.trustAssistedConversionQuality,
    safeToExpandAcquisition: observation.safeToScaleTraffic,
    recommendationMaturityHealthy: observation.recommendationMaturityStable,
    trustVolatilityAcceptable: observation.trustStabilityHealthy,
    authorityDepthImproving:
      seo.authorityDepthTrend === "deepening" ||
      seo.authorityQualityTrend === "improving",
    weeklyBetaSnapshot: weekly,
    trustHealthSnapshot: observation.trustCalibrationSnapshot,
    recommendationMaturitySnapshot: {
      drift: refinement.recommendationConfidenceDrift,
      recovery: refinement.compareTrustRecoveryTrend,
    },
    generatedAt: new Date().toISOString(),
    releaseMeta: {
      phase: "controlled-beta-operations",
      generatedAt: new Date().toISOString(),
      reviewOwner: "beta-ops",
      stabilityReviewAt: new Date().toISOString(),
    },
  };
}

/**
 * Learning maturity — platform learning effectiveness gates.
 */
export function buildLearningMaturitySummary(ctx = {}) {
  const growth = buildGrowthLearningReport(ctx);
  const refinement = buildRecommendationRefinementReport(ctx);
  const content = buildContentUsefulnessReport(ctx);
  const acquisition = buildAcquisitionCalibrationReport(ctx);
  const market = buildMarketValidationReport({
    ...ctx,
    refinement,
    contentUsefulness: content,
  });
  const observation = buildBetaObservationSummary(ctx);

  const platformLearningEffectively =
    refinement.recommendationResilienceTrend !== "fragile" &&
    content.guideEngagementQuality !== "emerging";

  const recommendationQualityImproving =
    refinement.recommendationConfidenceDrift === "improving" ||
    refinement.compareConfidenceStabilization === "stabilizing";

  const trafficQualityHealthy =
    acquisition.acquisitionMaturity !== "early" &&
    acquisition.unstableTrafficTrend === "stable";

  const trustStabilityAcceptable = observation.trustStabilityHealthy;

  const authorityUsefulnessCompounding =
    content.guideUsefulnessTrend === "improving" ||
    content.authorityUsefulnessScore >= 60;

  return {
    learningMaturityTrend:
      platformLearningEffectively && recommendationQualityImproving
        ? "maturing"
        : "building",
    calibrationQualityTrend:
      refinement.compareConfidenceStabilization === "stabilizing"
        ? "improving"
        : "watch",
    trustLearningEvolution: refinement.trustRecoveryQuality,
    recommendationStabilizationTrend: refinement.recommendationResilienceTrend,
    authorityUsefulnessEvolution: content.guideUsefulnessTrend,
    acquisitionQualityEvolution: acquisition.trustedSourceTrend,
    platformLearningEffectively,
    recommendationQualityImproving,
    trafficQualityHealthy,
    trustStabilityAcceptable,
    authorityUsefulnessCompounding,
    weeklyLearningSnapshot: {
      acquisitionMaturity: acquisition.acquisitionMaturity,
      avgAcquisitionQuality: acquisition.acquisitionQualityScore,
      contentTrust: content.contentTrustTrend,
      recommendationDrift: refinement.recommendationConfidenceDrift,
    },
    recommendationHealthSnapshot: {
      resilience: refinement.recommendationResilienceTrend,
      recovery: refinement.trustRecoveryQuality,
      stabilization: refinement.compareConfidenceStabilization,
    },
    trustQualitySnapshot: {
      recoveryTrend: refinement.compareTrustRecoveryTrend,
      distrustClusters: refinement.recurringDistrustClusters?.length ?? 0,
    },
    authorityGrowthSummary: {
      usefulnessScore: content.authorityUsefulnessScore,
      trend: content.guideUsefulnessTrend,
    },
    retentionMaturityTrend: market.retentionMaturityTrend,
    recommendationDurabilityTrend: refinement.recommendationStabilityPersistence,
    authorityUsefulnessTrend: content.authorityRetentionTrend,
    trustedReturnUserTrend: market.returnUserTrustTrend,
    operationalLearningEffectiveness:
      market.platformLearningEffectively ?? platformLearningEffectively,
    usersReturningTrustImproving: market.usersReturningTrustImproving,
    authorityUsefulnessCompounding:
      market.authorityUsefulnessCompounding ?? authorityUsefulnessCompounding,
    recommendationQualityStabilizing:
      market.recommendationQualityStabilizing ??
      refinement.compareConfidenceStabilization === "stabilizing",
    retentionQualityHealthy: market.retentionQualityHealthy,
    weeklyMarketValidationSnapshot: market.retentionQualitySnapshot,
    trustRetentionSummary: market.recommendationRetentionSummary,
    authorityGrowthSummaryExtended: market.authorityGrowthSummary,
    recommendationDurabilitySummary: {
      stability: refinement.recommendationStabilityPersistence,
      improving: refinement.recommendationsImprovingOverTime,
      volatility: refinement.longTermTrustVolatility,
    },
    generatedAt: new Date().toISOString(),
    releaseMeta: {
      phase: "market-validation",
      generatedAt: new Date().toISOString(),
      reviewOwner: "beta-ops",
      learningQualityReviewAt: new Date().toISOString(),
      scalingReadinessReviewAt: new Date().toISOString(),
    },
  };
}

/**
 * Adoption maturity — external growth & authority distribution gates.
 */
export function buildAdoptionMaturitySummary(ctx = {}) {
  const adoption = buildAdoptionGrowthReport(ctx);
  const learning = buildLearningMaturitySummary(ctx);

  return {
    ...adoption,
    adoptionMaturityTrend: adoption.adoptionMaturityTrend,
    trustedReturnUserTrend: adoption.trustedReturnUserTrend,
    authorityUsefulnessTrend: adoption.authorityUsefulnessTrend,
    recommendationDurabilityEvolution: adoption.recommendationDurabilityEvolution,
    trustRetentionEvolution: adoption.trustRetentionEvolution,
    operationalAdoptionConfidence: adoption.operationalAdoptionConfidence,
    usersAdoptingAsTrustedPlatform: adoption.usersAdoptingAsTrustedPlatform,
    authorityUsefulnessCompounding: adoption.authorityUsefulnessCompounding,
    recommendationDurabilityHealthy: adoption.recommendationDurabilityHealthy,
    retentionQualityStable: adoption.retentionQualityStable,
    readyForBroaderAcquisition: adoption.readyForBroaderAcquisition,
    weeklyAdoptionSnapshot: adoption.weeklyAdoptionSnapshot,
    authorityGrowthSummary: adoption.authorityGrowthSummary,
    recommendationTrustSummary: adoption.recommendationTrustSummary,
    retentionQualitySummary: adoption.retentionQualitySummary,
    platformLearningFromLearning: learning.platformLearningEffectively,
    generatedAt: new Date().toISOString(),
    releaseMeta: {
      phase: "adoption-growth",
      generatedAt: new Date().toISOString(),
      reviewOwner: "adoption-ops",
      adoptionReviewAt: new Date().toISOString(),
      authorityReviewOwner: "content-ops",
      operationalReadinessAt: new Date().toISOString(),
      trustRetentionReviewAt: new Date().toISOString(),
    },
  };
}

/**
 * Retention, community & authority compounding — return-trust maturity gates.
 */
export function buildRetentionAuthorityMaturitySummary(ctx = {}) {
  const market = buildMarketValidationReport({
    ...ctx,
    refinement: buildRecommendationRefinementReport(ctx),
    contentUsefulness: buildContentUsefulnessReport(ctx),
  });
  const adoption = buildAdoptionGrowthReport(ctx);
  const content = buildContentUsefulnessReport(ctx);
  const refinement = buildRecommendationRefinementReport(ctx);
  const conversion = buildConversionRefinementReport(ctx);
  const seo = buildSeoAuthorityReport(ctx);

  const retentionAuthorityReady =
    market.retentionQualityHealthy &&
    market.trustedReturnUserPersistence !== "early" &&
    adoption.communityDiscoveryMaturity !== "developing" &&
    refinement.recommendationStabilityPersistence === "durable" &&
    content.authorityUsefulnessPersistence !== "watch";

  return {
    ...market,
    retentionConfidenceTrend: market.retentionConfidenceTrend,
    repeatCompareDurability: market.repeatCompareDurability,
    trustedReturnUserQuality: market.trustedReturnUserQuality,
    communityDiscoveryMaturity: adoption.communityDiscoveryMaturity,
    communityShareQuality: adoption.communityShareQuality,
    highestTrustReferralPaths: adoption.highestTrustReferralPaths,
    bestCommunityDiscovery: adoption.bestCommunityDiscovery,
    weakShareJourneys: adoption.weakShareJourneys,
    mostSharedCompareFlows: adoption.mostSharedCompareFlows,
    authorityTrustPersistence: content.authorityUsefulnessPersistence,
    guideReturnQuality: content.guideRevisitQuality,
    recommendationDurabilityConfidence:
      refinement.recommendationStabilityPersistence === "durable"
        ? "confident"
        : "building",
    repeatUserConversionDurability: conversion.compareConfidenceConversionDurability,
    authorityDiscoveryDurability: seo.authorityDiscoveryPersistence,
    retentionAuthorityReady,
    retentionQualitySnapshots: market.weeklyRetentionSnapshots,
    trustedReturnUserSummary: market.trustedReturnUserSummary,
    recommendationRetentionSummaries: market.recommendationRetentionSummary,
    generatedAt: new Date().toISOString(),
    releaseMeta: {
      phase: "retention-authority",
      generatedAt: new Date().toISOString(),
      reviewOwner: "retention-ops",
      retentionQualityReviewAt: new Date().toISOString(),
      authorityReviewOwner: "content-ops",
      recommendationDurabilityReviewAt: new Date().toISOString(),
      communityDiscoveryReviewAt: new Date().toISOString(),
      conversionRetentionReviewAt: new Date().toISOString(),
    },
  };
}

const PUBLIC_AUTHORITY_WEEKLY_KEY = "evsavari-public-authority-weekly-v1";

function readPublicAuthorityWeekly() {
  try {
    const raw = localStorage.getItem(PUBLIC_AUTHORITY_WEEKLY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writePublicAuthorityWeekly(arr) {
  try {
    localStorage.setItem(PUBLIC_AUTHORITY_WEEKLY_KEY, JSON.stringify(arr.slice(0, 10)));
  } catch {
    /* quota */
  }
}

function recordPublicAuthorityWeekly(snapshot) {
  const week = new Date().toISOString().slice(0, 10);
  const filtered = readPublicAuthorityWeekly().filter((s) => s.week !== week);
  writePublicAuthorityWeekly([
    { week, at: new Date().toISOString(), ...snapshot },
    ...filtered,
  ]);
}

/**
 * Public authority & trusted adoption — external presence maturity gates.
 */
export function buildPublicAuthorityMaturitySummary(ctx = {}) {
  const content = buildContentUsefulnessReport(ctx);
  const adoption = buildAdoptionGrowthReport(ctx);
  const refinement = buildRecommendationRefinementReport(ctx);
  const conversion = buildConversionRefinementReport(ctx);
  const seo = buildSeoAuthorityReport(ctx);
  const retention = buildRetentionAuthorityMaturitySummary(ctx);

  const publicAuthorityMaturity =
    content.authorityVisibilityTrend === "visible" &&
    content.trustedAuthorityEntryQuality !== "early"
      ? "mature"
      : "building";

  const trustedDiscoveryQuality =
    adoption.trustedDiscoveryPersistence === "persistent" ||
    adoption.communityDiscoveryMaturity === "mature"
      ? "healthy"
      : "developing";

  const readyForBroaderVisibility =
    retention.retentionQualityHealthy &&
    publicAuthorityMaturity !== "building" &&
    refinement.recommendationPersistenceQuality === "strong" &&
    trustedDiscoveryQuality === "healthy" &&
    seo.authorityCompoundingHealthy;

  recordPublicAuthorityWeekly({
    authorityUsefulnessScore: content.authorityUsefulnessScore,
    trustedSessionRatio: retention.trustedSessionRatio,
    publicAuthorityMaturity,
    trustedDiscoveryQuality,
  });

  return {
    publicAuthorityMaturity,
    trustedReturnUserEvolution: retention.returnUserTrustTrend,
    recommendationDurabilityEvolution: refinement.recommendationPersistenceQuality,
    authorityUsefulnessPersistence: content.authorityRevisitPersistence,
    operationalAdoptionConfidence: adoption.operationalAdoptionConfidence,
    trustedDiscoveryQuality,
    usersTrustingEvsavariRepeatedly:
      retention.trustedReturnUserPersistence === "persistent" ||
      retention.trustedRepeatVisitors >= 2,
    authorityUsefulnessCompounding:
      content.authorityVisibilityTrend === "visible" ||
      content.authorityRetentionTrend === "improving",
    recommendationsDurable:
      refinement.recommendationPersistenceQuality === "strong" ||
      refinement.recommendationStabilityPersistence === "durable",
    trustedDiscoveryHealthy: trustedDiscoveryQuality === "healthy",
    readyForBroaderVisibility,
    weeklyAuthoritySnapshots: readPublicAuthorityWeekly().slice(0, 8),
    recommendationTrustSummaries: retention.recommendationRetentionSummaries,
    retentionQualitySummaries: retention.retentionQualitySnapshot,
    adoptionConfidenceSummaries: adoption.authorityDistributionSummary,
    bestTrustedDiscoveryPaths: adoption.bestTrustedDiscoveryPaths,
    mostDurableCommunityJourneys: adoption.mostDurableCommunityJourneys,
    weakDiscoveryRetention: adoption.weakDiscoveryRetention,
    trustedCompareSharingPaths: adoption.trustedCompareSharingPaths,
    strongAuthoritySharingJourneys: adoption.strongAuthoritySharingJourneys,
    mostTrustedPublicAuthorityContent: content.mostTrustedPublicAuthorityContent,
    authorityVisibilityTrend: content.authorityVisibilityTrend,
    compareAfterGuideTrust: content.compareAfterGuideTrust,
    generatedAt: new Date().toISOString(),
    releaseMeta: {
      phase: "public-authority",
      generatedAt: new Date().toISOString(),
      reviewOwner: "public-authority-ops",
      authorityReviewAt: new Date().toISOString(),
      retentionQualityReviewAt: new Date().toISOString(),
      recommendationDurabilityReviewAt: new Date().toISOString(),
      trustedDiscoveryReviewAt: new Date().toISOString(),
      conversionTrustReviewAt: new Date().toISOString(),
    },
  };
}

const TRUSTED_GROWTH_WEEKLY_KEY = "evsavari-trusted-growth-weekly-v1";

function readTrustedGrowthWeekly() {
  try {
    const raw = localStorage.getItem(TRUSTED_GROWTH_WEEKLY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function recordTrustedGrowthWeekly(snapshot) {
  const week = new Date().toISOString().slice(0, 10);
  const filtered = readTrustedGrowthWeekly().filter((s) => s.week !== week);
  try {
    localStorage.setItem(
      TRUSTED_GROWTH_WEEKLY_KEY,
      JSON.stringify([{ week, at: new Date().toISOString(), ...snapshot }, ...filtered].slice(0, 10))
    );
  } catch {
    /* quota */
  }
}

/**
 * Trusted growth & public presence — habit formation + discovery maturity gates.
 */
export function buildTrustedGrowthMaturitySummary(ctx = {}) {
  const publicAuth = buildPublicAuthorityMaturitySummary(ctx);
  const retention = buildRetentionAuthorityMaturitySummary(ctx);
  const content = buildContentUsefulnessReport(ctx);
  const refinement = buildRecommendationRefinementReport(ctx);
  const conversion = buildConversionRefinementReport(ctx);
  const adoption = buildAdoptionGrowthReport(ctx);

  const trustedGrowthMaturity =
    publicAuth.trustedDiscoveryHealthy &&
    retention.usersReturningBecauseRecommendationsHelp
      ? "mature"
      : "building";

  const readyForDisciplinedGrowth =
    publicAuth.readyForBroaderVisibility &&
    refinement.recommendationTrustPersistence === "strong" &&
    retention.recommendationHabitFormation !== "early" &&
    content.practicalGuideTrustRetention === "trusted";

  recordTrustedGrowthWeekly({
    trustedDiscoveryQuality: adoption.trustedDiscoveryQuality,
    trustedSessionRatio: retention.trustedSessionRatio,
    trustedGrowthMaturity,
    recommendationHabitFormation: retention.recommendationHabitFormation,
  });

  return {
    trustedGrowthMaturity,
    trustedDiscoveryQuality: adoption.trustedDiscoveryQuality,
    practicalEntryRetention: adoption.practicalEntryRetention,
    compareAfterGuidePersistence: adoption.compareAfterGuidePersistence,
    trustedSharePersistence: adoption.trustedSharePersistence,
    repeatUserDiscoveryQuality: adoption.repeatUserDiscoveryQuality,
    trustedDiscoverySummaries: adoption.trustedDiscoverySummary,
    practicalEntrySnapshots: adoption.practicalEntrySnapshot,
    authorityVisibilitySummaries: adoption.authorityVisibilitySummary,
    bestTrustedDiscoveryPaths: adoption.bestTrustedDiscoveryPaths,
    mostDurableAuthorityEntryJourneys: adoption.mostDurableAuthorityEntryJourneys,
    weakPracticalDiscovery: adoption.weakPracticalDiscovery,
    strongOwnershipGuideEntry: adoption.strongOwnershipGuideEntry,
    trustedCompareSharingPaths: adoption.trustedCompareSharingPaths,
    usersReturningBecauseRecommendationsHelp:
      retention.usersReturningBecauseRecommendationsHelp,
    mostRevisitedCompareJourneys: retention.mostRevisitedCompareJourneys,
    strongRecommendationRevisitTrust: retention.strongRecommendationRevisitTrust,
    weakRepeatUseFlows: retention.weakRepeatUseFlows,
    mostDurableOwnershipGuidance: retention.mostDurableOwnershipGuidance,
    recommendationHabitFormation: retention.recommendationHabitFormation,
    retentionConfidenceEvolution: retention.retentionConfidenceEvolution,
    repeatUserRecommendationTrust: retention.repeatUserRecommendationTrust,
    authorityUsefulnessPersistence: content.authorityUsefulnessPersistence,
    recommendationTrustPersistence: refinement.recommendationTrustPersistence,
    conversionTrustMaturity: conversion.trustedReturnUserConversionQuality,
    readyForDisciplinedGrowth,
    weeklyTrustedGrowthSnapshots: readTrustedGrowthWeekly().slice(0, 8),
    recommendationTrustSummaries: retention.recommendationRetentionSummary,
    retentionQualitySummaries: retention.retentionQualitySnapshot,
    adoptionConfidenceSummaries: adoption.authorityDistributionSummary,
    ...publicAuth,
    generatedAt: new Date().toISOString(),
    releaseMeta: {
      phase: "trusted-growth",
      generatedAt: new Date().toISOString(),
      reviewOwner: "trusted-growth-ops",
      authorityReviewOwner: "content-ops",
      retentionQualityReviewAt: new Date().toISOString(),
      recommendationDurabilityReviewAt: new Date().toISOString(),
      trustedDiscoveryReviewAt: new Date().toISOString(),
      conversionTrustReviewAt: new Date().toISOString(),
    },
  };
}

const TRUSTED_BRAND_WEEKLY_KEY = "evsavari-trusted-brand-weekly-v1";

function readTrustedBrandWeekly() {
  try {
    const raw = localStorage.getItem(TRUSTED_BRAND_WEEKLY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function recordTrustedBrandWeekly(snapshot) {
  const week = new Date().toISOString().slice(0, 10);
  const filtered = readTrustedBrandWeekly().filter((s) => s.week !== week);
  try {
    localStorage.setItem(
      TRUSTED_BRAND_WEEKLY_KEY,
      JSON.stringify([{ week, at: new Date().toISOString(), ...snapshot }, ...filtered].slice(0, 10))
    );
  } catch {
    /* quota */
  }
}

const TRUSTED_SCALING_WEEKLY_KEY = "evsavari-trusted-scaling-weekly-v1";

function readTrustedScalingWeekly() {
  try {
    const raw = localStorage.getItem(TRUSTED_SCALING_WEEKLY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function recordTrustedScalingWeekly(snapshot) {
  const week = new Date().toISOString().slice(0, 10);
  const filtered = readTrustedScalingWeekly().filter((s) => s.week !== week);
  try {
    localStorage.setItem(
      TRUSTED_SCALING_WEEKLY_KEY,
      JSON.stringify([{ week, at: new Date().toISOString(), ...snapshot }, ...filtered].slice(0, 10))
    );
  } catch {
    /* quota */
  }
}

/**
 * Trusted scaling readiness & UX quality — composes brand, market, content, refinement gates.
 */
export function buildTrustedScalingMaturitySummary(ctx = {}) {
  const trustedBrand = buildTrustedBrandMaturitySummary(ctx);
  const content = buildContentUsefulnessReport(ctx);
  const refinement = buildRecommendationRefinementReport({
    ...ctx,
    contentUsefulness: content,
  });
  const market = buildMarketValidationReport({
    ...ctx,
    refinement,
    contentUsefulness: content,
  });
  const conversion = buildConversionRefinementReport(ctx);

  const trustedScalingMaturity =
    trustedBrand.trustedBrandMaturity === "mature" &&
    market.scalingTrustDurability === "durable" &&
    content.userExperienceUsefulness !== "early"
      ? "mature"
      : "building";

  const scalingReadinessConfidence =
    trustedBrand.readyForDisciplinedScaling &&
    market.scalingTrustDurability === "durable" &&
    content.practicalValuePersistence === "persistent"
      ? "confident"
      : "building";

  const readyForDisciplinedExpansion =
    trustedBrand.readyForDisciplinedScaling &&
    content.userExperienceUsefulness === "strong" &&
    refinement.weakRecommendationUsefulness !== "weak" &&
    market.repeatUserStability === "stable";

  const trustStableUnderGrowth = market.scalingTrustDurability === "durable";
  const recommendationsDurableAtHigherUsage =
    refinement.recommendationStabilityPersistence === "durable" ||
    refinement.recommendationUsefulnessPersistence === "strong";
  const authorityUsefulnessHolding = market.authorityRetentionStability === "stable";
  const repeatUserQualityHealthy = market.repeatUserStability === "stable";

  recordTrustedScalingWeekly({
    trustedScalingMaturity,
    scalingReadinessConfidence,
    userExperienceUsefulness: content.userExperienceUsefulness,
    scalingTrustDurability: market.scalingTrustDurability,
  });

  return {
    trustedScalingMaturity,
    scalingReadinessConfidence,
    readyForDisciplinedExpansion,
    userExperienceUsefulness: content.userExperienceUsefulness,
    compareReadabilityQuality: content.compareReadabilityQuality,
    recommendationUsefulnessEvolution:
      refinement.recommendationUsefulnessEvolution ||
      trustedBrand.recommendationUsefulnessEvolution,
    authorityMemorability:
      content.authorityMemorabilityPersistence || trustedBrand.authorityMemorability,
    repeatUserTrustPersistence: market.trustedReturnUserPersistence,
    operationalTrustMaturity: trustedBrand.operationalTrustMaturity,
    usersTrustingEvsavariRepeatedly: trustedBrand.usersTrustingEvsavariRepeatedly,
    authorityUsefulnessCompounding:
      content.authorityUsefulnessCompounding || trustedBrand.authorityUsefulnessCompounding,
    recommendationsPracticallyUseful: trustedBrand.recommendationsPracticallyValuable,
    trustedScalingHealthy: scalingReadinessConfidence === "confident",
    trustStableUnderGrowth,
    recommendationsDurableAtHigherUsage,
    authorityUsefulnessHolding,
    repeatUserQualityHealthy,
    readyForDisciplinedScaling: readyForDisciplinedExpansion,
    scalingReadinessSnapshots: market.scalingReadinessSnapshots,
    trustStabilitySummary: market.trustStabilitySummary,
    recommendationDurabilitySummary: market.recommendationDurabilitySummary,
    conversionTrustMaturity: conversion.trustedReturnUserConversionQuality,
    weeklyTrustedScalingSnapshots: readTrustedScalingWeekly().slice(0, 8),
    authorityValueSummaries: content.authorityValueSummary,
    recommendationUsefulnessSummaries: market.recommendationDurabilitySummary,
    repeatUserTrustSummaries: market.trustStabilitySummary,
    ...trustedBrand,
    generatedAt: new Date().toISOString(),
    releaseMeta: {
      phase: "trusted-scaling",
      generatedAt: new Date().toISOString(),
      reviewOwner: "trusted-scaling-ops",
      authorityReviewOwner: "content-ops",
      trustQualityReviewAt: new Date().toISOString(),
      retentionQualityReviewAt: new Date().toISOString(),
      recommendationUsefulnessReviewAt: new Date().toISOString(),
      conversionTrustReviewAt: new Date().toISOString(),
      scalingReadinessReviewAt: new Date().toISOString(),
    },
  };
}

const PUBLIC_EXPERIENCE_WEEKLY_KEY = "evsavari-public-experience-weekly-v1";

function readPublicExperienceWeekly() {
  try {
    const raw = localStorage.getItem(PUBLIC_EXPERIENCE_WEEKLY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function recordPublicExperienceWeekly(snapshot) {
  const week = new Date().toISOString().slice(0, 10);
  const filtered = readPublicExperienceWeekly().filter((s) => s.week !== week);
  try {
    localStorage.setItem(
      PUBLIC_EXPERIENCE_WEEKLY_KEY,
      JSON.stringify([{ week, at: new Date().toISOString(), ...snapshot }, ...filtered].slice(0, 10))
    );
  } catch {
    /* quota */
  }
}

const PRODUCTION_LAUNCH_WEEKLY_KEY = "evsavari-production-launch-weekly-v1";

function readProductionLaunchWeekly() {
  try {
    const raw = localStorage.getItem(PRODUCTION_LAUNCH_WEEKLY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function recordProductionLaunchWeekly(snapshot) {
  const week = new Date().toISOString().slice(0, 10);
  const filtered = readProductionLaunchWeekly().filter((s) => s.week !== week);
  try {
    localStorage.setItem(
      PRODUCTION_LAUNCH_WEEKLY_KEY,
      JSON.stringify([{ week, at: new Date().toISOString(), ...snapshot }, ...filtered].slice(0, 10))
    );
  } catch {
    /* quota */
  }
}

/**
 * Production excellence & trusted public launch — UX, performance, trust durability gates.
 */
export function buildProductionLaunchMaturitySummary(ctx = {}) {
  const publicExperience = buildPublicExperienceMaturitySummary(ctx);
  const performance = buildPerformanceReliabilityReport(ctx);
  const content = buildContentUsefulnessReport(ctx);
  const refinement = buildRecommendationRefinementReport({
    ...ctx,
    contentUsefulness: content,
  });

  const productionQualityMaturity =
    content.productionUxConsistency === "consistent" &&
    performance.productionStabilityHealthy &&
    refinement.recommendationDurabilityPersistence === "durable"
      ? "production-ready"
      : "building";

  const trustedGrowthStability =
    performance.performanceStableUnderGrowth &&
    publicExperience.trustConsistencyEvolution === "stable";

  const authorityQualityEvolution = content.authorityUsefulnessDurability;
  const productionLaunchConfidence =
    publicExperience.readyForDisciplinedExpansion &&
    performance.productionStabilityHealthy &&
    performance.perceivedSpeedQuality !== "slow"
      ? "confident"
      : "building";

  const readyForPublicProductionLaunch = productionLaunchConfidence === "confident";

  const platformQualityStable = performance.productionStabilityHealthy;
  const performanceHealthy =
    performance.compareRenderingReliable && performance.mediaDeliveryHealthy;

  recordProductionLaunchWeekly({
    productionQualityMaturity,
    productionLaunchConfidence,
    perceivedSpeedQuality: performance.perceivedSpeedQuality,
    productionStabilityHealthy: performance.productionStabilityHealthy,
  });

  const recommendationQualitySummaries = {
    durability: refinement.recommendationDurabilityPersistence,
    trustConsistency: refinement.trustConsistencyTrend,
    fatigue: refinement.fatiguePersistenceQuality,
  };

  const authorityValueSummaries = {
    contentQuality: content.contentQualityPersistence,
    usefulness: content.authorityUsefulnessDurability,
    compareSupport: content.compareSupportAuthorityQuality,
  };

  const trustConsistencySummaries = publicExperience.recommendationConsistencySummaries;

  return {
    productionQualityMaturity,
    trustedGrowthStability,
    recommendationUsefulnessPersistence:
      refinement.recommendationUsefulnessPersistence ||
      publicExperience.recommendationUsefulnessPersistence,
    authorityQualityEvolution,
    repeatUserTrustPersistence: publicExperience.repeatUserConfidencePersistence,
    productionLaunchConfidence,
    platformQualityStable,
    recommendationsRemainingUseful: publicExperience.recommendationsRemainingUseful,
    authorityUsefulnessCompounding: publicExperience.authorityUsefulnessCompounding,
    performanceHealthy,
    readyForPublicProductionLaunch,
    performanceStableUnderGrowth: performance.performanceStableUnderGrowth,
    compareRenderingReliable: performance.compareRenderingReliable,
    mediaDeliveryHealthy: performance.mediaDeliveryHealthy,
    routeTransitionsSmooth: performance.routeTransitionsSmooth,
    productionStabilityHealthy: performance.productionStabilityHealthy,
    weeklyProductionSnapshots: readProductionLaunchWeekly().slice(0, 8),
    recommendationQualitySummaries,
    authorityValueSummaries,
    trustConsistencySummaries,
    perceivedSpeedQuality: performance.perceivedSpeedQuality,
    ...publicExperience,
    performance,
    generatedAt: new Date().toISOString(),
    releaseMeta: {
      phase: "production-launch",
      generatedAt: new Date().toISOString(),
      reviewOwner: "production-launch-ops",
      authorityReviewOwner: "content-ops",
      trustQualityReviewAt: new Date().toISOString(),
      recommendationQualityReviewAt: new Date().toISOString(),
      performanceReviewAt: new Date().toISOString(),
      publicQualityReviewAt: new Date().toISOString(),
      conversionTrustReviewAt: new Date().toISOString(),
    },
  };
}

const LIVE_PLATFORM_WEEKLY_KEY = "evsavari-live-platform-weekly-v1";

function readLivePlatformWeekly() {
  try {
    const raw = localStorage.getItem(LIVE_PLATFORM_WEEKLY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function recordLivePlatformWeekly(snapshot) {
  const week = new Date().toISOString().slice(0, 10);
  const filtered = readLivePlatformWeekly().filter((s) => s.week !== week);
  try {
    localStorage.setItem(
      LIVE_PLATFORM_WEEKLY_KEY,
      JSON.stringify([{ week, at: new Date().toISOString(), ...snapshot }, ...filtered].slice(0, 10))
    );
  } catch {
    /* quota */
  }
}

/**
 * Live platform operations & real traffic readiness — composes production, performance, market gates.
 */
export function buildLivePlatformMaturitySummary(ctx = {}) {
  const productionLaunch = buildProductionLaunchMaturitySummary(ctx);
  const content = buildContentUsefulnessReport(ctx);
  const refinement = buildRecommendationRefinementReport({
    ...ctx,
    contentUsefulness: content,
  });
  const performance = buildPerformanceReliabilityReport({
    ...ctx,
    refinement,
    contentUsefulness: content,
  });
  const market = buildMarketValidationReport({
    ...ctx,
    refinement,
    contentUsefulness: content,
  });
  const growth = buildGrowthLearningReport(ctx);

  const liveProductionMaturity =
    productionLaunch.productionQualityMaturity === "production-ready" &&
    performance.operationalStabilityPersistence === "persistent"
      ? "live-stable"
      : "building";

  const operationalTrustPersistence = performance.operationalStabilityPersistence;
  const recommendationDurabilityUnderTraffic =
    refinement.recommendationDurabilityPersistence;
  const authorityUsefulnessPersistence = content.authorityUsefulnessDurability;
  const realWorldLaunchConfidence =
    productionLaunch.readyForPublicProductionLaunch &&
    market.readyForBroaderPublicTraffic
      ? "confident"
      : "building";

  const readyForBroaderPublicLaunch = realWorldLaunchConfidence === "confident";

  const platformStableUnderRealTraffic =
    performance.productionStabilityHealthy && market.trafficQualityHealthy;

  const operationalHealthSummary = {
    livePlatformHealth: performance.livePlatformHealthTrend,
    compareReliability: performance.compareReliabilityUnderUsage,
    mediaReliability: performance.mediaReliabilityUnderTraffic,
    operationalStability: performance.operationalStabilityPersistence,
  };

  const trustStabilitySummary = {
    ...market.trustStabilitySummary,
    trustConsistencyUnderLoad: performance.trustConsistencyUnderLoad,
    recommendationUnderTraffic: performance.recommendationStabilityUnderTraffic,
  };

  const recommendationQualitySummaries = productionLaunch.recommendationQualitySummaries;
  const authorityValueSummaries = {
    ...productionLaunch.authorityValueSummaries,
    contentFreshness: content.contentFreshnessPersistence,
  };

  recordLivePlatformWeekly({
    liveProductionMaturity,
    realWorldLaunchConfidence,
    platformStableUnderRealTraffic,
    perceivedSpeedQuality: performance.perceivedSpeedQuality,
  });

  return {
    liveProductionMaturity,
    operationalTrustPersistence,
    recommendationDurabilityUnderTraffic,
    authorityUsefulnessPersistence,
    repeatUserTrustPersistence: productionLaunch.repeatUserTrustPersistence,
    realWorldLaunchConfidence,
    platformStableUnderRealTraffic,
    recommendationsRemainingUseful: productionLaunch.recommendationsRemainingUseful,
    authorityUsefulnessCompounding: productionLaunch.authorityUsefulnessCompounding,
    operationalTrustHealthy: performance.productionStabilityHealthy,
    readyForBroaderPublicLaunch,
    platformHealthyUnderTraffic:
      performance.productionStabilityHealthy && refinement.recommendationsStableUnderScale,
    recommendationsStableUnderUsage: refinement.recommendationsStableUnderScale,
    repeatUserQualityHealthy: market.repeatUserStability === "stable",
    authorityContentFresh: content.contentFreshnessPersistence === "fresh",
    operationalStabilityHealthy: performance.productionStabilityHealthy,
    trafficQualityHealthy: market.trafficQualityHealthy,
    discoveryQualityStable: market.discoveryQualityStable,
    trustedEntryJourneysDurable: market.trustedEntryJourneysDurable,
    repeatUserAcquisitionHealthy:
      growth.repeatUserAcquisitionQuality === "strong" ||
      market.repeatUserAcquisitionQuality === "strong",
    readyForBroaderPublicTraffic: market.readyForBroaderPublicTraffic,
    weeklyLivePlatformSnapshots: readLivePlatformWeekly().slice(0, 8),
    weeklyProductionSnapshots: productionLaunch.weeklyProductionSnapshots,
    operationalHealthSummary,
    trustStabilitySummary,
    recommendationQualitySummaries,
    authorityValueSummaries,
    trustConsistencySummaries: productionLaunch.trustConsistencySummaries,
    livePlatformHealthTrend: performance.livePlatformHealthTrend,
    ...productionLaunch,
    performance,
    market,
    growth,
    generatedAt: new Date().toISOString(),
    releaseMeta: {
      phase: "live-platform",
      generatedAt: new Date().toISOString(),
      reviewOwner: "live-platform-ops",
      authorityReviewOwner: "content-ops",
      trustQualityReviewAt: new Date().toISOString(),
      recommendationQualityReviewAt: new Date().toISOString(),
      performanceReviewAt: new Date().toISOString(),
      liveTrafficReviewAt: new Date().toISOString(),
      conversionTrustReviewAt: new Date().toISOString(),
    },
  };
}

const REAL_PUBLIC_WEEKLY_KEY = "evsavari-real-public-weekly-v1";

function readRealPublicWeekly() {
  try {
    const raw = localStorage.getItem(REAL_PUBLIC_WEEKLY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function recordRealPublicWeekly(snapshot) {
  const week = new Date().toISOString().slice(0, 10);
  const filtered = readRealPublicWeekly().filter((s) => s.week !== week);
  try {
    localStorage.setItem(
      REAL_PUBLIC_WEEKLY_KEY,
      JSON.stringify([{ week, at: new Date().toISOString(), ...snapshot }, ...filtered].slice(0, 10))
    );
  } catch {
    /* quota */
  }
}

/**
 * Real public operations & production discipline — composes live platform + execution gates.
 */
export function buildRealPublicOperationsMaturitySummary(ctx = {}) {
  const livePlatform = buildLivePlatformMaturitySummary(ctx);
  const performance = livePlatform.performance;
  const market = livePlatform.market;
  const content = buildContentUsefulnessReport(ctx);

  const liveProductionMaturity =
    livePlatform.liveProductionMaturity === "live-stable" &&
    performance?.publicPlatformHealthPersistence === "persistent"
      ? "disciplined"
      : "operating";

  const broaderLaunchConfidence = livePlatform.readyForBroaderPublicLaunch
    ? "confident"
    : "building";

  const readyForBroaderPublicLaunch = broaderLaunchConfidence === "confident";

  const platformStableUnderPublicTraffic = livePlatform.platformStableUnderRealTraffic;

  const productionHealthSummary = {
    ...livePlatform.operationalHealthSummary,
    operationalFreshness: performance?.operationalFreshnessQuality,
    compareReliability: performance?.compareReliabilityPersistence,
  };

  const trustStabilitySummary = livePlatform.trustStabilitySummary;

  recordRealPublicWeekly({
    liveProductionMaturity,
    broaderLaunchConfidence,
    platformStableUnderPublicTraffic,
  });

  return {
    liveProductionMaturity,
    operationalTrustPersistence: livePlatform.operationalTrustPersistence,
    recommendationDurabilityUnderTraffic: livePlatform.recommendationDurabilityUnderTraffic,
    authorityUsefulnessPersistence: livePlatform.authorityUsefulnessPersistence,
    repeatUserTrustPersistence: livePlatform.repeatUserTrustPersistence,
    broaderLaunchConfidence,
    platformStableUnderPublicTraffic,
    recommendationsRemainingUseful: livePlatform.recommendationsRemainingUseful,
    authorityUsefulnessCompounding: livePlatform.authorityUsefulnessCompounding,
    operationalTrustHealthy: livePlatform.operationalTrustHealthy,
    readyForBroaderPublicLaunch,
    platformHealthyUnderLiveTraffic: livePlatform.platformHealthyUnderTraffic,
    recommendationsStableUnderUsage: livePlatform.recommendationsStableUnderUsage,
    authorityContentFresh: livePlatform.authorityContentFresh,
    repeatUserQualityHealthy: livePlatform.repeatUserQualityHealthy,
    operationalStabilityHealthy: livePlatform.operationalStabilityHealthy,
    trafficQualityStable: market?.trafficQualityPersistence === "persistent",
    trustedDiscoveryHealthy: market?.trustedDiscoveryHealthy,
    repeatUserAcquisitionDurable:
      market?.repeatUserAcquisitionPersistence === "persistent",
    authorityEntryQualityHealthy:
      market?.authorityEntryStability === "stable" ||
      market?.authorityEntryStability === "durable",
    readyForWiderPublicTraffic: market?.readyForWiderPublicTraffic,
    operationalFreshnessQuality: performance?.operationalFreshnessQuality,
    trustPersistenceUnderLiveTraffic: performance?.trustPersistenceUnderLiveTraffic,
    repeatUserOperationalStability: performance?.repeatUserOperationalStability,
    compareReliabilityPersistence: performance?.compareReliabilityPersistence,
    authorityFreshnessQuality: performance?.authorityFreshnessQuality,
    recommendationStabilityUnderLoad: performance?.recommendationStabilityUnderLoad,
    publicPlatformHealthPersistence: performance?.publicPlatformHealthPersistence,
    weeklyOperationalSnapshots: readRealPublicWeekly().slice(0, 8),
    weeklyProductionSnapshots: livePlatform.weeklyProductionSnapshots,
    productionHealthSummary,
    trustStabilitySummary,
    recommendationQualitySummaries: livePlatform.recommendationQualitySummaries,
    authorityValueSummaries: {
      ...livePlatform.authorityValueSummaries,
      freshness: content.contentFreshnessPersistence,
      usefulnessStability: content.authorityUsefulnessStability,
    },
    trustConsistencySummaries: livePlatform.trustConsistencySummaries,
    ...livePlatform,
    generatedAt: new Date().toISOString(),
    releaseMeta: {
      phase: "real-public-operations",
      generatedAt: new Date().toISOString(),
      reviewOwner: "real-public-ops",
      authorityReviewOwner: "content-ops",
      trustQualityReviewAt: new Date().toISOString(),
      recommendationQualityReviewAt: new Date().toISOString(),
      performanceReviewAt: new Date().toISOString(),
      liveTrafficReviewAt: new Date().toISOString(),
      conversionTrustReviewAt: new Date().toISOString(),
      operationalEscalationReviewAt: new Date().toISOString(),
    },
  };
}

/**
 * Public experience polish & trust consistency — composes scaling, content, refinement gates.
 */
export function buildPublicExperienceMaturitySummary(ctx = {}) {
  const trustedScaling = buildTrustedScalingMaturitySummary(ctx);
  const content = buildContentUsefulnessReport(ctx);
  const refinement = buildRecommendationRefinementReport({
    ...ctx,
    contentUsefulness: content,
  });

  const publicExperienceMaturity =
    content.calmUxQualityTrend === "calm" &&
    refinement.trustConsistencyTrend === "stable" &&
    content.practicalJourneyConsistency === "consistent"
      ? "polished"
      : "building";

  const trustConsistencyEvolution = refinement.trustConsistencyTrend;
  const repeatUserConfidencePersistence = trustedScaling.repeatUserTrustPersistence;
  const disciplinedExpansionConfidence = trustedScaling.scalingReadinessConfidence;

  const usersConsistentlyTrustingEvsavari =
    trustedScaling.usersTrustingEvsavariRepeatedly &&
    refinement.weakTrustConsistency !== "weak";

  const publicExperiencePolished = publicExperienceMaturity === "polished";
  const recommendationsRemainingUseful = trustedScaling.recommendationsPracticallyUseful;

  const recommendationConsistencySummaries = {
    trustConsistency: refinement.trustConsistencyTrend,
    stability: refinement.recommendationStabilityPersistence,
    fatigue: refinement.recommendationFatigueStability,
  };

  const authorityUsefulnessSummaries = {
    consistency: content.authorityContentConsistency,
    memorability: content.practicalGuideMemorability,
    compareSupport: content.compareSupportAuthorityPersistence,
  };

  const repeatUserTrustSummaries = trustedScaling.repeatUserTrustSummaries;

  recordPublicExperienceWeekly({
    publicExperienceMaturity,
    calmUxQualityTrend: content.calmUxQualityTrend,
    trustConsistencyEvolution,
    disciplinedExpansionConfidence,
  });

  return {
    publicExperienceMaturity,
    trustConsistencyEvolution,
    recommendationUsefulnessPersistence:
      refinement.recommendationUsefulnessPersistence ||
      trustedScaling.recommendationUsefulnessEvolution,
    authorityMemorability:
      content.practicalGuideMemorability || trustedScaling.authorityMemorability,
    repeatUserConfidencePersistence,
    disciplinedExpansionConfidence,
    usersConsistentlyTrustingEvsavari,
    authorityUsefulnessCompounding: trustedScaling.authorityUsefulnessCompounding,
    recommendationsRemainingUseful,
    publicExperiencePolished,
    readyForDisciplinedExpansion: trustedScaling.readyForDisciplinedExpansion,
    weeklyPublicQualitySnapshots: readPublicExperienceWeekly().slice(0, 8),
    recommendationConsistencySummaries,
    authorityUsefulnessSummaries,
    repeatUserTrustSummaries,
    calmUxQualityTrend: content.calmUxQualityTrend,
    compareReadabilityPersistence: content.compareReadabilityPersistence,
    conversionTrustMaturity: trustedScaling.conversionTrustMaturity,
    ...trustedScaling,
    generatedAt: new Date().toISOString(),
    releaseMeta: {
      phase: "public-experience",
      generatedAt: new Date().toISOString(),
      reviewOwner: "public-experience-ops",
      authorityReviewOwner: "content-ops",
      trustQualityReviewAt: new Date().toISOString(),
      recommendationConsistencyReviewAt: new Date().toISOString(),
      publicQualityReviewAt: new Date().toISOString(),
      conversionTrustReviewAt: new Date().toISOString(),
      retentionQualityReviewAt: new Date().toISOString(),
    },
  };
}

/**
 * Trusted brand presence & user value — practical value + brand familiarity gates.
 */
export function buildTrustedBrandMaturitySummary(ctx = {}) {
  const trustedGrowth = buildTrustedGrowthMaturitySummary(ctx);
  const content = buildContentUsefulnessReport(ctx);
  const refinement = buildRecommendationRefinementReport({
    ...ctx,
    contentUsefulness: content,
  });
  const conversion = buildConversionRefinementReport(ctx);
  const adoption = buildAdoptionGrowthReport(ctx);

  const trustedBrandMaturity =
    adoption.trustedBrandEntryQuality === "trusted" &&
    content.practicalValuePersistence !== "watch"
      ? "mature"
      : "building";

  const userValuePersistence = content.practicalValuePersistence;
  const recommendationUsefulnessEvolution = refinement.recommendationUsefulnessPersistence;
  const authorityMemorability = content.authorityMemorabilityTrend;
  const trustedReturnUserConfidence =
    trustedGrowth.repeatUserRecommendationTrust === "trusted" ? "confident" : "building";
  const operationalTrustMaturity = trustedGrowth.trustedGrowthMaturity;

  const readyForDisciplinedScaling =
    trustedGrowth.readyForDisciplinedGrowth &&
    refinement.recommendationUsefulnessPersistence === "strong" &&
    content.practicalValuePersistence === "persistent" &&
    adoption.usersRememberingEvsavari;

  recordTrustedBrandWeekly({
    trustedBrandMaturity,
    userValuePersistence,
    practicalValueScore: content.authorityUsefulnessScore,
  });

  return {
    trustedBrandMaturity,
    userValuePersistence,
    recommendationUsefulnessEvolution,
    authorityMemorability,
    trustedReturnUserConfidence,
    operationalTrustMaturity,
    usersTrustingEvsavariRepeatedly: trustedGrowth.usersTrustingEvsavariRepeatedly,
    authorityUsefulnessCompounding: trustedGrowth.authorityUsefulnessCompounding,
    recommendationsPracticallyValuable:
      refinement.recommendationUsefulnessPersistence === "strong" ||
      refinement.recommendationsTrustedRepeatedly,
    trustedPublicPresenceHealthy: trustedGrowth.trustedDiscoveryHealthy,
    readyForDisciplinedScaling,
    usersRememberingEvsavari: adoption.usersRememberingEvsavari,
    strongestTrustedEntryJourneys: adoption.strongestTrustedEntryJourneys,
    mostDurableAuthorityDiscovery: adoption.mostDurableAuthorityEntryJourneys,
    weakPublicTrustJourneys: adoption.weakPublicTrustJourneys,
    mostTrustedCompareSharingPaths: adoption.mostTrustedCompareSharingPaths,
    practicalValuePersistence: content.practicalValuePersistence,
    authorityValueSummaries: content.authorityValueSummary,
    recommendationUsefulnessSummaries: trustedGrowth.recommendationTrustSummaries,
    repeatUserTrustSummaries: trustedGrowth.retentionQualitySummaries,
    weeklyTrustedGrowthSnapshots: readTrustedBrandWeekly().slice(0, 8),
    ...trustedGrowth,
    generatedAt: new Date().toISOString(),
    releaseMeta: {
      phase: "trusted-brand",
      generatedAt: new Date().toISOString(),
      reviewOwner: "trusted-brand-ops",
      authorityReviewOwner: "content-ops",
      trustQualityReviewAt: new Date().toISOString(),
      retentionQualityReviewAt: new Date().toISOString(),
      recommendationUsefulnessReviewAt: new Date().toISOString(),
      conversionTrustReviewAt: new Date().toISOString(),
    },
  };
}

export function buildControlledGrowthBundle(ctx = {}) {
  const contentUsefulness = buildContentUsefulnessReport(ctx);
  const refinement = buildRecommendationRefinementReport({
    ...ctx,
    contentUsefulness,
  });
  return {
    weeklySummary: buildBetaWeeklySummary(ctx),
    trustConversion: buildTrustConversionSignals(ctx),
    calibrationQueues: buildCalibrationReviewQueues(ctx),
    stability: buildBetaStabilitySummary(ctx),
    observation: buildBetaObservationSummary(ctx),
    operationalMaturity: buildOperationalMaturitySummary(ctx),
    learningMaturity: buildLearningMaturitySummary(ctx),
    growth: buildGrowthLearningReport(ctx),
    acquisitionCalibration: buildAcquisitionCalibrationReport(ctx),
    recommendationRefinement: refinement,
    conversionRefinement: buildConversionRefinementReport(ctx),
    contentUsefulness,
    mediaPolish: buildMediaPolishReport({}),
    marketValidation: buildMarketValidationReport({
      ...ctx,
      refinement,
      contentUsefulness,
    }),
    adoptionGrowth: buildAdoptionGrowthReport(ctx),
    adoptionMaturity: buildAdoptionMaturitySummary(ctx),
    retentionAuthority: buildRetentionAuthorityMaturitySummary(ctx),
    publicAuthority: buildPublicAuthorityMaturitySummary(ctx),
    trustedGrowth: buildTrustedGrowthMaturitySummary(ctx),
    trustedBrand: buildTrustedBrandMaturitySummary(ctx),
    trustedScaling: buildTrustedScalingMaturitySummary(ctx),
    publicExperience: buildPublicExperienceMaturitySummary(ctx),
    performanceReliability: buildPerformanceReliabilityReport({
      ...ctx,
      refinement,
      contentUsefulness,
    }),
    productionLaunch: buildProductionLaunchMaturitySummary(ctx),
    livePlatform: buildLivePlatformMaturitySummary(ctx),
    realPublicOperations: buildRealPublicOperationsMaturitySummary(ctx),
    generatedAt: new Date().toISOString(),
    releaseMeta: {
      phase: "real-public-operations",
      generatedAt: new Date().toISOString(),
      reviewOwner: "beta-ops",
    },
  };
}

export function buildBetaStabilizationBundle(ctx = {}) {
  return buildControlledGrowthBundle(ctx);
}
