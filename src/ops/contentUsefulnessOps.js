/**
 * Content usefulness — guide engagement from session buffer (no new scoring engine).
 */

import { ensureArray, safeSlice } from "../utils/compareArrayUtils.js";
import { listUsageLearningEvents } from "./usageLearningBuffer.js";
import { buildSeoAuthorityReport } from "./seoAuthorityOps.js";
import { computeAuthorityDistributionSignals } from "./authorityDistributionOps.js";
import { buildOwnershipRealismReport } from "./ownershipRealismOps.js";

const GUIDE_PATH_PREFIXES = [
  "/guides/",
  "/charging-guides/",
  "/discover/",
  "/ownership/",
];

function isGuidePath(path = "") {
  const p = String(path).toLowerCase();
  return GUIDE_PATH_PREFIXES.some((prefix) => p.startsWith(prefix));
}

function clusterFromPath(path = "") {
  const p = String(path).toLowerCase();
  if (p.includes("charging") || p.includes("society-rwa")) return "charging";
  if (p.includes("ownership") || p.includes("running-cost")) return "ownership";
  if (p.includes("discover") || p.includes("best-ev")) return "discovery";
  if (p.includes("compare")) return "compare";
  return "other";
}

/**
 * @param {object} ctx
 */
export function buildContentUsefulnessReport(ctx = {}) {
  const events = listUsageLearningEvents();
  const seo = buildSeoAuthorityReport(ctx);
  const distribution = computeAuthorityDistributionSignals(events);
  const ownership =
    ctx.cars?.length > 0
      ? buildOwnershipRealismReport(ctx)
      : { trustedPct: null, weakApartmentPracticality: [], weakHighwayPracticality: [] };

  const guideViews = {};
  const repeatGuidePaths = {};
  const compareThenGuide = [];

  const sessions = {};
  for (const e of events) {
    const sid = e.sessionId || e.meta?.sessionId || "default";
    if (!sessions[sid]) sessions[sid] = [];
    sessions[sid].push(e);
  }

  for (const list of Object.values(sessions)) {
    let lastCompare = null;
    for (const e of list) {
      const page = e.meta?.sourcePage || "";
      if (e.type === "compare_started") lastCompare = page;
      if (isGuidePath(page)) {
        const cluster = clusterFromPath(page);
        guideViews[page] = (guideViews[page] || 0) + 1;
        repeatGuidePaths[page] = (repeatGuidePaths[page] || 0) + 1;
        if (lastCompare && String(lastCompare).includes("/compare")) {
          compareThenGuide.push({ from: lastCompare, to: page });
        }
      }
      if (
        e.type === "charging_guide_opened" ||
        e.type === "charging_practicality_viewed" ||
        e.type === "ownership_guide_opened" ||
        e.type === "ownership_insight_viewed"
      ) {
        const cluster =
          e.type.includes("charging") ? "charging" : "ownership";
        guideViews[cluster] = (guideViews[cluster] || 0) + 1;
      }
    }
  }

  const strongestPracticalGuides = Object.entries(guideViews)
    .map(([path, count]) => ({
      path: path.startsWith("/") ? path : clusterFromPath(path),
      label: path,
      engagements: count,
      cluster: clusterFromPath(path),
    }))
    .sort((a, b) => b.engagements - a.engagements)
    .slice(0, 12);

  const weakAuthorityPages = seo.weakAuthorityClusters?.map((c) => ({
    clusterId: c.clusterId,
    score: c.score,
  }));

  const ownershipHotspots = strongestPracticalGuides.filter(
    (g) => g.cluster === "ownership"
  );
  const chargingHotspots = strongestPracticalGuides.filter(
    (g) => g.cluster === "charging"
  );

  const lowEngagementAuthority = (seo.guideOpportunities || [])
    .filter((g) => g.guideOpportunityScore < 60)
    .slice(0, 8);

  const compareSupportGuides = ensureArray(seo.compareToGuideLinks).slice(0, 8);

  const usefulnessRate = seo.guideUsefulnessSignals?.rate;
  const guideUsefulnessTrend =
    usefulnessRate != null && usefulnessRate >= 60
      ? "improving"
      : usefulnessRate != null
        ? "building"
        : "early";

  const contentTrustTrend =
    usefulnessRate != null && usefulnessRate >= 55
      ? "trusted"
      : usefulnessRate != null
        ? "building"
        : "early";

  const authorityUsefulnessScore = Math.round(
    (usefulnessRate ?? 45) * 0.5 +
      (strongestPracticalGuides.length >= 3 ? 25 : 10) +
      (compareThenGuide.length >= 2 ? 25 : 10)
  );

  const weakPracticalContentClusters = (seo.weakAuthorityClusters || []).filter(
    (c) => c.score < 50
  );

  const compareSupportContentGaps = seo.comparePagesLackingSupportContent || [];
  const lowEngagementPracticalPages = lowEngagementAuthority;

  const repeatGuideUsefulness = Object.entries(repeatGuidePaths)
    .filter(([, count]) => count >= 2)
    .map(([path, count]) => ({ path, visits: count }))
    .slice(0, 8);

  const guideAssistedTrustImprovement =
    compareThenGuide.length >= 2 && usefulnessRate != null && usefulnessRate >= 50
      ? "positive"
      : compareThenGuide.length >= 1
        ? "emerging"
        : "early";

  const mostTrustedPracticalGuides = strongestPracticalGuides.slice(0, 8);
  const weakAuthorityContent = weakAuthorityPages;
  const highTrustOwnershipExplainers = ownershipHotspots.slice(0, 6);

  const authorityRetentionTrend =
    repeatGuideUsefulness.length >= 2
      ? "improving"
      : repeatGuideVisitCount >= 1
        ? "stable"
        : "early";

  const guideRevisitQuality =
    repeatGuideUsefulness.length >= 3
      ? "strong"
      : repeatGuideUsefulness.length >= 1
        ? "developing"
        : "early";

  const trustContentUsefulnessEvolution = guideUsefulnessTrend;

  const compareAssistedGuideUsefulness =
    compareThenGuide.length >= 2 ? "strong" : compareThenGuide.length >= 1 ? "emerging" : "early";

  const ownershipGuideTrustTrend =
    ownershipHotspots.length >= 2 ? "trusted" : "building";

  const chargingGuideUsefulnessTrend =
    chargingHotspots.length >= 2 ? "useful" : "emerging";

  const highestRetentionAuthorityPages = repeatGuideUsefulness.slice(0, 8);
  const mostTrustedOwnershipGuides = ownershipHotspots.slice(0, 6);
  const weakPracticalAuthorityContent = weakPracticalContentClusters;
  const repeatVisitorGuideEngagement = repeatGuideUsefulness;
  const strongCompareSupportContent = compareSupportGuides;

  const practicalGuideTrustTrend =
    contentTrustTrend === "trusted" && ownershipGuideTrustTrend === "trusted"
      ? "trusted"
      : "building";

  const authorityUsefulnessPersistence =
    authorityRetentionTrend === "improving" ? "persistent" : "watch";

  const ownershipContentRevisitQuality = ownershipGuideTrustTrend;
  const chargingGuideRetentionQuality = chargingGuideUsefulnessTrend;

  const weakPracticalContentPersistence = weakPracticalContentClusters.filter(
    (c) => c.score < 45
  );

  const underperformingAuthorityClusters = seo.weakAuthorityClusters?.slice(0, 6);

  const highestTrustRetentionGuides = highestRetentionAuthorityPages;
  const repeatUserAuthorityJourneys = distribution.authorityToCompareJourneys?.slice(
    0,
    8
  );

  const authorityTrustPersistence = authorityUsefulnessPersistence;
  const guideReturnQuality = guideRevisitQuality;
  const ownershipGuideMaturity = ownershipGuideTrustTrend;
  const chargingGuideUsefulnessPersistence = chargingGuideRetentionQuality;
  const weakAuthorityContentPersistence = weakPracticalContentPersistence;
  const practicalContentRetentionQuality = practicalGuideTrustTrend;

  const mostDurableOwnershipGuides = mostTrustedOwnershipGuides;
  const weakPracticalAuthorityClusters = weakPracticalAuthorityContent;
  const mostRevisitedChargingGuides = chargingHotspots.slice(0, 6);
  const strongCompareSupportAuthority = strongCompareSupportContent;

  const authorityVisibilityTrend =
    guideUsefulnessTrend === "improving" || authorityRetentionTrend === "improving"
      ? "visible"
      : guideUsefulnessTrend === "building"
        ? "building"
        : "early";

  const trustedAuthorityEntryQuality =
    distribution.authorityEntryQuality >= 55
      ? "trusted"
      : distribution.authorityEntryQuality >= 40
        ? "developing"
        : "early";

  const authorityRevisitPersistence = authorityUsefulnessPersistence;
  const compareAfterGuideTrust = distribution.compareAfterGuideQuality;
  const practicalGuideRetentionQuality = practicalContentRetentionQuality;
  const authorityAssistedCompareDepth = distribution.compareDepthFromAuthorityPages;

  const mostTrustedPublicAuthorityContent = mostTrustedPracticalGuides;
  const highestAuthorityRetentionGuides = highestRetentionAuthorityPages;
  const weakPublicAuthorityClusters = weakPracticalAuthorityClusters;
  const bestOwnershipExplainers = highTrustOwnershipExplainers;
  const bestChargingPracticalityContent = chargingHotspots.slice(0, 6);

  const practicalGuideTrustRetention = practicalContentRetentionQuality;
  const ownershipGuideDurability = ownershipGuideMaturity;
  const practicalContentRevisitQuality = guideReturnQuality;

  const highestTrustRetentionAuthorityContent = highestTrustRetentionGuides;
  const mostUsefulChargingExplainers = bestChargingPracticalityContent;

  const practicalValuePersistence =
    authorityUsefulnessPersistence === "persistent" &&
    guideRevisitQuality === "strong"
      ? "persistent"
      : authorityUsefulnessPersistence === "persistent"
        ? "emerging"
        : "watch";

  const ownershipGuidanceUsefulness =
    ownership.trustedPct != null && ownership.trustedPct >= 60
      ? "useful"
      : ownership.trustedPct != null
        ? "building"
        : "early";

  const chargingGuidanceUsefulness = chargingGuideUsefulnessTrend;
  const recommendationUsefulnessRetention = compareAssistedGuideUsefulness;
  const compareUsefulnessDurability =
    compareThenGuide.length >= 2 ? "durable" : compareThenGuide.length >= 1 ? "developing" : "early";

  const lowValueGuidanceDetection = [
    ...(weakPracticalContentClusters || []).map((c) => ({
      type: "cluster",
      id: c.clusterId,
      score: c.score,
    })),
    ...safeSlice(ownership.weakApartmentPracticality, 0, 3, {
      subsystem: "content-usefulness",
    }).map((r) => ({
      type: "ownership",
      slug: r.slug,
    })),
  ].slice(0, 8);

  const highReturnPracticalJourneys = compareToGuideTransitions.slice(0, 8);
  const mostPracticallyUsefulGuides = strongestPracticalGuides.slice(0, 8);
  const highestValueCompareJourneys = compareToGuideTransitions.slice(0, 6);
  const mostUsefulOwnershipGuidance = ownershipHotspots.slice(0, 6);
  const weakPracticalGuidance = lowValueGuidanceDetection;
  const mostRevisitedPracticalContent = repeatGuideUsefulness;

  const authorityMemorabilityTrend =
    repeatGuideVisitCount >= 2 && guideUsefulnessTrend === "improving"
      ? "memorable"
      : repeatGuideVisitCount >= 1
        ? "building"
        : "early";

  const practicalContentRetentionPersistence = practicalGuideTrustRetention;
  const weakAuthorityMemoryPaths = seo.weakDiscoveryPaths?.slice(0, 6) || [];
  const underlinkedHighValuePracticalGuides =
    seo.underlinkedHighRetentionGuides || seo.practicalGuidesLackingDiscovery?.slice(0, 6);
  const mostMemorableAuthorityContent = highestTrustRetentionAuthorityContent;

  const userExperienceUsefulness =
    guideEngagementQuality === "healthy" && contentTrustTrend === "trusted"
      ? "strong"
      : guideEngagementQuality === "healthy"
        ? "developing"
        : "early";

  const compareReadabilityQuality =
    compareUsefulnessDurability === "durable" ? "clear" : "developing";

  const ownershipGuidanceClarity = ownershipGuidanceUsefulness;
  const chargingGuidanceClarity =
    chargingGuidanceUsefulness === "useful" ? "clear" : chargingGuidanceUsefulness;

  const recommendationReadabilityPersistence = recommendationUsefulnessRetention;
  const practicalJourneyQuality =
    highReturnPracticalJourneys.length >= 2 ? "strong" : "emerging";

  const weakUsabilityHotspots = weakPracticalGuidance;

  const mostUsefulEvJourneys = highReturnPracticalJourneys;
  const strongestCompareReadability = highestValueCompareJourneys;
  const weakPracticalUsability = weakPracticalGuidance;
  const weakChargingGuidance =
    chargingGuidanceClarity === "emerging"
      ? chargingHotspots.filter((g) => (g.engagements || 0) < 2).slice(0, 4)
      : [];

  const authorityMemorabilityPersistence =
    authorityMemorabilityTrend === "memorable" ? "persistent" : "building";

  const practicalGuideUsefulnessDurability = practicalGuideTrustRetention;
  const compareSupportAuthorityQuality =
    strongCompareSupportAuthority?.length >= 2 ? "strong" : "emerging";

  const weakAuthorityMemoryHotspots = weakAuthorityMemoryPaths;

  const compareReadabilityPersistence =
    compareReadabilityQuality === "clear" ? "persistent" : "building";

  const ownershipGuidanceClarityPersistence =
    ownershipGuidanceClarity === "high" || ownershipGuidanceClarity === "useful"
      ? "persistent"
      : "building";

  const chargingGuidanceReadability = chargingGuidanceClarity;
  const recommendationClarityQuality =
    recommendationReadabilityPersistence === "persistent" ? "clear" : "developing";

  const practicalJourneyConsistency =
    practicalJourneyQuality === "strong" ? "consistent" : "emerging";

  const weakUsabilityPersistence =
    weakPracticalContentPersistence === "persistent" ? "persistent" : "adequate";

  const calmUxQualityTrend =
    contentTrustTrend === "trusted" && guideEngagementQuality === "healthy"
      ? "calm"
      : "building";

  const mostPolishedEvJourneys = highReturnPracticalJourneys;
  const highestClarityCompareJourneys = strongestCompareReadability;
  const strongOwnershipReadability =
    ownershipGuidanceClarityPersistence === "persistent"
      ? mostUsefulOwnershipGuidance
      : [];

  const authorityContentConsistency =
    authorityMemorabilityPersistence === "persistent" &&
    compareSupportAuthorityQuality === "strong"
      ? "consistent"
      : "building";

  const practicalGuideMemorability = authorityMemorabilityPersistence;
  const compareSupportAuthorityPersistence = compareSupportAuthorityQuality;
  const weakPracticalContentQuality = weakPracticalAuthorityContent;
  const underlinkedUsefulGuides = underlinkedHighValuePracticalGuides;

  const mostMemorableAuthorityGuides = mostMemorableAuthorityContent;
  const weakPracticalAuthorityQuality = weakPracticalAuthorityClusters;

  const productionUxConsistency =
    calmUxQualityTrend === "calm" && practicalJourneyConsistency === "consistent"
      ? "consistent"
      : "building";

  const ownershipGuidanceReadability = ownershipGuidanceClarity;
  const recommendationClarityPersistence = recommendationClarityQuality;
  const practicalJourneySmoothness =
    practicalJourneyQuality === "strong" ? "smooth" : "emerging";

  const weakUxFrictionHotspots = weakUsabilityHotspots;
  const weakUxConsistency = weakUsabilityPersistence === "persistent" ? "weak" : "adequate";

  const highestQualityEvJourneys = mostPolishedEvJourneys;
  const strongOwnershipClarity = strongOwnershipReadability;
  const weakChargingUsability = weakChargingGuidance;

  const contentQualityPersistence = authorityContentConsistency;
  const authorityUsefulnessDurability = practicalGuideMemorability;
  const highestQualityAuthorityContent = mostMemorableAuthorityGuides;
  const mostUsefulOwnershipGuides = mostUsefulOwnershipGuidance;
  const mostMemorableEvExplainers = bestOwnershipExplainers;

  const contentFreshnessPersistence =
    guideUsefulnessTrend === "improving" || authorityRetentionTrend === "improving"
      ? "fresh"
      : "adequate";

  const compareSupportAuthorityFreshness = compareSupportAuthorityPersistence;
  const weakPracticalContentFreshness =
    weakPracticalContentPersistence === "persistent" ? "stale" : "adequate";

  const freshestPracticalAuthorityContent = mostRevisitedPracticalContent;
  const mostDurableEvExplainers = mostDurableOwnershipGuides;

  const authorityUsefulnessStability =
    authorityUsefulnessPersistence === "persistent" ? "stable" : "building";

  return {
    strongestPracticalGuides,
    contentTrustTrend,
    authorityUsefulnessScore,
    weakPracticalContentClusters,
    compareSupportContentGaps,
    lowEngagementPracticalPages,
    repeatGuideUsefulness,
    guideAssistedTrustImprovement,
    mostTrustedPracticalGuides,
    weakAuthorityContent,
    highTrustOwnershipExplainers,
    weakAuthorityPages: weakAuthorityPages || [],
    mostUsefulCompareSupportGuides: compareSupportGuides,
    ownershipEducationHotspots: ownershipHotspots.slice(0, 6),
    chargingEducationHotspots: chargingHotspots.slice(0, 6),
    lowEngagementAuthorityPages: lowEngagementAuthority,
    compareToGuideTransitions: ensureArray(compareThenGuide).slice(0, 10),
    repeatGuideVisitCount: Object.keys(repeatGuidePaths).length,
    guideEngagementQuality:
      strongestPracticalGuides.length >= 3 ? "healthy" : "emerging",
    guideUsefulnessTrend,
    authorityRetentionTrend,
    guideRevisitQuality,
    trustContentUsefulnessEvolution,
    compareAssistedGuideUsefulness,
    ownershipGuideTrustTrend,
    chargingGuideUsefulnessTrend,
    highestRetentionAuthorityPages,
    mostTrustedOwnershipGuides,
    weakPracticalAuthorityContent,
    repeatVisitorGuideEngagement,
    strongCompareSupportContent,
    practicalGuideTrustTrend,
    authorityUsefulnessPersistence,
    ownershipContentRevisitQuality,
    chargingGuideRetentionQuality,
    weakPracticalContentPersistence,
    underperformingAuthorityClusters,
    highestTrustRetentionGuides,
    repeatUserAuthorityJourneys,
    authorityTrustPersistence,
    guideReturnQuality,
    ownershipGuideMaturity,
    chargingGuideUsefulnessPersistence,
    weakAuthorityContentPersistence,
    practicalContentRetentionQuality,
    mostDurableOwnershipGuides,
    weakPracticalAuthorityClusters,
    mostRevisitedChargingGuides,
    strongCompareSupportAuthority,
    authorityVisibilityTrend,
    trustedAuthorityEntryQuality,
    authorityRevisitPersistence,
    compareAfterGuideTrust,
    practicalGuideRetentionQuality,
    authorityAssistedCompareDepth,
    mostTrustedPublicAuthorityContent,
    highestAuthorityRetentionGuides,
    weakPublicAuthorityClusters,
    bestOwnershipExplainers,
    bestChargingPracticalityContent,
    practicalGuideTrustRetention,
    ownershipGuideDurability,
    practicalContentRevisitQuality,
    highestTrustRetentionAuthorityContent,
    mostUsefulChargingExplainers,
    practicalValuePersistence,
    ownershipGuidanceUsefulness,
    chargingGuidanceUsefulness,
    recommendationUsefulnessRetention,
    compareUsefulnessDurability,
    lowValueGuidanceDetection,
    highReturnPracticalJourneys,
    mostPracticallyUsefulGuides,
    highestValueCompareJourneys,
    mostUsefulOwnershipGuidance,
    weakPracticalGuidance,
    mostRevisitedPracticalContent,
    authorityMemorabilityTrend,
    practicalContentRetentionPersistence,
    weakAuthorityMemoryPaths,
    underlinkedHighValuePracticalGuides,
    mostMemorableAuthorityContent,
    authorityValueSummary: {
      practicalValuePersistence,
      ownershipGuidanceUsefulness,
      chargingGuidanceUsefulness,
      authorityUsefulnessScore,
    },
    userExperienceUsefulness,
    compareReadabilityQuality,
    ownershipGuidanceClarity,
    chargingGuidanceClarity,
    recommendationReadabilityPersistence,
    practicalJourneyQuality,
    weakUsabilityHotspots,
    mostUsefulEvJourneys,
    strongestCompareReadability,
    weakPracticalUsability,
    weakChargingGuidance,
    authorityMemorabilityPersistence,
    practicalGuideUsefulnessDurability,
    compareSupportAuthorityQuality,
    weakAuthorityMemoryHotspots,
    authorityUsefulnessCompounding:
      authorityMemorabilityPersistence === "persistent" &&
      practicalGuideUsefulnessDurability === "trusted",
    compareReadabilityPersistence,
    ownershipGuidanceClarityPersistence,
    chargingGuidanceReadability,
    recommendationClarityQuality,
    practicalJourneyConsistency,
    weakUsabilityPersistence,
    calmUxQualityTrend,
    mostPolishedEvJourneys,
    highestClarityCompareJourneys,
    strongOwnershipReadability,
    authorityContentConsistency,
    practicalGuideMemorability,
    compareSupportAuthorityPersistence,
    weakPracticalContentQuality,
    underlinkedUsefulGuides,
    mostMemorableAuthorityGuides,
    weakPracticalAuthorityQuality,
    productionUxConsistency,
    ownershipGuidanceReadability,
    recommendationClarityPersistence,
    practicalJourneySmoothness,
    weakUxFrictionHotspots,
    weakUxConsistency,
    highestQualityEvJourneys,
    strongOwnershipClarity,
    weakChargingUsability,
    contentQualityPersistence,
    authorityUsefulnessDurability,
    highestQualityAuthorityContent,
    mostUsefulOwnershipGuides,
    mostMemorableEvExplainers,
    contentFreshnessPersistence,
    compareSupportAuthorityFreshness,
    weakPracticalContentFreshness,
    freshestPracticalAuthorityContent,
    mostDurableEvExplainers,
    authorityUsefulnessStability,
    authorityEntryQuality: distribution.authorityEntryQuality,
    compareAfterGuideQuality: distribution.compareAfterGuideQuality,
    generatedAt: new Date().toISOString(),
    exportMeta: {
      reportType: "content-usefulness",
      version: 5,
      generatedAt: new Date().toISOString(),
      reviewOwner: "content-ops",
      authorityReviewAt: new Date().toISOString(),
    },
  };
}
