/**
 * Behavioral intelligence — compare engagement, trust trends, non-invasive signals.
 */

import { listUsageLearningEvents } from "./usageLearningBuffer.js";
import { aggregateCompareBehavior } from "./behavioralTrustOps.js";
import { buildCompareQualityReport } from "./compareQualityOps.js";
import { buildRecommendationRealismReport } from "./recommendationRealismOps.js";
import { rankCompareDropOffHotspots } from "./trafficObservationOps.js";

export const BEHAVIORAL_INTEL_STATUS = Object.freeze({
  HIGH: "HIGH",
  MEDIUM: "MEDIUM",
  LOW: "LOW",
});

const WEEKLY_KEY = "evsavari-behavioral-intelligence-weekly-v1";

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
    localStorage.setItem(WEEKLY_KEY, JSON.stringify(arr.slice(0, 10)));
  } catch {
    /* quota */
  }
}

export function recordBehavioralIntelligenceWeekly(snapshot) {
  const week = new Date().toISOString().slice(0, 10);
  const filtered = readWeekly().filter((s) => s.week !== week);
  writeWeekly([{ week, at: new Date().toISOString(), ...snapshot }, ...filtered]);
}

export function getBehavioralIntelligenceWeeklySnapshots() {
  return readWeekly().slice(0, 8);
}

function countEvents(events, type) {
  return events.filter((e) => e.type === type).length;
}

function engagementQualityScore(global, byPair) {
  const started = global.compare_started || 0;
  const completed = global.compare_completed || 0;
  const abandoned = global.compare_abandoned || 0;
  if (started === 0) return 50;
  const completionRate = completed / started;
  const abandonRate = abandoned / Math.max(1, started);
  let score = Math.round(completionRate * 70 + (1 - abandonRate) * 30);
  if (global.scroll_deep > global.scroll_shallow) score += 8;
  if (global.trust_tooltip_opened > 0) score += 5;
  if (global.ownership_tooltip_opened > 0) score += 3;
  if (global.suitability_guidance_opened > 0) score += 2;
  const shallowPairs = Object.values(byPair).filter(
    (p) => p.started > 2 && p.completed === 0
  ).length;
  score -= shallowPairs * 4;
  return Math.max(0, Math.min(100, score));
}

function confusionIndicators(global, byPair) {
  const indicators = [];
  if (global.compare_abandoned > global.compare_completed) {
    indicators.push("abandon_exceeds_completion");
  }
  if (global.trust_tooltip_opened > global.compare_completed * 2) {
    indicators.push("high_trust_tooltip_vs_completion");
  }
  if (global.compare_abandon_after_guidance > global.compare_completed) {
    indicators.push("abandon_after_guidance_exceeds_completion");
  }
  if (global.recommendation_doubted > 3) {
    indicators.push("elevated_recommendation_doubt");
  }
  const bouncePairs = Object.entries(byPair)
    .filter(([, p]) => p.started >= 3 && p.completed === 0)
    .map(([slug]) => slug);
  if (bouncePairs.length) {
    indicators.push("high_bounce_compare_pairs");
  }
  return { indicators, bouncePairs: bouncePairs.slice(0, 10) };
}

function repeatedEvInterest(events) {
  const families = {};
  for (const e of events) {
    if (e.type !== "ev_viewed" && e.type !== "repeated_ev_interest") continue;
    const f = e.meta?.familySlug || e.meta?.slug;
    if (!f) continue;
    families[f] = (families[f] || 0) + 1;
  }
  return Object.entries(families)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([familySlug, views]) => ({ familySlug, views }));
}

function multiSessionCompare(events) {
  const sessions = new Set(
    events.map((e) => e.meta?.sessionId).filter(Boolean)
  );
  const compareSessions = new Set(
    events
      .filter((e) => String(e.type).includes("compare"))
      .map((e) => e.meta?.sessionId)
      .filter(Boolean)
  );
  return {
    distinctSessions: sessions.size,
    compareSessions: compareSessions.size,
    multiSessionCompare: compareSessions.size > 1,
  };
}

/**
 * @param {object} ctx
 */
export function buildBehavioralIntelligenceReport(ctx = {}) {
  const events = listUsageLearningEvents();
  const { global, byPair } = aggregateCompareBehavior(events);
  const compareQuality = buildCompareQualityReport(ctx);
  const realism = buildRecommendationRealismReport(ctx);
  const dropoffs = rankCompareDropOffHotspots(ctx.compareTrends || []);

  const engagementQuality = engagementQualityScore(global, byPair);
  const confusion = confusionIndicators(global, byPair);

  const completionPct =
    global.compare_started > 0
      ? Math.round((global.compare_completed / global.compare_started) * 100)
      : 0;

  const topConverting = compareQuality.rows
    .filter((r) => r.status === "STRONG" || r.status === "ACCEPTABLE")
    .slice(0, 8)
    .map((r) => ({
      pairSlug: r.pairSlug,
      compareQualityScore: r.compareQualityScore,
      credibilityScore: r.credibilityScore,
    }));

  const lowTrustPairs = compareQuality.rows
    .filter((r) => r.status === "NEEDS_REVIEW")
    .slice(0, 8);

  const weakClusters = realism.rows
    .filter((r) => r.status === "NEEDS_REVIEW" || r.realismScore < 55)
    .slice(0, 8);

  const leadStarted = countEvents(events, "lead_started");
  const leadSubmitted = countEvents(events, "lead_submitted");
  const leadAbandoned = countEvents(events, "lead_abandoned");
  const conversionConfidence =
    leadStarted > 0
      ? Math.round((leadSubmitted / leadStarted) * 100)
      : null;

  const snapshot = {
    engagementQuality,
    completionPct,
    conversionConfidence,
    eventCount: events.length,
  };
  recordBehavioralIntelligenceWeekly(snapshot);

  const prev = getBehavioralIntelligenceWeeklySnapshots()[1];
  const recommendationTrustTrend =
    prev?.engagementQuality != null &&
    engagementQuality < prev.engagementQuality - 8
      ? "declining"
      : prev?.engagementQuality != null &&
          engagementQuality > prev.engagementQuality + 5
        ? "improving"
        : "stable";

  const guidanceEngagement =
    (global.ownership_tooltip_opened || 0) +
    (global.charging_practicality_opened || 0) +
    (global.suitability_guidance_opened || 0);

  const recommendationStabilityTrend =
    global.recommendation_doubted > global.compare_completed * 0.25
      ? "unstable"
      : recommendationTrustTrend;

  const suitabilityConfidenceTrend =
    global.suitability_guidance_opened > 0 &&
    global.compare_completed > 0 &&
    global.suitability_guidance_opened / global.compare_completed > 0.4
      ? "high_curiosity"
      : "stable";

  const chargingRealismTrend =
    global.charging_practicality_opened > global.compare_completed
      ? "charging_scrutiny_high"
      : "stable";

  return {
    engagementQuality,
    compareCompletionPct: completionPct,
    recommendationTrustTrend,
    conversionConfidenceTrend:
      conversionConfidence != null && conversionConfidence < 25
        ? "weak"
        : "stable",
    confusionIndicators: confusion.indicators,
    highBounceComparePairs: confusion.bouncePairs,
    topConvertingComparePairs: topConverting,
    lowTrustComparePairs: lowTrustPairs,
    weakRecommendationClusters: weakClusters,
    repeatedEvInterest: repeatedEvInterest(events),
    multiSession: multiSessionCompare(events),
    recommendationStabilityTrend,
    suitabilityConfidenceTrend,
    chargingRealismTrend,
    guidanceEngagement,
    lowTrustCompareJourneys: lowTrustPairs,
    highConfusionComparePairs: confusion.bouncePairs,
    weakSuitabilityJourneys: countEvents(events, "suitability_guidance_opened"),
    abandonAfterGuidance: global.compare_abandon_after_guidance || 0,
    globalSignals: {
      compare_started: global.compare_started,
      compare_completed: global.compare_completed,
      compare_abandoned: global.compare_abandoned,
      lead_started: leadStarted,
      lead_submitted: leadSubmitted,
      lead_abandoned: leadAbandoned,
      trust_tooltip_opened: global.trust_tooltip_opened,
      ownership_tooltip_opened: global.ownership_tooltip_opened || 0,
      charging_practicality_opened: global.charging_practicality_opened || 0,
      compare_confidence_expanded: global.compare_confidence_expanded || 0,
      suitability_guidance_opened: global.suitability_guidance_opened || 0,
      recommendation_doubted: global.recommendation_doubted || 0,
      compare_abandon_after_guidance:
        global.compare_abandon_after_guidance || 0,
      repeated_ev_interest: countEvents(events, "repeated_ev_interest"),
      multi_session_compare: countEvents(events, "multi_session_compare"),
      high_bounce_compare: countEvents(events, "high_bounce_compare"),
      weak_conversion_compare: countEvents(events, "weak_conversion_compare"),
    },
    dropoffHotspots: dropoffs.slice(0, 8),
    weeklySnapshots: getBehavioralIntelligenceWeeklySnapshots(),
    generatedAt: new Date().toISOString(),
    exportMeta: {
      reportType: "behavioral-intelligence",
      version: 1,
      generatedAt: new Date().toISOString(),
      privacyNote: "Session-scoped buffer only — no fingerprinting",
    },
  };
}
