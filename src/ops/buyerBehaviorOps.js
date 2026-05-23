/**
 * Multi-session buyer behavior — buffer-based, no PII.
 */

import { listUsageLearningEvents } from "./usageLearningBuffer.js";
import { isGa4Configured, isPostHogConfigured } from "../analytics/config.js";

function deviceOf(e) {
  return e.meta?.device || "unknown";
}

/**
 * Session-level journeys for lead quality signals.
 */
export function analyzeMultiSessionBehavior(events = listUsageLearningEvents()) {
  const bySession = {};
  for (const e of events) {
    const sid = e.sessionId || "_anon";
    if (!bySession[sid]) bySession[sid] = [];
    bySession[sid].push(e);
  }

  const sessions = Object.entries(bySession);
  let multiSessionResearchers = 0;
  let deepCompareSessions = 0;
  let trustBeforeLead = 0;
  let guideBeforeLead = 0;
  let returnBeforeConvert = 0;

  const familyViews = {};
  const comparePairs = {};

  for (const [, sessEvents] of sessions) {
    const sorted = [...sessEvents].sort(
      (a, b) => new Date(a.at) - new Date(b.at)
    );
    const evViews = sorted.filter((e) => e.type === "ev_viewed").length;
    const compareStarts = sorted.filter((e) => e.type === "compare_started").length;
    const tooltips = sorted.filter((e) => e.type === "trust_tooltip_opened").length;
    const guides = sorted.filter(
      (e) =>
        e.type === "ownership_guide_opened" ||
        e.type === "charging_guide_opened" ||
        e.type === "ownership_insight_viewed" ||
        e.type === "charging_section_viewed"
    ).length;
    const leadSubmitted = sorted.some((e) => e.type === "lead_submitted");

    if (evViews >= 2 || compareStarts >= 2) multiSessionResearchers += 1;
    if (compareStarts >= 1 && sorted.some((e) => e.type === "compare_completed")) {
      deepCompareSessions += 1;
    }

    const leadIdx = sorted.findIndex((e) => e.type === "lead_submitted");
    if (leadIdx > 0) {
      const before = sorted.slice(0, leadIdx);
      if (before.some((e) => e.type === "trust_tooltip_opened")) trustBeforeLead += 1;
      if (
        before.some(
          (e) =>
            e.type === "ownership_guide_opened" ||
            e.type === "charging_guide_opened"
        )
      ) {
        guideBeforeLead += 1;
      }
      if (before.filter((e) => e.type === "ev_viewed").length >= 2) {
        returnBeforeConvert += 1;
      }
    }

    for (const e of sorted) {
      if (e.meta?.familySlug) {
        familyViews[e.meta.familySlug] = (familyViews[e.meta.familySlug] || 0) + 1;
      }
      if (e.meta?.pairSlug) {
        comparePairs[e.meta.pairSlug] = (comparePairs[e.meta.pairSlug] || 0) + 1;
      }
    }
  }

  const repeatFamilies = Object.entries(familyViews)
    .filter(([, n]) => n >= 2)
    .map(([family, views]) => ({ family, views }))
    .sort((a, b) => b.views - a.views);

  const repeatComparePairs = Object.entries(comparePairs)
    .filter(([, n]) => n >= 2)
    .map(([pairSlug, count]) => ({ pairSlug, count }));

  const uniqueSessions = sessions.length;
  const multiSessionMaturity =
    uniqueSessions > 0
      ? Math.round(
          ((multiSessionResearchers + deepCompareSessions) / uniqueSessions) * 100
        )
      : 0;

  const buyerResearchConfidence = Math.min(
    100,
    multiSessionMaturity * 0.4 +
      (repeatFamilies.length >= 2 ? 20 : 0) +
      (trustBeforeLead > 0 ? 15 : 0) +
      (guideBeforeLead > 0 ? 15 : 0)
  );

  const considerationDepth = Math.round(
    (deepCompareSessions / Math.max(uniqueSessions, 1)) * 50 +
      (repeatComparePairs.length >= 1 ? 25 : 0) +
      (returnBeforeConvert > 0 ? 25 : 0)
  );

  return {
    uniqueSessions,
    multiSessionResearchers,
    deepCompareSessions,
    trustBeforeLead,
    guideBeforeLead,
    returnBeforeConvert,
    repeatFamilies: repeatFamilies.slice(0, 8),
    repeatComparePairs: repeatComparePairs.slice(0, 8),
    multiSessionMaturityScore: multiSessionMaturity,
    buyerResearchConfidence,
    considerationDepthScore: considerationDepth,
  };
}

export function buildAnalyticsReliabilityReport(ctx = {}, events = listUsageLearningEvents()) {
  const buffer = events.length;
  const ga4 = isGa4Configured();
  const posthog = isPostHogConfigured();
  const traffic = ctx.traffic || {};

  const hasTraffic =
    Boolean(traffic.source && traffic.source !== "unavailable") ||
    Number(traffic.compareConversions?.started) > 0;

  const funnelReliability =
    buffer >= 15 && hasTraffic ? 85 : buffer >= 8 ? 65 : buffer > 0 ? 45 : 25;

  const sessionContinuity =
    events.filter((e) => e.sessionId).length > 0
      ? Math.min(100, Math.round((events.filter((e) => e.sessionId).length / buffer) * 100))
      : 40;

  const analyticsConfidence = Math.round(
    (ga4 || posthog ? 35 : 10) +
      funnelReliability * 0.35 +
      sessionContinuity * 0.2 +
      (buffer >= 25 ? 10 : buffer / 2.5)
  );

  const behavioralDataMaturity = Math.min(
    100,
    Math.round(buffer * 0.5 + (hasTraffic ? 30 : 5))
  );

  const multi = analyzeMultiSessionBehavior(events);

  const mobileEvents = events.filter((e) => deviceOf(e) === "mobile");
  const desktopEvents = events.filter((e) => deviceOf(e) === "desktop");
  const mobileLeadDrop =
    mobileEvents.filter((e) => e.type === "lead_form_abandoned").length;
  const mobileCompareAbandon = mobileEvents.filter(
    (e) => e.type === "compare_abandoned"
  ).length;

  const compareStarted = events.filter((e) => e.type === "compare_started").length;
  const compareCompleted = events.filter((e) => e.type === "compare_completed").length;
  const compareFunnelConfidence =
    compareStarted > 0
      ? Math.round((compareCompleted / compareStarted) * 100)
      : null;

  const trustEngagement = events.filter(
    (e) => e.type === "trust_tooltip_opened"
  ).length;
  const trustEngagementQuality = Math.min(
    100,
    trustEngagement * 4 + (multi.trustBeforeLead > 0 ? 20 : 0)
  );

  const ownershipResearch = events.filter(
    (e) =>
      e.type === "ownership_guide_opened" ||
      e.type === "ownership_insight_viewed"
  ).length;
  const chargingResearch = events.filter(
    (e) =>
      e.type === "charging_guide_opened" ||
      e.type === "charging_section_viewed"
  ).length;
  const ownershipResearchMaturity = Math.min(
    100,
    ownershipResearch * 5 + chargingResearch * 5
  );

  const behavioralIntelligenceMaturity = Math.round(
    analyticsConfidence * 0.35 +
      multi.buyerResearchConfidence * 0.25 +
      trustEngagementQuality * 0.2 +
      ownershipResearchMaturity * 0.2
  );

  return {
    analyticsConfidence,
    behavioralDataMaturity,
    funnelReliabilityConfidence: funnelReliability,
    sessionContinuityConfidence: sessionContinuity,
    compareFunnelConfidence,
    trustEngagementQuality,
    ownershipResearchMaturity,
    behavioralIntelligenceMaturity,
    multiSession: multi,
    device: {
      mobileEvents: mobileEvents.length,
      desktopEvents: desktopEvents.length,
      mobileLeadDrop,
      mobileCompareAbandon,
      mobileFrictionSeverity:
        mobileCompareAbandon + mobileLeadDrop >= 4
          ? "high"
          : mobileCompareAbandon + mobileLeadDrop >= 2
            ? "medium"
            : "low",
      deviceTrustConfidence:
        mobileEvents.length > desktopEvents.length
          ? Math.max(40, 100 - mobileLeadDrop * 8 - mobileCompareAbandon * 5)
          : 75,
      mobileConversionMaturity: Math.max(
        0,
        70 - mobileLeadDrop * 10 - mobileCompareAbandon * 6
      ),
    },
    ga4Ready: ga4,
    posthogReady: posthog,
  };
}
