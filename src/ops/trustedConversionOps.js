/**
 * Trusted conversion intelligence — quality over quantity (Phase 4 & 5).
 */

import { buildConversionInsightsReport } from "./conversionInsightsOps.js";
import {
  listUsageLearningEvents,
  summarizeUsageLearningBuffer,
} from "./usageLearningBuffer.js";
import { rankCompareDropOffHotspots } from "./trafficObservationOps.js";
import {
  analyzeMultiSessionBehavior,
  buildAnalyticsReliabilityReport,
} from "./buyerBehaviorOps.js";

export const TRUSTED_CONVERSION_STATUS = Object.freeze({
  HIGH_CONFIDENCE: "HIGH_CONFIDENCE",
  TRUSTED: "TRUSTED",
  DEVELOPING: "DEVELOPING",
  NEEDS_REVIEW: "NEEDS_REVIEW",
});

const WEEKLY_KEY = "evsavari-trusted-conversion-weekly-v1";

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

export function recordTrustedConversionWeekly(snapshot) {
  const week = new Date().toISOString().slice(0, 10);
  const filtered = readWeekly().filter((s) => s.week !== week);
  writeWeekly([{ week, at: new Date().toISOString(), ...snapshot }, ...filtered]);
}

function sessionSignalsForPath(path, events) {
  const relevant = events.filter(
    (e) => String(e.meta?.sourcePage || "").includes(path.replace(/^\//, "")) ||
      path.includes(String(e.meta?.sourcePage || ""))
  );
  const tooltips = relevant.filter((e) => e.type === "trust_tooltip_opened").length;
  const guides = relevant.filter(
    (e) =>
      e.type === "ownership_guide_opened" ||
      e.type === "charging_guide_opened"
  ).length;
  const compareDepth = relevant.filter((e) => e.type === "compare_started").length;
  const evViews = relevant.filter((e) => e.type === "ev_viewed").length;
  const abandoned = relevant.some((e) => e.type === "lead_form_abandoned");
  const submitted = relevant.some((e) => e.type === "lead_submitted");
  const mobileFriction = relevant.filter(
    (e) =>
      e.meta?.device === "mobile" &&
      (e.type === "compare_abandoned" || e.type === "lead_form_abandoned")
  ).length;

  return {
    tooltips,
    guides,
    compareDepth,
    evViews,
    abandoned,
    submitted,
    mobileFriction,
    trustAssisted: tooltips > 0 || guides > 0,
  };
}

function scoreTrustedConversionRow(row, events, traffic) {
  const sig = sessionSignalsForPath(row.path, events);
  const baseQuality = row.conversionQualityScore ?? 50;
  const friction = row.frictionSeverity || "low";

  let conversionTrustScore = Math.max(
    0,
    Math.min(
      100,
      baseQuality +
        (row.hasLeadSignal ? 10 : -5) +
        (sig.trustAssisted ? 12 : 0) +
        (sig.compareDepth >= 2 ? 8 : 0) -
        (friction === "high" ? 18 : friction === "medium" ? 8 : 0) -
        (sig.abandoned && !sig.submitted ? 12 : 0)
    )
  );

  const leadQualityConfidence =
    conversionTrustScore >= 78 && sig.submitted
      ? "high"
      : conversionTrustScore >= 55
        ? "medium"
        : "low";

  const ctaTrustConfidence = Math.max(
    0,
    Math.min(
      100,
      conversionTrustScore -
        (row.weakCta ? 15 : 0) +
        (sig.mobileFriction >= 2 ? -10 : 0)
    )
  );

  const conversionMaturityScore = Math.round(
    (conversionTrustScore + ctaTrustConfidence) / 2
  );

  const trustDrivenConversionScore = Math.round(
    conversionTrustScore * 0.5 +
      (sig.trustAssisted ? 25 : 5) +
      (sig.evViews >= 2 ? 15 : 0) +
      (sig.guides > 0 ? 10 : 0)
  );

  const leadIntentMaturity =
    sig.evViews >= 2 && sig.compareDepth >= 1
      ? "researched"
      : sig.evViews >= 1
        ? "browsing"
        : "exploratory";

  const buyerConfidenceMaturity = Math.round(
    (conversionTrustScore + (sig.trustAssisted ? 15 : 0)) * 0.85
  );

  const ownershipResearchDepth = Math.min(100, sig.guides * 20 + sig.tooltips * 8);
  const trustAssistedConversionScore = sig.trustAssisted
    ? Math.round(trustDrivenConversionScore * 1.05)
    : trustDrivenConversionScore;

  let conversionDecayRisk = 0;
  if (row.views >= 20 && !row.hasLeadSignal) conversionDecayRisk += 35;
  if (friction === "high") conversionDecayRisk += 25;
  if (sig.abandoned) conversionDecayRisk += 20;
  if (
    row.completionRate != null &&
    row.completionRate < 35 &&
    row.funnel?.includes("compare")
  ) {
    conversionDecayRisk += 15;
  }
  conversionDecayRisk = Math.min(100, conversionDecayRisk);

  const issues = [];
  if (row.weakCta) issues.push("weak_cta_engagement");
  if (sig.abandoned && !sig.submitted) issues.push("abandoned_lead_flow");
  if (conversionDecayRisk >= 50) issues.push("conversion_decay_risk");
  if (sig.mobileFriction >= 2) issues.push("mobile_friction");
  if (leadQualityConfidence === "low") issues.push("low_confidence_flow");

  let status = TRUSTED_CONVERSION_STATUS.DEVELOPING;
  if (
    conversionTrustScore >= 82 &&
    leadQualityConfidence === "high" &&
    conversionDecayRisk < 25
  ) {
    status = TRUSTED_CONVERSION_STATUS.HIGH_CONFIDENCE;
  } else if (
    conversionTrustScore >= 68 &&
    leadQualityConfidence !== "low" &&
    conversionDecayRisk < 45
  ) {
    status = TRUSTED_CONVERSION_STATUS.TRUSTED;
  } else if (
    conversionDecayRisk >= 55 ||
    leadQualityConfidence === "low" ||
    issues.includes("abandoned_lead_flow")
  ) {
    status = TRUSTED_CONVERSION_STATUS.NEEDS_REVIEW;
  }

  const editorialCtaImprovement = row.weakCta || ctaTrustConfidence < 55;
  const trustRefinementSuggested =
    sig.abandoned && !sig.trustAssisted && friction !== "low";
  const ownershipNuanceSuggested =
    row.funnel?.includes("compare") && ownershipResearchDepth < 40;

  const hints = [];
  if (editorialCtaImprovement) hints.push("Editorial CTA improvement suggested");
  if (trustRefinementSuggested) hints.push("Trust refinement suggested");
  if (ownershipNuanceSuggested) hints.push("Ownership nuance suggested");

  const compareToLeadRealism =
    row.funnel === "compare → lead"
      ? row.completionRate != null && row.completionRate < 40
        ? "Weak compare completion — lead may be early intent; soften CTA copy"
        : "Compare engagement supports realistic dealer callback intent"
      : null;

  return {
    ...row,
    status,
    issues,
    conversionTrustScore,
    leadQualityConfidence,
    ctaTrustConfidence,
    conversionMaturityScore,
    trustDrivenConversionScore,
    leadIntentMaturity,
    buyerConfidenceMaturity,
    ownershipResearchDepth,
    trustAssistedConversionScore,
    conversionDecayRisk,
    compareToLeadRealism,
    editorialCtaImprovementSuggested: editorialCtaImprovement,
    trustRefinementSuggested,
    ownershipNuanceSuggested,
    hints,
    sessionSignals: sig,
  };
}

export function buildTrustedConversionReport(ctx = {}) {
  const events = listUsageLearningEvents();
  const buffer = summarizeUsageLearningBuffer(events);
  const base = buildConversionInsightsReport(ctx);

  const journeyRows = [
    ...base.compareLeadRows.map((r) => ({
      ...r,
      conversionQualityScore: r.conversionQualityScore ?? 50,
      funnel: "compare → lead",
    })),
    ...base.detailLeadRows.map((r) => ({
      ...r,
      conversionQualityScore: r.conversionQualityScore ?? 50,
      funnel: "detail → lead",
    })),
  ].map((row) => scoreTrustedConversionRow(row, events, ctx.traffic));

  const statusCounts = {
    [TRUSTED_CONVERSION_STATUS.HIGH_CONFIDENCE]: 0,
    [TRUSTED_CONVERSION_STATUS.TRUSTED]: 0,
    [TRUSTED_CONVERSION_STATUS.DEVELOPING]: 0,
    [TRUSTED_CONVERSION_STATUS.NEEDS_REVIEW]: 0,
  };
  for (const r of journeyRows) {
    statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
  }

  const weakClusters = {};
  for (const r of journeyRows.filter(
    (x) => x.status === TRUSTED_CONVERSION_STATUS.NEEDS_REVIEW
  )) {
    for (const issue of r.issues) {
      weakClusters[issue] = (weakClusters[issue] || 0) + 1;
    }
  }
  const weakConversionClusters = Object.entries(weakClusters)
    .map(([issue, count]) => ({ issue, count }))
    .sort((a, b) => b.count - a.count);

  const highFriction = journeyRows.filter(
    (r) => r.frictionSeverity === "high" || r.conversionDecayRisk >= 50
  );

  const analytics = buildAnalyticsReliabilityReport(ctx, events);
  const multiSession = analytics.multiSession;

  const whatsapp = ctx.traffic?.whatsappConversions || ctx.traffic?.compareToWhatsApp;
  const channelPreference = {
    whatsappClicks: Number(whatsapp?.total ?? whatsapp?.clicks ?? 0),
    callbackLeads: Number(
      buffer.byType?.lead_submitted ?? ctx.traffic?.leadConversions?.total ?? 0
    ),
    note: "WhatsApp suits quick questions; callback suits detailed quotes — both are opt-in.",
  };

  const highConfidenceJourneys = journeyRows
    .filter((r) => r.status === TRUSTED_CONVERSION_STATUS.HIGH_CONFIDENCE)
    .slice(0, 8);

  const avgConversionTrust =
    journeyRows.length > 0
      ? Math.round(
          journeyRows.reduce((s, r) => s + r.conversionTrustScore, 0) /
            journeyRows.length
        )
      : 0;

  const snapshot = {
    avgConversionTrust,
    highConfidenceCount: statusCounts[TRUSTED_CONVERSION_STATUS.HIGH_CONFIDENCE],
    needsReview: statusCounts[TRUSTED_CONVERSION_STATUS.NEEDS_REVIEW],
    behavioralMaturity: analytics.behavioralIntelligenceMaturity,
  };
  recordTrustedConversionWeekly(snapshot);

  return {
    rows: journeyRows.sort((a, b) => b.conversionTrustScore - a.conversionTrustScore),
    statusCounts,
    highConfidenceJourneys,
    highFrictionJourneys: highFriction.slice(0, 10),
    weakConversionClusters,
    abandonedLeadFlows: journeyRows.filter((r) =>
      r.issues.includes("abandoned_lead_flow")
    ),
    compareAbandonment: rankCompareDropOffHotspots(ctx.traffic?.compareTrends).slice(
      0,
      8
    ),
    channelPreference,
    analytics,
    multiSession,
    avgConversionTrust,
    trustDrivenPatterns: {
      trustAssistedLeads: journeyRows.filter((r) => r.sessionSignals?.trustAssisted)
        .length,
      researchedBeforeLead: journeyRows.filter(
        (r) => r.leadIntentMaturity === "researched"
      ).length,
    },
    weeklySnapshots: readWeekly().slice(0, 6),
    bufferNote:
      buffer.total < 10
        ? "Limited local behavioral buffer — refresh after production traffic accumulates."
        : null,
    generatedAt: new Date().toISOString(),
  };
}
