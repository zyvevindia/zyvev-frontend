/**
 * Public beta operations — weekly snapshot, stability score, trend readiness.
 */

import { buildOperationalConfidenceReport } from "./operationalConfidenceOps.js";
import { buildCompareCalibrationReport } from "./compareCalibrationOps.js";
import { buildConversionInsightsReport } from "./conversionInsightsOps.js";
import { CALIBRATION_STATUS } from "./compareCalibrationOps.js";
import { buildFreshnessAutomationReport } from "./catalogFreshnessAutomation.js";
import { buildFeedbackPrioritizationReport } from "./feedbackPrioritizationOps.js";
import { buildSeoAuthorityReport } from "./seoAuthorityOps.js";
import { buildAnalyticsMaturityReport } from "./analyticsMaturityOps.js";
import { summarizeTier1MediaHealth, buildTier1FamilyMediaRows } from "./tier1MediaHealth.js";
import { buildRecommendationRealismReport } from "./recommendationRealismOps.js";
import { buildPremiumJourneyReport } from "./premiumJourneyOps.js";
import { buildAuthorityDepthReport } from "./authorityDepthOps.js";
import { buildConversionQualityReport } from "./conversionQualityOps.js";
import { buildTrustedConversionReport } from "./trustedConversionOps.js";
import { buildPremiumOwnershipJourneyReport } from "./premiumOwnershipJourneyOps.js";
import { buildOwnershipAuthorityReport } from "./ownershipAuthorityOps.js";
import { REALISM_STATUS } from "./recommendationRealismOps.js";
import {
  recordTrustedBetaWeeklySnapshot,
  getTrustedBetaWeeklySnapshots,
} from "./trustedBetaOps.js";
import {
  buildBehavioralTrustReport,
  getBehavioralTrustWeeklySnapshots,
} from "./behavioralTrustOps.js";
import { buildCatalogIntelligenceReport } from "./catalogIntelligenceOps.js";
import { buildBehavioralIntelligenceReport } from "./behavioralIntelligenceOps.js";
import { buildMediaStagingReport } from "./mediaStagingOps.js";
import { buildPerformanceReliabilityReport } from "./performanceReliabilityOps.js";
import { buildPublicBetaCockpit } from "./trustFeedbackOps.js";
import { buildControlledGrowthBundle } from "./betaStabilizationOps.js";
import { listUsageLearningEvents } from "./usageLearningBuffer.js";
import { buildOwnershipRealismReport } from "./ownershipRealismOps.js";
import { buildRecommendationMaturityReport } from "./recommendationMaturityOps.js";

const WEEKLY_KEY = "evsavari-public-beta-weekly-v1";
const MAX_WEEKS = 8;

function readWeekly() {
  try {
    const raw = localStorage.getItem(WEEKLY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeWeekly(arr) {
  try {
    localStorage.setItem(WEEKLY_KEY, JSON.stringify(arr.slice(0, MAX_WEEKS)));
  } catch {
    /* quota */
  }
}

export function recordPublicBetaWeeklySnapshot(snapshot) {
  const week = new Date().toISOString().slice(0, 10);
  const filtered = readWeekly().filter((s) => s.week !== week);
  writeWeekly([{ week, at: new Date().toISOString(), ...snapshot }, ...filtered]);
}

/**
 * @param {object} ctx — from loadPostLaunchOpsContext
 */
export async function buildPublicBetaOpsReport(ctx = {}) {
  const behavioralTrust = buildBehavioralTrustReport(ctx);
  const realism = buildRecommendationRealismReport(ctx);
  const premium = buildPremiumJourneyReport(ctx);
  const authority = buildAuthorityDepthReport(ctx);
  const conversionQuality = buildConversionQualityReport(ctx);
  const trustedConversion = buildTrustedConversionReport(ctx);
  const premiumOwnership = buildPremiumOwnershipJourneyReport(ctx);
  const ownershipAuthority = buildOwnershipAuthorityReport(ctx);
  const calibration = buildCompareCalibrationReport(ctx);
  const conversion = buildConversionInsightsReport(ctx);
  const freshness = buildFreshnessAutomationReport({
    cars: ctx.cars,
    traffic: ctx.traffic,
  });
  const feedback = buildFeedbackPrioritizationReport();
  const seo = buildSeoAuthorityReport({
    ...ctx,
    usageEvents: listUsageLearningEvents(),
  });
  const analytics = buildAnalyticsMaturityReport(ctx);
  const mediaRows = buildTier1FamilyMediaRows();
  const mediaSummary = summarizeTier1MediaHealth(mediaRows);
  const catalogIntelligence = buildCatalogIntelligenceReport(ctx);
  const behavioralIntelligence = buildBehavioralIntelligenceReport(ctx);
  const mediaStaging = buildMediaStagingReport();
  const performanceReliability = buildPerformanceReliabilityReport({
    ...ctx,
    freshnessEscalations:
      freshness.queue?.filter((q) => q.escalated)?.length ?? 0,
  });
  const ownershipRealism = buildOwnershipRealismReport(ctx);
  const recommendationMaturity = buildRecommendationMaturityReport(ctx);
  const cockpit = buildPublicBetaCockpit(ctx);
  const stabilization = buildControlledGrowthBundle({
    ...ctx,
    usageEvents: listUsageLearningEvents(),
  });

  let confidence = null;
  try {
    confidence = await buildOperationalConfidenceReport();
  } catch {
    confidence = { operationalConfidenceIndex: 0, trend: "unknown" };
  }

  const trustedRealismPct =
    realism.rows.length > 0
      ? Math.round(
          ((realism.statusCounts[REALISM_STATUS.TRUSTED] +
            realism.statusCounts[REALISM_STATUS.GOOD]) /
            realism.rows.length) *
            100
        )
      : 0;

  const premiumReadyPct = premium.premiumReadyPct;
  const authorityDepthScore = authority.avgAuthorityDepthScore;
  const conversionTrustScore = conversionQuality.overallConversionTrust;

  const calibratedPairs =
    calibration.statusCounts[CALIBRATION_STATUS.CALIBRATED] +
    calibration.statusCounts[CALIBRATION_STATUS.ACCEPTABLE];
  const compareTrustPct =
    calibration.rows.length > 0
      ? Math.round((calibratedPairs / calibration.rows.length) * 100)
      : 0;

  const recommendationMaturityTrend = getTrustedBetaWeeklySnapshots();
  const prevTrust = recommendationMaturityTrend[1]?.trustedRealismPct;
  const realismTrend =
    prevTrust != null && trustedRealismPct < prevTrust - 8
      ? "declining"
      : prevTrust != null && trustedRealismPct > prevTrust + 5
        ? "improving"
        : "stable";

  const recommendationMaturityScore = Math.round(
    (realism.avgRealismScore ?? 0) * 0.4 +
      catalogIntelligence.trustedPct * 0.35 +
      behavioralIntelligence.engagementQuality * 0.25
  );

  const operationalTrustScore = Math.round(
    (trustedRealismPct * 0.22 +
      catalogIntelligence.trustedPct * 0.2 +
      compareTrustPct * 0.18 +
      conversionTrustScore * 0.15 +
      (mediaSummary.avgCompletenessPercent ?? 0) * 0.15 +
      behavioralIntelligence.engagementQuality * 0.1) 
  );

  const betaStabilityScore = Math.round(
    (confidence?.operationalConfidenceIndex ?? 50) * 0.2 +
      premiumReadyPct * 0.15 +
      trustedRealismPct * 0.15 +
      conversionTrustScore * 0.12 +
      authorityDepthScore * 0.08 +
      analytics.maturityScore * 0.08 +
      recommendationMaturityScore * 0.12 +
      operationalTrustScore * 0.1
  );

  const betaConfidenceEvolution =
    betaStabilityScore >= 75
      ? "trusted_beta_ready"
      : betaStabilityScore >= 60
        ? "controlled_beta"
        : "calibration_needed";

  const readinessTrend =
    confidence?.trend === "improving"
      ? "improving"
      : confidence?.trend === "declining"
        ? "watch"
        : "stable";

  const behavioralTrustPct = behavioralTrust.trustedPct;
  const prevBehavioral = getBehavioralTrustWeeklySnapshots()[1]?.avgBehavioralTrust;
  const behavioralTrustTrend =
    prevBehavioral != null && behavioralTrust.avgBehavioralTrust < prevBehavioral - 6
      ? "decay_watch"
      : prevBehavioral != null && behavioralTrust.avgBehavioralTrust > prevBehavioral + 4
        ? "improving"
        : "stable";

  const decayAlerts = [
    ...(behavioralTrust.trustDecayAlerts || []),
    ...(performanceReliability.mediaRegressionAlert
      ? [{ code: "media_regression", severity: "watch" }]
      : []),
    ...(performanceReliability.compareLatencyAlert
      ? [{ code: "compare_latency", severity: "watch" }]
      : []),
    ...(catalogIntelligence.statusCounts?.LOW_CONFIDENCE > 3
      ? [{ code: "low_confidence_catalog", severity: "watch" }]
      : []),
  ];

  const trustSnapshot = {
    betaStabilityScore,
    recommendationMaturityScore,
    operationalTrustScore,
    operationalConfidence: confidence?.operationalConfidenceIndex,
    trustedRealismPct,
    premiumReadyPct,
    authorityDepthScore,
    conversionTrustScore,
    behavioralTrustPct,
    avgBehavioralTrust: behavioralTrust.avgBehavioralTrust,
    avgOwnershipRealism: behavioralTrust.avgOwnershipRealism,
    avgChargingPracticality: behavioralTrust.avgChargingPracticality,
    trustDecayAlerts: decayAlerts.length,
    recommendationMaturityAvg: realism.avgRealismScore,
    compareTrustPct,
    mediaCompletenessPct: mediaSummary.avgCompletenessPercent ?? 0,
    catalogIntelligenceTrustedPct: catalogIntelligence.trustedPct,
    behavioralEngagementQuality: behavioralIntelligence.engagementQuality,
    freshnessEscalations: freshness.queue?.filter((q) => q.escalated)?.length ?? 0,
    highImpactFeedback: feedback.highImpactIssues?.length ?? 0,
  };

  recordPublicBetaWeeklySnapshot(trustSnapshot);
  recordTrustedBetaWeeklySnapshot(trustSnapshot);

  return {
    betaStabilityScore,
    betaConfidenceEvolution,
    readinessTrend,
    realismTrend,
    behavioralTrustTrend,
    weeklySnapshots: readWeekly().slice(0, 6),
    trustWeeklySnapshots: getTrustedBetaWeeklySnapshots(),
    behavioralTrustWeeklySnapshots: behavioralTrust.weeklySnapshots,
    operationalConfidence: confidence,
    behavioralTrust,
    premiumOwnership: {
      premiumReadyPct: premiumOwnership.premiumReadyPct,
      goalMet: premiumOwnership.goalMet,
      avgOwnershipRealism: premiumOwnership.avgOwnershipRealism,
      avgChargingRealism: premiumOwnership.avgChargingRealism,
    },
    ownershipAuthority: {
      authorityEcosystemScore: ownershipAuthority.authorityEcosystemScore,
      authorityMaturityLevel: ownershipAuthority.authorityMaturityLevel,
    },
    realism,
    premium,
    authority,
    conversionQuality,
    trustedRealismPct,
    behavioralTrustPct,
    behavioralTrustTrend,
    premiumReadyPct,
    premiumGoalMet: premium.goalMet,
    trustDecayAlertCount: decayAlerts.length,
    decayAlerts,
    recommendationMaturityScore,
    operationalTrustScore,
    recommendationTrustEvolution: realismTrend,
    compareMaturityEvolution: compareTrustPct >= 70 ? "mature" : "developing",
    ownershipRealismTrend:
      catalogIntelligence.avgOwnershipConfidence >= 65
        ? "stable"
        : "needs_review",
    chargingPracticalityTrend:
      catalogIntelligence.avgChargingPracticality >= 65
        ? "stable"
        : "needs_review",
    premiumReadinessTrend: premiumReadyPct >= 85 ? "ready" : "building",
    mediaQualityTrend:
      (mediaSummary.avgCompletenessPercent ?? 0) >= 80
        ? "stable"
        : "improving",
    conversionTrustTrend:
      conversionTrustScore >= 70 ? "trusted" : "developing",
    weakCompareClusterTrend:
      behavioralIntelligence.weakRecommendationClusters?.length > 2
        ? "elevated"
        : "stable",
    catalogIntelligence,
    behavioralIntelligence,
    mediaStaging,
    performanceReliability,
    authorityDepthScore,
    conversionTrustScore,
    calibration: {
      statusCounts: calibration.statusCounts,
      compareTrustPct,
      needsEditorial: calibration.needsEditorial?.length ?? 0,
    },
    conversion,
    conversionQualitySummary: {
      overallConversionTrust: conversionQuality.overallConversionTrust,
      avgJourneyMaturity: conversionQuality.avgJourneyMaturity,
      trustUpliftProxy: conversionQuality.trustUpliftProxy,
    },
    trustedConversion: {
      avgConversionTrust: trustedConversion.avgConversionTrust,
      highConfidence: trustedConversion.statusCounts.HIGH_CONFIDENCE,
      needsReview: trustedConversion.statusCounts.NEEDS_REVIEW,
      analyticsConfidence: trustedConversion.analytics?.analyticsConfidence,
      multiSessionMaturity:
        trustedConversion.multiSession?.multiSessionMaturityScore,
      mobileFriction: trustedConversion.analytics?.device?.mobileFrictionSeverity,
    },
    trustedConversion,
    freshness: {
      immediate: freshness.queue?.filter((q) => q.reviewUrgency === "immediate")
        ?.length ?? 0,
      escalated: freshness.queue?.filter((q) => q.escalated)?.length ?? 0,
    },
    feedback: {
      highImpact: feedback.highImpactIssues?.slice(0, 6) ?? [],
      topIssues: feedback.recurringIssues?.slice(0, 5) ?? [],
    },
    seo: {
      clusterAuthorityScore: seo.clusterAuthorityScore,
      compareSeoMaturity: seo.compareSeoMaturity,
      authorityDepthTrend: seo.authorityDepthTrend,
      topicalAuthorityScore: seo.topicalAuthorityScore,
    },
    analytics,
    media: mediaSummary,
    cockpit,
    stabilization,
    ownershipRealism,
    recommendationMaturity,
    generatedAt: new Date().toISOString(),
    releaseMeta: stabilization.stability?.releaseMeta,
  };
}
