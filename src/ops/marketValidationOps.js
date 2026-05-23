/**
 * Market validation — retention and return-trust signals from session buffer.
 */

import { listUsageLearningEvents } from "./usageLearningBuffer.js";
import { computeRetentionSignals } from "./retentionSignals.js";
import { computeAdoptionSignals } from "./authorityDistributionOps.js";

export { computeRetentionSignals } from "./retentionSignals.js";

const MV_WEEKLY_KEY = "evsavari-market-validation-weekly-v1";

function readWeekly() {
  try {
    const raw = localStorage.getItem(MV_WEEKLY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeWeekly(arr) {
  try {
    localStorage.setItem(MV_WEEKLY_KEY, JSON.stringify(arr.slice(0, 10)));
  } catch {
    /* quota */
  }
}

export function recordMarketValidationWeekly(snapshot) {
  const week = new Date().toISOString().slice(0, 10);
  const filtered = readWeekly().filter((s) => s.week !== week);
  writeWeekly([{ week, at: new Date().toISOString(), ...snapshot }, ...filtered]);
}

export function getMarketValidationWeeklySnapshots() {
  return readWeekly().slice(0, 8);
}

/**
 * @param {object} ctx
 */
export function buildMarketValidationReport(ctx = {}) {
  const events = listUsageLearningEvents();
  const retention = computeRetentionSignals(events);
  const adoption = computeAdoptionSignals(events);
  const prev = getMarketValidationWeeklySnapshots()[1];
  const refinement = ctx.refinement;
  const content = ctx.contentUsefulness;

  const retentionMaturityTrend =
    prev?.trustedSessionRatio != null &&
    retention.trustedSessionRatio != null &&
    retention.trustedSessionRatio > prev.trustedSessionRatio + 5
      ? "improving"
      : "stable";

  const platformLearningEffectively =
    refinement?.recommendationResilienceTrend !== "fragile" &&
    (content?.guideEngagementQuality !== "emerging" || !content);

  const scalingTrustDurability =
    retention.retentionQualityHealthy &&
    refinement?.recommendationStabilityPersistence === "durable"
      ? "durable"
      : "developing";

  const repeatUserStability =
    retention.returnUserTrustTrend === "stable" ||
    retention.returnUserTrustTrend === "improving"
      ? "stable"
      : "watch";

  const recommendationConfidenceStability =
    refinement?.compareConfidenceStabilization === "stabilizing"
      ? "stable"
      : "watch";

  const trustedReturnUserPersistence = retention.trustedReturnUserPersistence;
  const compareQualityUnderLoad =
    retention.compareCompletionRetention != null &&
    retention.compareCompletionRetention >= 45
      ? "holding"
      : "review";

  const authorityRetentionStability =
    content?.authorityUsefulnessPersistence === "persistent" ||
    content?.authorityRetentionTrend === "improving"
      ? "stable"
      : "watch";

  const scalingReadinessSnapshot = {
    scalingTrustDurability,
    repeatUserStability,
    trustedSessionRatio: retention.trustedSessionRatio,
  };

  const trustStabilitySummary = {
    returnUserTrustTrend: retention.returnUserTrustTrend,
    compareQualityUnderLoad,
    recommendationConfidenceStability,
  };

  const recommendationDurabilitySummary = {
    stability: refinement?.recommendationStabilityPersistence,
    usefulness: refinement?.recommendationUsefulnessPersistence,
  };

  const realTrafficQuality =
    retention.retentionQualityHealthy && adoption.authorityEntryQuality >= 50
      ? "healthy"
      : "watch";

  const trustedDiscoveryUnderScale =
    adoption.trustedDiscoveryQuality === "trusted" ||
    adoption.trustedDiscoveryQuality === "healthy"
      ? "stable"
      : "developing";

  const repeatUserAcquisitionQuality = adoption.repeatUserDiscoveryQuality;
  const compareDepthUnderTraffic =
    retention.compareCompletionRetention != null &&
    retention.compareCompletionRetention >= 45
      ? "deep"
      : "shallow";

  const authorityEntryDurability =
    adoption.compareAfterGuidePersistence === "strong" ||
    adoption.guideEntryRetention === "strong"
      ? "durable"
      : "developing";

  const practicalContentEntryQuality = adoption.ownershipGuideEntryQuality;

  const trafficQualityHealthy = realTrafficQuality === "healthy";
  const discoveryQualityStable = trustedDiscoveryUnderScale === "stable";
  const trustedEntryJourneysDurable = authorityEntryDurability === "durable";

  const readyForBroaderPublicTraffic =
    scalingTrustDurability === "durable" &&
    trafficQualityHealthy &&
    repeatUserStability === "stable" &&
    refinement?.recommendationDurabilityPersistence === "durable";

  const trafficQualityPersistence =
    realTrafficQuality === "healthy" ? "persistent" : "watch";

  const trustedEntryDurability = trustedEntryJourneysDurable ? "durable" : "developing";

  const repeatUserAcquisitionPersistence =
    repeatUserStability === "stable" ? "persistent" : "emerging";

  const authorityEntryStability = authorityEntryDurability;
  const practicalEntryQuality = practicalContentEntryQuality;

  const trustedDiscoveryHealthy =
    trustedDiscoveryUnderScale === "stable" || discoveryQualityStable;

  const readyForWiderPublicTraffic = readyForBroaderPublicTraffic;

  recordMarketValidationWeekly({
    trustedSessionRatio: retention.trustedSessionRatio,
    repeatCompareRetention: retention.repeatCompareRetention,
    returnUserTrustTrend: retention.returnUserTrustTrend,
    scalingTrustDurability,
    realTrafficQuality,
  });

  return {
    ...retention,
    ...adoption,
    retentionMaturityTrend,
    weeklyMarketValidationSnapshots: getMarketValidationWeeklySnapshots(),
    platformLearningEffectively,
    usersReturningTrustImproving: retention.returnUserTrustTrend === "improving",
    authorityUsefulnessCompounding:
      content?.authorityRetentionTrend === "improving" ||
      content?.guideUsefulnessTrend === "improving",
    recommendationQualityStabilizing:
      refinement?.compareConfidenceStabilization === "stabilizing" ||
      refinement?.recommendationsImprovingOverTime === true,
    retentionQualityHealthy: retention.retentionQualityHealthy,
    scalingTrustDurability,
    repeatUserStability,
    recommendationConfidenceStability,
    trustedReturnUserPersistence,
    compareQualityUnderLoad,
    authorityRetentionStability,
    scalingReadinessSnapshots: scalingReadinessSnapshot,
    trustStabilitySummary,
    recommendationDurabilitySummary,
    realTrafficQuality,
    trustedDiscoveryUnderScale,
    repeatUserAcquisitionQuality,
    compareDepthUnderTraffic,
    authorityEntryDurability,
    practicalContentEntryQuality,
    trafficQualityHealthy,
    discoveryQualityStable,
    trustedEntryJourneysDurable,
    readyForBroaderPublicTraffic,
    trafficQualityPersistence,
    trustedEntryDurability,
    repeatUserAcquisitionPersistence,
    authorityEntryStability,
    practicalEntryQuality,
    trustedDiscoveryHealthy,
    readyForWiderPublicTraffic,
    generatedAt: new Date().toISOString(),
    exportMeta: {
      reportType: "market-validation",
      version: 2,
      generatedAt: new Date().toISOString(),
      reviewOwner: "market-ops",
      retentionQualityReviewAt: new Date().toISOString(),
      recommendationDurabilityReviewAt: new Date().toISOString(),
      retentionAuthorityReviewAt: new Date().toISOString(),
      communityDiscoveryReviewAt: new Date().toISOString(),
      conversionRetentionReviewAt: new Date().toISOString(),
      publicAuthorityReviewAt: new Date().toISOString(),
      trustedDiscoveryReviewAt: new Date().toISOString(),
      trustedGrowthReviewAt: new Date().toISOString(),
      retentionHabitReviewAt: new Date().toISOString(),
    },
  };
}
