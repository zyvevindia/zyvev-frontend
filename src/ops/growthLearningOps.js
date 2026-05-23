/**
 * Controlled growth learning — aggregates traffic + buffer (no new scoring engines).
 */

import { listUsageLearningEvents } from "./usageLearningBuffer.js";
import { aggregateCompareBehavior } from "./behavioralTrustOps.js";
import { buildBehavioralIntelligenceReport } from "./behavioralIntelligenceOps.js";
import { buildTrustConversionSignals } from "./betaStabilizationOps.js";
import { classifyAcquisitionLabel } from "../utils/acquisitionContext.js";
import { rankCompareDropOffHotspots } from "./trafficObservationOps.js";
import { getTrustedBetaWeeklySnapshots } from "./trustedBetaOps.js";
import { buildAcquisitionCalibrationReport } from "./acquisitionCalibrationOps.js";
import { computeRetentionSignals } from "./retentionSignals.js";
import { computeAdoptionSignals } from "./authorityDistributionOps.js";

const GROWTH_WEEKLY_KEY = "evsavari-growth-learning-weekly-v1";

function readWeekly() {
  try {
    const raw = localStorage.getItem(GROWTH_WEEKLY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeWeekly(arr) {
  try {
    localStorage.setItem(GROWTH_WEEKLY_KEY, JSON.stringify(arr.slice(0, 10)));
  } catch {
    /* quota */
  }
}

export function recordGrowthLearningWeekly(snapshot) {
  const week = new Date().toISOString().slice(0, 10);
  const filtered = readWeekly().filter((s) => s.week !== week);
  writeWeekly([{ week, at: new Date().toISOString(), ...snapshot }, ...filtered]);
}

export function getGrowthLearningWeeklySnapshots() {
  return readWeekly().slice(0, 8);
}

function acquisitionFromEvents(events) {
  const counts = {};
  for (const e of events) {
    const ch =
      e.meta?.acquisitionChannel ||
      classifyAcquisitionLabel(e.meta?.utmSource || e.meta?.referrerHost);
    counts[ch] = (counts[ch] || 0) + 1;
  }
  return Object.entries(counts)
    .map(([channel, count]) => ({ channel, count }))
    .sort((a, b) => b.count - a.count);
}

function acquisitionFromTraffic(traffic = {}) {
  const bySource = traffic.conversionRateBySource || [];
  return bySource.map((row) => ({
    source: row.source || row.label || "unknown",
    channel: classifyAcquisitionLabel(row.source || row.label),
    conversionRate: row.rate ?? row.conversionRate ?? null,
    leads: row.leads ?? row.count ?? 0,
  }));
}

function compareDepthTrend(events) {
  const depths = events
    .filter((e) => e.type === "compare_started" && e.meta?.depth)
    .map((e) => Number(e.meta.depth));
  if (!depths.length) return { avgDepth: null, trend: "stable" };
  const avg = Math.round(
    depths.reduce((n, d) => n + d, 0) / depths.length
  );
  return { avgDepth: avg, trend: avg >= 2.5 ? "deepening" : "shallow" };
}

/**
 * @param {object} ctx
 */
export function buildGrowthLearningReport(ctx = {}) {
  const events = listUsageLearningEvents();
  const traffic = ctx.traffic || {};
  const behavioral = buildBehavioralIntelligenceReport(ctx);
  const trustConversion = buildTrustConversionSignals(ctx);
  const { global, byPair } = aggregateCompareBehavior(events);

  const acquisitionTrend = acquisitionFromTraffic(traffic);
  const bufferAcquisition = acquisitionFromEvents(events);
  const repeatVisitors = events.filter(
    (e) =>
      e.type === "repeated_ev_interest" || e.type === "multi_session_compare"
  ).length;
  const compareSessionGrowth = global.compare_started || 0;
  const compareDepth = compareDepthTrend(events);

  const trustedTrafficSources = acquisitionTrend
    .filter((s) => s.conversionRate >= 15 || s.leads >= 2)
    .slice(0, 6);

  const highBounceAcquisition = rankCompareDropOffHotspots(
    traffic.compareTrends || []
  ).map((r) => ({
    pairSlug: r.slug || r.pairSlug,
    completionRate: r.completionRate,
    started: r.started,
  }));

  const lowQualityClusters = Object.entries(byPair)
    .filter(([, row]) => row.started >= 2 && row.abandoned > row.completed)
    .map(([pairSlug, row]) => ({
      pairSlug,
      started: row.started,
      abandoned: row.abandoned,
      doubted: row.doubted || 0,
    }))
    .slice(0, 8);

  const trustedCompareEntryPaths = (traffic.topComparePages || [])
    .slice(0, 8)
    .map((r) => ({
      path: `/compare/${r.label}`,
      views: r.count,
    }));

  const repeatUserConfidenceTrend =
    repeatVisitors >= 3 && behavioral.compareCompletionPct >= 40
      ? "strengthening"
      : repeatVisitors > 0
        ? "emerging"
        : "early";

  const referralSourceQuality =
    trustedTrafficSources.length > 0 ? "mixed_positive" : "insufficient_data";

  const prev = getGrowthLearningWeeklySnapshots()[1];
  const acquisitionTrendDirection =
    compareSessionGrowth > (prev?.compareSessions ?? 0) + 2
      ? "growing"
      : compareSessionGrowth < (prev?.compareSessions ?? 0) - 2
        ? "cooling"
        : "stable";

  const acquisitionCalibration = buildAcquisitionCalibrationReport(ctx);
  const retention = computeRetentionSignals(events);
  const adoption = computeAdoptionSignals(events);

  recordGrowthLearningWeekly({
    compareSessions: compareSessionGrowth,
    repeatVisitors,
    compareCompletionPct: behavioral.compareCompletionPct,
    trustAssistedLeads: trustConversion.trustAssistedConversionIndicator,
    avgAcquisitionQuality: acquisitionCalibration.acquisitionQualityScore,
  });

  return {
    acquisitionQualityScore: acquisitionCalibration.acquisitionQualityScore,
    trustedVisitorRatio: acquisitionCalibration.trustedVisitorRatio,
    compareDepthBySource: acquisitionCalibration.compareDepthBySource,
    repeatUserQualityBySource:
      acquisitionCalibration.highestReturnVisitorQuality,
    lowTrustAcquisitionClusters:
      acquisitionCalibration.lowQualityTrafficClusters,
    bounceAfterGuidanceBySource:
      acquisitionCalibration.bounceAfterGuidanceBySource,
    leadConfidenceBySource: acquisitionCalibration.leadConfidenceBySource,
    trustAssistedConversionBySource:
      acquisitionCalibration.trustAssistedConversionBySource,
    bestAcquisitionSources: acquisitionCalibration.bestAcquisitionSources,
    weakAcquisitionSources: acquisitionCalibration.weakAcquisitionSources,
    mostTrustedTraffic: acquisitionCalibration.mostTrustedTraffic,
    lowQualityTrafficClusters:
      acquisitionCalibration.lowQualityTrafficClusters,
    highDepthCompareSessions:
      acquisitionCalibration.highDepthCompareSessions,
    highestReturnVisitorQuality:
      acquisitionCalibration.highestReturnVisitorQuality,
    acquisitionCalibration,
    returnUserTrustTrend: retention.returnUserTrustTrend,
    repeatCompareRetention: retention.repeatCompareRetention,
    repeatCompareConfidence: retention.repeatCompareConfidence,
    returnUserConversionQuality: retention.returnUserConversionQuality,
    trustedSessionRatio: retention.trustedSessionRatio,
    compareCompletionRetention: retention.compareCompletionRetention,
    recommendationReturnEngagement: retention.recommendationReturnEngagement,
    compareRevisitQuality: retention.compareRevisitQuality,
    returnUserTrustHealth: retention.returnUserTrustHealth,
    repeatCompareQuality: retention.repeatCompareQuality,
    trustedRepeatVisitors: retention.trustedRepeatVisitors,
    weakRetentionJourneys: retention.weakRetentionJourneys,
    recommendationRevisitQuality: retention.recommendationRevisitQuality,
    highReturnComparePairs: retention.highReturnComparePairs,
    retentionQualitySnapshot: retention.retentionQualitySnapshot,
    recommendationRetentionSummary: retention.recommendationRetentionSummary,
    returnUserTrustEvolution: retention.returnUserTrustEvolution,
    usersReturningForRecommendations: adoption.usersReturningForRecommendations,
    mostRevisitedCompareJourneys: adoption.mostRevisitedCompareJourneys,
    mostRevisitedOwnershipGuides: adoption.mostRevisitedOwnershipGuides,
    trustedRepeatUserFlows: adoption.trustedRepeatUserFlows,
    weakRetentionCompareClusters: adoption.weakRetentionCompareClusters,
    bestAuthorityAcquisitionPaths: adoption.bestAuthorityAcquisitionPaths,
    highestTrustContentJourneys: adoption.highestTrustContentJourneys,
    strongAuthorityToCompareFlows: adoption.strongAuthorityToCompareFlows,
    weakAuthorityRetentionPaths: adoption.weakAuthorityRetentionPaths,
    mostUsefulAcquisitionContent: adoption.mostUsefulAcquisitionContent,
    authorityDistributionSummary: adoption.authorityDistributionSummary,
    trustedDiscoverySnapshot: adoption.trustedDiscoverySnapshot,
    authorityRetentionEvolution: adoption.authorityRetentionEvolution,
    communityShareQuality: adoption.communityShareQuality,
    compareShareDepth: adoption.compareShareDepth,
    trustedReferralQuality: adoption.trustedReferralQuality,
    whatsappLinkedinDiscoveryQuality: adoption.whatsappLinkedinDiscoveryQuality,
    authoritySharingRetention: adoption.authoritySharingRetention,
    compareShareConversionQuality: adoption.compareShareConversionQuality,
    repeatUserReferralQuality: adoption.repeatUserReferralQuality,
    highestTrustReferralPaths: adoption.highestTrustReferralPaths,
    bestCommunityDiscovery: adoption.bestCommunityDiscovery,
    weakShareJourneys: adoption.weakShareJourneys,
    mostSharedCompareFlows: adoption.mostSharedCompareFlows,
    strongAuthoritySharingPaths: adoption.strongAuthoritySharingPaths,
    communityDiscoveryMaturity: adoption.communityDiscoveryMaturity,
    retentionConfidenceTrend: retention.retentionConfidenceTrend,
    repeatCompareDurability: retention.repeatCompareDurability,
    trustedReturnUserPersistence: retention.trustedReturnUserPersistence,
    recommendationRevisitDurability: retention.recommendationRevisitDurability,
    trustedDiscoveryQuality: adoption.trustedDiscoveryQuality,
    practicalEntryRetention: adoption.practicalEntryRetention,
    compareAfterGuidePersistence: adoption.compareAfterGuidePersistence,
    ownershipGuideEntryQuality: adoption.ownershipGuideEntryQuality,
    authorityAssistedCompareDepth: adoption.authorityAssistedCompareDepth,
    trustedSharePersistence: adoption.trustedSharePersistence,
    repeatUserDiscoveryQuality: adoption.repeatUserDiscoveryQuality,
    trustedDiscoverySummary: adoption.trustedDiscoverySummary,
    practicalEntrySnapshot: adoption.practicalEntrySnapshot,
    authorityVisibilitySummary: adoption.authorityVisibilitySummary,
    mostDurableAuthorityEntryJourneys: adoption.mostDurableAuthorityEntryJourneys,
    weakPracticalDiscovery: adoption.weakPracticalDiscovery,
    strongOwnershipGuideEntry: adoption.strongOwnershipGuideEntry,
    usersReturningBecauseRecommendationsHelp:
      retention.usersReturningBecauseRecommendationsHelp,
    mostRevisitedCompareJourneys: retention.mostRevisitedCompareJourneys,
    strongRecommendationRevisitTrust: retention.strongRecommendationRevisitTrust,
    weakRepeatUseFlows: retention.weakRepeatUseFlows,
    mostDurableOwnershipGuidance: retention.mostDurableOwnershipGuidance,
    acquisitionTrendSummary: acquisitionTrend,
    bufferAcquisitionChannels: bufferAcquisition,
    repeatVisitorTrend: repeatUserConfidenceTrend,
    compareSessionGrowth,
    compareSessionTrend: acquisitionTrendDirection,
    trustAssistedLeadTrend: trustConversion.compareLeadConfidenceTrend,
    referralSourceQuality,
    compareDepthTrend: compareDepth,
    trustedTrafficSources,
    highBounceAcquisitionSources: highBounceAcquisition,
    lowQualityTrafficClusters: lowQualityClusters,
    repeatUserConfidenceTrend,
    trustedCompareEntryPaths,
    realTrafficQuality:
      retention.retentionQualityHealthy ||
      retention.returnUserTrustTrend === "improving" ||
      retention.returnUserTrustTrend === "stable"
        ? "healthy"
        : "watch",
    trustedDiscoveryUnderScale: adoption.trustedDiscoveryQuality,
    repeatUserAcquisitionQuality: adoption.repeatUserDiscoveryQuality,
    compareDepthUnderTraffic: compareDepth,
    authorityEntryDurability:
      adoption.compareAfterGuidePersistence === "strong" ||
      adoption.guideEntryRetention === "strong"
        ? "durable"
        : "developing",
    practicalContentEntryQuality: adoption.ownershipGuideEntryQuality,
    trafficQualityHealthy:
      retention.retentionQualityHealthy ||
      retention.returnUserTrustTrend === "improving",
    discoveryQualityStable:
      adoption.trustedDiscoveryQuality === "trusted" ||
      adoption.trustedDiscoveryQuality === "healthy",
    trustedEntryJourneysDurable:
      (adoption.mostDurableAuthorityEntryJourneys || []).length >= 1,
    readyForBroaderPublicTraffic:
      retention.retentionQualityHealthy &&
      adoption.authorityEntryQuality >= 55 &&
      behavioral.compareCompletionPct >= 40,
    trafficQualityPersistence:
      retention.retentionQualityHealthy ||
      retention.returnUserTrustTrend === "stable"
        ? "persistent"
        : "watch",
    trustedEntryDurability:
      adoption.compareAfterGuidePersistence === "strong" ||
      adoption.guideEntryRetention === "strong"
        ? "durable"
        : "developing",
    repeatUserAcquisitionPersistence:
      adoption.repeatUserDiscoveryQuality === "strong" ? "persistent" : "emerging",
    authorityEntryStability:
      adoption.compareAfterGuidePersistence === "strong" ? "stable" : "watch",
    practicalEntryQuality: adoption.ownershipGuideEntryQuality,
    trustedDiscoveryHealthy:
      adoption.trustedDiscoveryQuality === "trusted" ||
      adoption.trustedDiscoveryQuality === "healthy",
    readyForWiderPublicTraffic:
      retention.retentionQualityHealthy &&
      adoption.authorityEntryQuality >= 55 &&
      behavioral.compareCompletionPct >= 40,
    weeklySnapshots: getGrowthLearningWeeklySnapshots(),
    generatedAt: new Date().toISOString(),
    exportMeta: {
      reportType: "growth-learning",
      version: 4,
      generatedAt: new Date().toISOString(),
      privacyNote: "Channel labels only — no fingerprinting",
    },
  };
}
