/**
 * Conversion refinement — extends trust conversion signals from existing ops.
 */

import { listUsageLearningEvents } from "./usageLearningBuffer.js";
import { aggregateCompareBehavior } from "./behavioralTrustOps.js";
import { buildTrustConversionSignals } from "./betaStabilizationOps.js";
import { buildConversionInsightsReport } from "./conversionInsightsOps.js";
import { buildTrustedConversionReport } from "./trustedConversionOps.js";
import { buildBehavioralIntelligenceReport } from "./behavioralIntelligenceOps.js";

/**
 * @param {object} ctx
 */
export function buildConversionRefinementReport(ctx = {}) {
  const events = listUsageLearningEvents();
  const base = buildTrustConversionSignals(ctx);
  const insights = buildConversionInsightsReport(ctx);
  const trusted = buildTrustedConversionReport(ctx);
  const behavioral = buildBehavioralIntelligenceReport(ctx);
  const { global, byPair } = aggregateCompareBehavior(events);

  const repeatCompareBeforeLead = events.filter((e, i, arr) => {
    if (e.type !== "lead_started") return false;
    const prior = arr.slice(i + 1, i + 15);
    return prior.some((p) => p.type === "compare_started");
  }).length;

  const highConfidenceLeadJourneys = (insights.compareLeadRows || [])
    .filter((r) => r.leadConfidence === "high")
    .slice(0, 8);

  const weakCompareToLead = Object.entries(byPair)
    .filter(([, row]) => row.started >= 2 && row.completed === 0)
    .map(([pairSlug, row]) => ({
      pairSlug,
      started: row.started,
      abandoned: row.abandoned,
      tooltips: row.tooltips,
    }))
    .slice(0, 8);

  const highDoubtAbandoned = Object.entries(byPair)
    .filter(([, row]) => (row.doubted || 0) >= 1 && row.abandoned >= 1)
    .map(([pairSlug, row]) => ({ pairSlug, doubted: row.doubted, abandoned: row.abandoned }))
    .slice(0, 8);

  const trustAssistedConversionQuality =
    base.trustAssistedConversionIndicator != null &&
    base.recommendationClarityIndicator >= 60
      ? "healthy"
      : base.trustAssistedConversionIndicator != null
        ? "developing"
        : "insufficient_signal";

  const recommendationAssistedLeadTrend =
    global.compare_confidence_expanded > 0 && global.lead_submitted > 0
      ? global.lead_submitted >= global.lead_started * 0.25
        ? "positive"
        : "weak"
      : "stable";

  const compareConfidenceVsLead =
    behavioral.compareCompletionPct >= 45 && global.lead_submitted > 0
      ? "aligned"
      : behavioral.compareCompletionPct < 30
        ? "misaligned"
        : "watch";

  const strongestTrustConverting = behavioral.topConvertingComparePairs || [];

  const trustedReturnUserLeads = events.filter(
    (e) =>
      e.type === "lead_submitted" &&
      (e.meta?.returnVisitor === true || e.meta?.repeatSession === true)
  ).length;

  const repeatCompareConversionQuality =
    repeatCompareBeforeLead >= 2 && global.lead_submitted > 0
      ? "strong"
      : repeatCompareBeforeLead >= 1
        ? "developing"
        : "early";

  const lowTrustAbandonmentClusters = highDoubtAbandoned.map((r) => ({
    ...r,
    cluster: "compare_doubt_abandon",
  }));

  const compareHesitationBeforeLead = events.filter(
    (e) =>
      e.type === "lead_started" &&
      (e.meta?.hesitation === true ||
        e.meta?.expandedConfidenceBeforeLead === true)
  ).length;

  const guidanceAssistedLeadConfidence =
    global.suitability_guidance_opened > 0 && global.lead_submitted > 0
      ? global.lead_submitted >= global.lead_started * 0.3
        ? "healthy"
        : "building"
      : "insufficient_signal";

  const recommendationConfidenceConversionTrend =
    global.compare_confidence_expanded > 0
      ? global.lead_submitted / Math.max(global.compare_confidence_expanded, 1) >=
        0.15
        ? "positive"
        : "weak"
      : "stable";

  const mostTrustedConversionJourneys = strongestTrustConverting.slice(0, 8);
  const weakTrustToLeadJourneys = weakCompareToLead;
  const highDoubtBeforeLead = highDoubtAbandoned;
  const strongRepeatUserConversions =
    trustedReturnUserLeads >= 1 ? "present" : "emerging";
  const trustedLeadQualityTrend =
    trusted.avgConversionTrust >= 70
      ? "improving"
      : trusted.avgConversionTrust >= 55
        ? "stable"
        : "early";

  const repeatVisitorConversionConfidence = repeatCompareConversionQuality;

  const compareConfidenceLeadQuality =
    compareConfidenceVsLead === "aligned" ? "healthy" : compareConfidenceVsLead;

  const guidanceAssistedLeadMaturity = guidanceAssistedLeadConfidence;

  const highDoubtAbandonmentTrend =
    highDoubtAbandoned.length >= 3
      ? "elevated"
      : highDoubtAbandoned.length >= 1
        ? "watch"
        : "stable";

  const recommendationConfidenceConversionAlignment =
    recommendationConfidenceConversionTrend;

  const highestTrustConversionJourneys = mostTrustedConversionJourneys;
  const weakRecommendationToLeadFlows = weakTrustToLeadJourneys;
  const lowConfidenceLeadPaths = highConfidenceLeadJourneys.length
    ? insights.compareLeadRows
        ?.filter((r) => r.leadConfidence === "low")
        .slice(0, 6) || []
    : weakCompareToLead;
  const strongTrustAssistedJourneys = strongestTrustConverting.slice(0, 6);

  const returnUserLeadConfidence =
    trustedReturnUserLeads >= 1 && global.lead_submitted > 0
      ? "strong"
      : trustedReturnUserLeads >= 1
        ? "developing"
        : "early";

  const repeatCompareBeforeLeadQuality =
    repeatCompareBeforeLead >= 2 ? "mature" : repeatCompareBeforeLead >= 1 ? "developing" : "early";

  const highTrustLeadJourneys = mostTrustedConversionJourneys;
  const lowConfidenceLeadAvoidance =
    highDoubtAbandoned.length >= 2 ? "elevated" : "normal";

  const ownershipGuidanceAssistedConversion =
    global.suitability_guidance_opened > 0 && global.lead_submitted > 0
      ? "present"
      : "emerging";

  const compareConfidenceConversionMaturity =
    compareConfidenceLeadQuality === "healthy" ? "mature" : "developing";

  const highestTrustAssistedLeads = strongTrustAssistedJourneys;
  const highRetentionConversionPaths = highestTrustConversionJourneys;
  const bestOwnershipGuidanceJourneys = Object.entries(byPair)
    .filter(([, row]) => row.guidanceOpened >= 1 && row.completed >= 1)
    .map(([pairSlug, row]) => ({ pairSlug, completed: row.completed }))
    .slice(0, 6);

  const trustAssistedReturnUserConversion =
    trustedReturnUserLeads >= 1 && global.lead_submitted > 0
      ? "strong"
      : "early";

  const compareConfidenceConversionDurability =
    compareConfidenceConversionMaturity === "mature" ? "durable" : "developing";

  const ownershipGuidanceConversionQuality =
    ownershipGuidanceAssistedConversion === "present" ? "healthy" : "emerging";

  const repeatVisitorLeadMaturity = repeatCompareBeforeLeadQuality;

  const lowTrustLeadAvoidance =
    lowConfidenceLeadAvoidance === "elevated" ? "active" : "normal";

  const recommendationConfidenceLeadDurability =
    recommendationConfidenceConversionAlignment === "positive"
      ? "durable"
      : "developing";

  const mostTrustedLeadJourneys = highTrustLeadJourneys;
  const weakTrustAssistedConversions = weakTrustToLeadJourneys;
  const strongOwnershipGuidanceConversions = bestOwnershipGuidanceJourneys;
  const weakConfidenceConversionFlows = lowConfidenceLeadPaths;
  const mostDurableConversionJourneys = highRetentionConversionPaths;

  const repeatUserConversionDurability =
    repeatCompareConversionQuality === "strong" &&
    compareConfidenceConversionDurability === "durable"
      ? "durable"
      : "developing";

  const trustedReturnUserLeadQuality =
    trustedReturnUserLeads >= 2
      ? "strong"
      : trustedReturnUserLeads >= 1
        ? "developing"
        : "early";

  const ownershipGuidanceConversionPersistence =
    ownershipGuidanceConversionQuality === "healthy" ? "persistent" : "emerging";

  const repeatCompareBeforeLeadMaturity = repeatCompareBeforeLeadQuality;

  const recommendationConfidenceConversionTrust =
    recommendationConfidenceLeadDurability === "durable" ? "trusted" : "building";

  const highestTrustRetentionConversions = highestTrustConversionJourneys;
  const strongRepeatUserLeads =
    trustedReturnUserLeads >= 1 ? "present" : "emerging";
  const weakTrustPersistenceBeforeLead =
    highDoubtAbandoned.length >= 2 ? "elevated" : "normal";
  const mostDurableCompareToLeadJourneys = mostDurableConversionJourneys;

  const trustedReturnUserConversionQuality =
    trustedReturnUserLeadQuality === "strong"
      ? "healthy"
      : trustedReturnUserLeadQuality === "developing"
        ? "building"
        : "early";

  const compareConfidenceConversionPersistence = compareConfidenceConversionDurability;
  const ownershipGuidanceConversionTrust = ownershipGuidanceConversionQuality;
  const repeatVisitorLeadDurability = repeatUserConversionDurability;
  const lowTrustLeadAvoidancePersistence =
    lowTrustLeadAvoidance === "active" ? "elevated" : "normal";

  const mostTrustedRepeatUserLeads =
    trustedReturnUserLeads >= 1
      ? [{ count: trustedReturnUserLeads, quality: trustedReturnUserLeadQuality }]
      : [];

  const repeatCompareConversionPersistence = repeatCompareConversionQuality;
  const ownershipGuidanceConversionDurability = ownershipGuidanceConversionPersistence;
  const compareConfidenceLeadPersistence = compareConfidenceConversionDurability;
  const lowTrustAbandonmentPersistence =
    lowTrustLeadAvoidance === "active" ? "elevated" : "normal";

  const usefulnessAssistedConversionQuality =
    guidanceAssistedLeadConfidence === "healthy" &&
    trustAssistedConversionQuality === "healthy"
      ? "strong"
      : "developing";

  const repeatUserLeadPersistence = repeatVisitorLeadDurability;
  const trustedCompareToLeadDurability = mostDurableCompareToLeadJourneys;
  const recommendationConfidenceConversionQuality =
    recommendationConfidenceConversionTrust;

  const highestTrustQualityLeads = highestTrustConversionJourneys;

  const weakCtaClarityHotspots = Object.entries(byPair)
    .filter(([, row]) => row.started >= 2 && row.tooltips >= 2 && row.completed === 0)
    .map(([pairSlug, row]) => ({
      pairSlug,
      tooltips: row.tooltips,
      started: row.started,
    }))
    .slice(0, 6);

  const usefulnessAssistedConversionPersistence =
    usefulnessAssistedConversionQuality === "strong" ? "persistent" : "emerging";

  const repeatUserConversionTrust = trustedReturnUserConversionQuality;
  const trustedCompareToLeadQuality =
    compareConfidenceLeadQuality === "healthy" ? "trusted" : compareConfidenceLeadQuality;
  const weakTrustConversionHotspots = weakCtaClarityHotspots;

  const reassuranceAssistedConversionQuality =
    trustAssistedConversionQuality === "healthy" &&
    usefulnessAssistedConversionQuality === "strong"
      ? "strong"
      : "developing";

  const repeatUserConversionPersistence = repeatUserConversionDurability;
  const trustedCompareToLeadConsistency = trustedCompareToLeadQuality;
  const lowTrustConversionPersistence = lowTrustLeadAvoidancePersistence;

  const weakTrustConsistencyBeforeLead =
    weakTrustPersistenceBeforeLead === "elevated" ? "weak" : "adequate";

  const trustedConversionPersistence =
    trustAssistedConversionQuality === "healthy" ? "persistent" : "emerging";

  const compareToLeadClarityQuality = trustedCompareToLeadQuality;
  const recommendationConfidenceConversionDurability =
    recommendationConfidenceLeadDurability;

  const lowTrustAbandonmentHotspots = lowTrustAbandonmentClusters;

  const conversionQualityUnderTraffic =
    trustAssistedConversionQuality === "healthy" ? "healthy" : "watch";

  const repeatUserLeadDurability = repeatUserConversionPersistence;
  const trustedCompareToLeadPersistence = trustedCompareToLeadConsistency;
  const ownershipGuidanceConversionConsistency = ownershipGuidanceConversionDurability;
  const recommendationConfidenceConversionStability =
    recommendationConfidenceConversionDurability;
  const lowTrustAbandonmentUnderGrowth = lowTrustAbandonmentPersistence;
  const weakTrustConsistencyUnderTraffic = weakTrustConsistencyBeforeLead;

  const conversionPersistenceUnderTraffic =
    conversionQualityUnderTraffic === "healthy" ? "persistent" : "emerging";

  const compareToLeadTrustStability = trustedCompareToLeadPersistence;
  const ownershipGuidanceConversionPersistenceAlias =
    ownershipGuidanceConversionDurability;

  return {
    ...base,
    trustAssistedConversionQuality,
    repeatCompareBeforeLead,
    highConfidenceLeadJourneys,
    recommendationAssistedLeadTrend,
    compareConfidenceVsLeadConversion: compareConfidenceVsLead,
    strongestTrustConvertingJourneys: strongestTrustConverting,
    mostTrustedConversionJourneys,
    weakCompareToLeadPaths: weakCompareToLead,
    weakTrustToLeadJourneys,
    highDoubtAbandonedJourneys: highDoubtAbandoned,
    highDoubtBeforeLead,
    trustedReturnUserLeads,
    repeatCompareConversionQuality,
    lowTrustAbandonmentClusters,
    compareHesitationBeforeLead,
    guidanceAssistedLeadConfidence,
    recommendationConfidenceConversionTrend,
    strongRepeatUserConversions,
    weakCtaClarityHotspots,
    trustedLeadQualityTrend,
    repeatVisitorConversionConfidence,
    compareConfidenceLeadQuality,
    guidanceAssistedLeadMaturity,
    highDoubtAbandonmentTrend,
    recommendationConfidenceConversionAlignment,
    highestTrustConversionJourneys,
    weakRecommendationToLeadFlows,
    lowConfidenceLeadPaths,
    strongTrustAssistedJourneys,
    returnUserLeadConfidence,
    repeatCompareBeforeLeadQuality,
    highTrustLeadJourneys,
    lowConfidenceLeadAvoidance,
    ownershipGuidanceAssistedConversion,
    compareConfidenceConversionMaturity,
    highestTrustAssistedLeads,
    highRetentionConversionPaths,
    bestOwnershipGuidanceJourneys,
    trustAssistedReturnUserConversion,
    compareConfidenceConversionDurability,
    ownershipGuidanceConversionQuality,
    repeatVisitorLeadMaturity,
    lowTrustLeadAvoidance,
    recommendationConfidenceLeadDurability,
    mostTrustedLeadJourneys,
    weakTrustAssistedConversions,
    strongOwnershipGuidanceConversions,
    weakConfidenceConversionFlows,
    mostDurableConversionJourneys,
    repeatUserConversionDurability,
    trustedReturnUserLeadQuality,
    ownershipGuidanceConversionPersistence,
    repeatCompareBeforeLeadMaturity,
    recommendationConfidenceConversionTrust,
    highestTrustRetentionConversions,
    strongRepeatUserLeads,
    weakTrustPersistenceBeforeLead,
    mostDurableCompareToLeadJourneys,
    trustedReturnUserConversionQuality,
    compareConfidenceConversionPersistence,
    ownershipGuidanceConversionTrust,
    repeatVisitorLeadDurability,
    lowTrustLeadAvoidancePersistence,
    mostTrustedRepeatUserLeads,
    repeatCompareConversionPersistence,
    ownershipGuidanceConversionDurability,
    compareConfidenceLeadPersistence,
    lowTrustAbandonmentPersistence,
    usefulnessAssistedConversionQuality,
    repeatUserLeadPersistence,
    trustedCompareToLeadDurability,
    recommendationConfidenceConversionQuality,
    highestTrustQualityLeads,
    usefulnessAssistedConversionPersistence,
    repeatUserConversionTrust,
    trustedCompareToLeadQuality,
    weakTrustConversionHotspots,
    reassuranceAssistedConversionQuality,
    repeatUserConversionPersistence,
    trustedCompareToLeadConsistency,
    lowTrustConversionPersistence,
    weakTrustConsistencyBeforeLead,
    trustedConversionPersistence,
    compareToLeadClarityQuality,
    recommendationConfidenceConversionDurability,
    lowTrustAbandonmentHotspots,
    conversionQualityUnderTraffic,
    repeatUserLeadDurability,
    trustedCompareToLeadPersistence,
    ownershipGuidanceConversionConsistency,
    recommendationConfidenceConversionStability,
    lowTrustAbandonmentUnderGrowth,
    weakTrustConsistencyUnderTraffic,
    conversionPersistenceUnderTraffic,
    compareToLeadTrustStability,
    ownershipGuidanceConversionPersistenceAlias,
    repeatVisitorLeadQuality:
      events.filter((e) => e.type === "repeated_ev_interest").length >= 2 &&
      global.lead_submitted > 0
        ? "repeat_engaged"
        : "early",
    lowTrustAbandonmentPaths: weakCompareToLead,
    avgConversionTrust: trusted.avgConversionTrust,
    generatedAt: new Date().toISOString(),
    exportMeta: {
      reportType: "conversion-refinement",
      version: 4,
      generatedAt: new Date().toISOString(),
      reviewOwner: "conversion-ops",
    },
  };
}
