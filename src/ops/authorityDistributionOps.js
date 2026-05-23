/**
 * Authority distribution & adoption signals — session buffer only.
 */

import { listUsageLearningEvents } from "./usageLearningBuffer.js";
import { classifyAcquisitionLabel } from "../utils/acquisitionContext.js";
import { computeRetentionSignals } from "./retentionSignals.js";

const ADOPTION_WEEKLY_KEY = "evsavari-adoption-growth-weekly-v1";

const GUIDE_PREFIXES = [
  "/guides/",
  "/charging-guides/",
  "/discover/",
  "/ownership/",
];

function isGuidePath(path = "") {
  const p = String(path).toLowerCase();
  return GUIDE_PREFIXES.some((prefix) => p.startsWith(prefix));
}

function pairFromPath(path = "") {
  const m = String(path).match(/\/compare\/([^?#/]+)/i);
  return m ? m[1].toLowerCase() : "";
}

function readWeekly() {
  try {
    const raw = localStorage.getItem(ADOPTION_WEEKLY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeWeekly(arr) {
  try {
    localStorage.setItem(ADOPTION_WEEKLY_KEY, JSON.stringify(arr.slice(0, 10)));
  } catch {
    /* quota */
  }
}

export function recordAdoptionGrowthWeekly(snapshot) {
  const week = new Date().toISOString().slice(0, 10);
  const filtered = readWeekly().filter((s) => s.week !== week);
  writeWeekly([{ week, at: new Date().toISOString(), ...snapshot }, ...filtered]);
}

export function getAdoptionGrowthWeeklySnapshots() {
  return readWeekly().slice(0, 8);
}

/**
 * Authority distribution from guide/compare session flows.
 */
export function computeAuthorityDistributionSignals(events = listUsageLearningEvents()) {
  const sessions = {};
  const guideEntryCounts = {};
  const authorityToCompare = [];
  const authorityToLead = [];
  const weakRetentionPaths = [];

  for (const e of events) {
    const sid = e.sessionId || e.meta?.sessionId || "default";
    if (!sessions[sid]) {
      sessions[sid] = {
        events: [],
        channel:
          e.meta?.acquisitionChannel ||
          classifyAcquisitionLabel(e.meta?.utmSource || e.meta?.referrerHost),
        guideFirst: false,
        compareAfterGuide: false,
        leadAfterGuide: false,
        guidePath: null,
        doubted: false,
        depths: [],
      };
    }
    sessions[sid].events.push(e);
  }

  for (const [sid, s] of Object.entries(sessions)) {
    const ordered = s.events;
    const firstPage = ordered.find((ev) => ev.meta?.sourcePage)?.meta?.sourcePage || "";
    if (isGuidePath(firstPage)) {
      s.guideFirst = true;
      s.guidePath = firstPage;
      guideEntryCounts[firstPage] = (guideEntryCounts[firstPage] || 0) + 1;
    }
    let sawGuide = s.guideFirst;
    for (const ev of ordered) {
      const page = ev.meta?.sourcePage || "";
      if (isGuidePath(page)) sawGuide = true;
      if (ev.type === "recommendation_doubted") s.doubted = true;
      if (sawGuide && ev.type === "compare_started") {
        s.compareAfterGuide = true;
        authorityToCompare.push({
          sessionId: sid,
          from: s.guidePath || page,
          pair: pairFromPath(page),
          channel: s.channel,
          depth: ev.meta?.depth ? Number(ev.meta.depth) : null,
        });
        if (ev.meta?.depth) s.depths.push(Number(ev.meta.depth));
      }
      if (sawGuide && ev.type === "lead_submitted") {
        s.leadAfterGuide = true;
        authorityToLead.push({ sessionId: sid, from: s.guidePath, channel: s.channel });
      }
    }
    if (s.guideFirst && !s.compareAfterGuide && s.doubted) {
      weakRetentionPaths.push({ path: s.guidePath, channel: s.channel });
    }
  }

  const guideEntryRetention =
    Object.values(guideEntryCounts).filter((c) => c >= 2).length >= 1
      ? "improving"
      : Object.keys(guideEntryCounts).length >= 2
        ? "stable"
        : "early";

  const compareAfterGuideQuality =
    authorityToCompare.length >= 2
      ? "strong"
      : authorityToCompare.length >= 1
        ? "developing"
        : "early";

  const depths = authorityToCompare.map((j) => j.depth).filter((d) => d != null);
  const avgDepth =
    depths.length > 0
      ? Math.round(depths.reduce((n, d) => n + d, 0) / depths.length)
      : null;

  const authorityEntryQuality = Math.round(
    (compareAfterGuideQuality === "strong" ? 35 : 20) +
      (guideEntryRetention === "improving" ? 30 : 15) +
      (authorityToLead.length >= 1 ? 25 : 10) +
      (avgDepth != null ? Math.min(20, avgDepth * 8) : 10)
  );

  const byChannelGuide = {};
  for (const [path, count] of Object.entries(guideEntryCounts)) {
    const ch = "authority_content";
    if (!byChannelGuide[ch]) byChannelGuide[ch] = [];
    byChannelGuide[ch].push({ path, count });
  }

  const bestAuthorityAcquisitionPaths = Object.entries(guideEntryCounts)
    .map(([path, count]) => ({ path, entries: count, type: "guide_entry" }))
    .sort((a, b) => b.entries - a.entries)
    .slice(0, 8);

  const highestTrustContentJourneys = authorityToCompare
    .filter((j) => j.pair)
    .slice(0, 8);

  const strongAuthorityToCompareFlows = authorityToCompare.slice(0, 8);
  const weakAuthorityRetentionPaths = weakRetentionPaths.slice(0, 8);
  const mostUsefulAcquisitionContent = bestAuthorityAcquisitionPaths.slice(0, 6);

  const trustAssistedDiscoveryPaths = events
    .filter(
      (e) =>
        e.type === "compare_confidence_expanded" &&
        isGuidePath(e.meta?.sourcePage || "")
    )
    .map((e) => e.meta?.sourcePage)
    .filter(Boolean)
    .slice(0, 6);

  const repeatGuideVisitorQuality =
    Object.values(guideEntryCounts).filter((c) => c >= 2).length >= 2
      ? "strong"
      : Object.values(guideEntryCounts).some((c) => c >= 2)
        ? "developing"
        : "early";

  const authorityToLeadQuality =
    authorityToLead.length >= 1 ? "present" : "emerging";

  const trustedDiscoveryQuality =
    authorityEntryQuality >= 55 && compareAfterGuideQuality !== "early"
      ? "healthy"
      : authorityEntryQuality >= 40
        ? "developing"
        : "early";

  const practicalEntryRetention = guideEntryRetention;
  const compareAfterGuidePersistence = compareAfterGuideQuality;
  const ownershipGuideEntryQuality =
    Object.entries(guideEntryCounts).some(([p]) => p.includes("ownership"))
      ? repeatGuideVisitorQuality
      : "early";
  const authorityAssistedCompareDepth = avgDepth;

  const mostDurableAuthorityEntryJourneys = highestTrustContentJourneys;
  const weakPracticalDiscovery = weakAuthorityRetentionPaths;
  const strongOwnershipGuideEntry = Object.entries(guideEntryCounts)
    .filter(([p]) => p.includes("ownership") || p.includes("guide"))
    .map(([path, entries]) => ({ path, entries }))
    .sort((a, b) => b.entries - a.entries)
    .slice(0, 6);

  const trustedDiscoverySummary = {
    trustedDiscoveryQuality,
    compareAfterGuidePersistence,
    practicalEntryRetention,
    guideEntries: Object.keys(guideEntryCounts).length,
  };

  const practicalEntrySnapshot = {
    guideEntryRetention,
    ownershipGuideEntryQuality,
    authorityAssistedCompareDepth,
  };

  const authorityVisibilitySummary = {
    authorityEntryQuality,
    bestPaths: bestAuthorityAcquisitionPaths.slice(0, 4),
    compareAfterGuide: authorityToCompare.length,
  };

  const trustedBrandEntryQuality =
    authorityEntryQuality >= 55 ? "trusted" : authorityEntryQuality >= 40 ? "developing" : "early";

  const repeatBrandDiscovery =
    Object.values(guideEntryCounts).filter((c) => c >= 2).length >= 1
      ? "recurring"
      : "early";

  const authorityRecallPersistence = guideEntryRetention;
  const compareShareTrustQuality = compareAfterGuideQuality;
  const trustedPublicEntryJourneys = bestAuthorityAcquisitionPaths.slice(0, 6);
  const returnUserBrandFamiliarity =
    repeatGuideVisitorQuality === "strong" ? "familiar" : "building";

  const usersRememberingEvsavari = repeatBrandDiscovery === "recurring";
  const strongestTrustedEntryJourneys = highestTrustContentJourneys;
  const weakPublicTrustJourneys = weakAuthorityRetentionPaths;
  const mostTrustedCompareSharingPaths = strongAuthorityToCompareFlows;

  return {
    authorityEntryQuality,
    guideEntryRetention,
    compareAfterGuideQuality,
    trustAssistedDiscoveryPaths,
    authorityToCompareJourneys: authorityToCompare.slice(0, 10),
    authorityToLeadQuality,
    repeatGuideVisitorQuality,
    compareDepthFromAuthorityPages: avgDepth,
    bestAuthorityAcquisitionPaths,
    highestTrustContentJourneys,
    strongAuthorityToCompareFlows,
    weakAuthorityRetentionPaths,
    mostUsefulAcquisitionContent,
    authorityDistributionSummary: {
      guideEntries: Object.keys(guideEntryCounts).length,
      compareAfterGuide: authorityToCompare.length,
      leadsAfterGuide: authorityToLead.length,
    },
    trustedDiscoverySnapshot: {
      authorityEntryQuality,
      compareAfterGuideQuality,
      guideEntryRetention,
    },
    authorityRetentionEvolution: guideEntryRetention,
    trustedDiscoveryQuality,
    practicalEntryRetention,
    compareAfterGuidePersistence,
    ownershipGuideEntryQuality,
    authorityAssistedCompareDepth,
    mostDurableAuthorityEntryJourneys,
    weakPracticalDiscovery,
    strongOwnershipGuideEntry,
    trustedDiscoverySummary,
    practicalEntrySnapshot,
    authorityVisibilitySummary,
    trustedBrandEntryQuality,
    repeatBrandDiscovery,
    authorityRecallPersistence,
    compareShareTrustQuality,
    trustedPublicEntryJourneys,
    returnUserBrandFamiliarity,
    usersRememberingEvsavari,
    strongestTrustedEntryJourneys,
    weakPublicTrustJourneys,
    mostTrustedCompareSharingPaths,
    authorityEntryDurability:
      compareAfterGuidePersistence === "strong" || guideEntryRetention === "strong"
        ? "durable"
        : "developing",
    practicalContentEntryQuality: ownershipGuideEntryQuality,
    trustedEntryDurability:
      compareAfterGuidePersistence === "strong" || guideEntryRetention === "strong"
        ? "durable"
        : "developing",
    authorityEntryStability:
      compareAfterGuidePersistence === "strong" ? "stable" : "watch",
    practicalEntryQuality: ownershipGuideEntryQuality,
    trafficQualityPersistence:
      guideEntryRetention === "strong" ? "persistent" : "watch",
  };
}

/**
 * Community discovery — session-level share/referral quality (no virality mechanics).
 */
export function computeCommunityDiscoverySignals(events = listUsageLearningEvents()) {
  const channels = { whatsapp: 0, linkedin: 0, other: 0 };
  const shareEvents = events.filter(
    (e) =>
      e.type === "share_compare" ||
      e.type === "compare_shared" ||
      e.meta?.shared === true
  );
  const compareShareDepth = events
    .filter((e) => (e.type === "share_compare" || e.type === "compare_shared") && e.meta?.depth)
    .map((e) => Number(e.meta.depth));

  for (const e of events) {
    const ch = String(
      e.meta?.acquisitionChannel || e.meta?.utmSource || e.meta?.referrerHost || ""
    ).toLowerCase();
    if (ch.includes("whatsapp") || ch.includes("wa.me")) channels.whatsapp += 1;
    else if (ch.includes("linkedin")) channels.linkedin += 1;
    else if (ch.includes("ev_communities") || ch.includes("community")) channels.other += 1;
  }

  const communityShareQuality =
    shareEvents.length >= 2 ? "healthy" : shareEvents.length >= 1 ? "emerging" : "early";

  const compareShareDepthAvg =
    compareShareDepth.length > 0
      ? Math.round(compareShareDepth.reduce((n, d) => n + d, 0) / compareShareDepth.length)
      : null;

  const trustedReferralQuality =
    channels.whatsapp + channels.linkedin >= 2 ? "trusted" : "building";

  const whatsappLinkedinDiscoveryQuality =
    channels.whatsapp >= 1 || channels.linkedin >= 1 ? "present" : "early";

  const authoritySharingRetention =
    shareEvents.length >= 1 && events.some((e) => e.type === "compare_started")
      ? "positive"
      : "early";

  const compareShareConversionQuality =
    shareEvents.length > 0 &&
    events.filter((e) => e.type === "lead_submitted").length > 0
      ? "present"
      : "emerging";

  const repeatUserReferralQuality =
    events.filter((e) => e.type === "repeated_ev_interest").length >= 2
      ? "strong"
      : "early";

  const highestTrustReferralPaths = [
    channels.whatsapp > 0 ? { channel: "whatsapp", count: channels.whatsapp } : null,
    channels.linkedin > 0 ? { channel: "linkedin", count: channels.linkedin } : null,
    channels.other > 0 ? { channel: "community", count: channels.other } : null,
  ].filter(Boolean);

  const bestCommunityDiscovery = highestTrustReferralPaths.slice(0, 4);
  const weakShareJourneys = shareEvents.length === 0 ? [{ note: "no_share_signal" }] : [];
  const mostSharedCompareFlows = events
    .filter((e) => e.type === "share_compare" || e.type === "compare_shared")
    .map((e) => ({ page: e.meta?.sourcePage, at: e.at }))
    .slice(0, 6);
  const strongAuthoritySharingPaths = events
    .filter((e) => isGuidePath(e.meta?.sourcePage || "") && e.meta?.shared)
    .map((e) => e.meta?.sourcePage)
    .filter(Boolean)
    .slice(0, 6);

  const trustedDiscoveryPersistence =
    authoritySharingRetention === "positive" && trustedReferralQuality === "trusted"
      ? "persistent"
      : authoritySharingRetention === "positive"
        ? "emerging"
        : "early";

  const compareShareDurability =
    shareEvents.length >= 2 && compareShareDepthAvg != null && compareShareDepthAvg >= 2
      ? "durable"
      : shareEvents.length >= 1
        ? "developing"
        : "early";

  const trustedCommunityAcquisition =
    channels.other + channels.whatsapp + channels.linkedin >= 2
      ? "present"
      : "emerging";

  const ownershipGuideSharingQuality =
    events.filter(
      (e) =>
        (e.type === "share_compare" || e.meta?.shared) &&
        isGuidePath(e.meta?.sourcePage || "") &&
        String(e.meta?.sourcePage || "").includes("ownership")
    ).length >= 1
      ? "healthy"
      : "early";

  const bestTrustedDiscoveryPaths = highestTrustReferralPaths;
  const mostDurableCommunityJourneys = mostSharedCompareFlows.filter((f) => f.page);
  const weakDiscoveryRetention =
    weakShareJourneys.length > 0 && shareEvents.length === 0
      ? "weak"
      : shareEvents.length >= 1
        ? "adequate"
        : "early";
  const trustedCompareSharingPaths = mostSharedCompareFlows;
  const strongAuthoritySharingJourneys = strongAuthoritySharingPaths.map((path) => ({
    path,
    type: "guide_share",
  }));

  const trustedSharePersistence =
    compareShareDurability === "durable" ? "persistent" : compareShareDurability;

  const repeatUserDiscoveryQuality =
    repeatUserReferralQuality === "strong" ? "healthy" : repeatUserReferralQuality;

  return {
    communityShareQuality,
    compareShareDepth: compareShareDepthAvg,
    trustedReferralQuality,
    whatsappLinkedinDiscoveryQuality,
    authoritySharingRetention,
    compareShareConversionQuality,
    repeatUserReferralQuality,
    highestTrustReferralPaths,
    bestCommunityDiscovery,
    weakShareJourneys,
    mostSharedCompareFlows,
    strongAuthoritySharingPaths,
    trustedDiscoveryPersistence,
    compareShareDurability,
    trustedCommunityAcquisition,
    ownershipGuideSharingQuality,
    bestTrustedDiscoveryPaths,
    mostDurableCommunityJourneys,
    weakDiscoveryRetention,
    trustedCompareSharingPaths,
    strongAuthoritySharingJourneys,
    trustedSharePersistence,
    repeatUserDiscoveryQuality,
    communityDiscoveryMaturity:
      communityShareQuality === "healthy" && trustedReferralQuality === "trusted"
        ? "mature"
        : "developing",
  };
}

/**
 * Real user adoption — extends retention with adoption-specific views.
 */
export function computeAdoptionSignals(events = listUsageLearningEvents()) {
  const retention = computeRetentionSignals(events);
  const distribution = computeAuthorityDistributionSignals(events);
  const community = computeCommunityDiscoverySignals(events);

  const repeatSessionCompareConfidence = retention.repeatCompareConfidence;
  const trustedReturnUserEvolution = retention.returnUserTrustTrend;
  const recommendationRevisitTrust = retention.recommendationRevisitQuality;
  const ownershipGuideRevisitQuality = distribution.repeatGuideVisitorQuality;
  const compareRevisitMaturity = retention.compareRevisitQuality;
  const returningUserConversionQuality = retention.returnUserConversionQuality;
  const repeatUseRecommendationDurability =
    retention.compareRevisitQuality === "healthy" &&
    retention.repeatCompareConfidence !== "early"
      ? "durable"
      : "developing";

  const usersReturningForRecommendations =
    retention.repeatCompareRetention != null &&
    retention.repeatCompareRetention >= 20 &&
    retention.returnUserTrustTrend !== "watch";

  const mostRevisitedCompareJourneys = retention.highReturnComparePairs || [];
  const trustedRepeatUserFlows =
    retention.trustedRepeatVisitors >= 1 ? "present" : "emerging";

  const weakRetentionCompareClusters = mostRevisitedCompareJourneys.filter(
    (p) => p.revisitQuality === "weak"
  );

  return {
    ...retention,
    ...distribution,
    ...community,
    repeatSessionCompareConfidence,
    trustedReturnUserEvolution,
    recommendationRevisitTrust,
    ownershipGuideRevisitQuality,
    compareRevisitMaturity,
    returningUserConversionQuality,
    repeatUseRecommendationDurability,
    usersReturningForRecommendations,
    mostRevisitedCompareJourneys,
    mostRevisitedOwnershipGuides: distribution.bestAuthorityAcquisitionPaths.filter(
      (p) => String(p.path).includes("ownership") || String(p.path).includes("guide")
    ),
    trustedRepeatUserFlows,
    weakRetentionCompareClusters,
  };
}

/**
 * Adoption maturity bundle for public beta ops.
 */
export function buildAdoptionGrowthReport(ctx = {}) {
  const events = listUsageLearningEvents();
  const adoption = computeAdoptionSignals(events);
  const prev = getAdoptionGrowthWeeklySnapshots()[1];

  const adoptionMaturityTrend =
    prev?.authorityEntryQuality != null &&
    adoption.authorityEntryQuality > prev.authorityEntryQuality + 5
      ? "maturing"
      : "building";

  const readyForBroaderAcquisition =
    adoption.usersReturningForRecommendations &&
    adoption.authorityEntryQuality >= 55 &&
    adoption.retentionQualityHealthy !== false;

  recordAdoptionGrowthWeekly({
    authorityEntryQuality: adoption.authorityEntryQuality,
    trustedSessionRatio: adoption.trustedSessionRatio,
    adoptionMaturityTrend,
  });

  return {
    ...adoption,
    adoptionMaturityTrend,
    trustedReturnUserTrend: adoption.trustedReturnUserEvolution,
    authorityUsefulnessTrend: adoption.authorityRetentionEvolution,
    recommendationDurabilityEvolution: adoption.repeatUseRecommendationDurability,
    trustRetentionEvolution: adoption.returnUserTrustEvolution,
    operationalAdoptionConfidence:
      adoptionMaturityTrend === "maturing" ? "confident" : "building",
    usersAdoptingAsTrustedPlatform: adoption.usersReturningForRecommendations,
    authorityUsefulnessCompounding:
      adoption.guideEntryRetention === "improving",
    recommendationDurabilityHealthy:
      adoption.repeatUseRecommendationDurability === "durable",
    retentionQualityStable:
      adoption.returnUserTrustTrend === "stable" ||
      adoption.returnUserTrustTrend === "improving",
    readyForBroaderAcquisition,
    weeklyAdoptionSnapshot: adoption.retentionQualitySnapshot,
    authorityGrowthSummary: adoption.authorityDistributionSummary,
    recommendationTrustSummary: adoption.recommendationRetentionSummary,
    retentionQualitySummary: adoption.retentionQualitySnapshot,
    weeklyAdoptionSnapshots: getAdoptionGrowthWeeklySnapshots(),
    generatedAt: new Date().toISOString(),
    exportMeta: {
      reportType: "adoption-growth",
      version: 1,
      generatedAt: new Date().toISOString(),
      reviewOwner: "adoption-ops",
      adoptionReviewAt: new Date().toISOString(),
      authorityReviewOwner: "content-ops",
      operationalReadinessAt: new Date().toISOString(),
      trustRetentionReviewAt: new Date().toISOString(),
    },
  };
}
