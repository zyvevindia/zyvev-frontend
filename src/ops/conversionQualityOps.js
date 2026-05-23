/**
 * Conversion quality intelligence — trust-weighted lead journeys.
 */

import { buildConversionInsightsReport } from "./conversionInsightsOps.js";
import {
  listUsageLearningEvents,
  summarizeUsageLearningBuffer,
} from "./usageLearningBuffer.js";

function frictionWeight(severity) {
  if (severity === "high") return 0.6;
  if (severity === "medium") return 0.8;
  return 1;
}

/**
 * @param {object} ctx
 */
export function buildConversionQualityReport(ctx = {}) {
  const base = buildConversionInsightsReport(ctx);
  const events = listUsageLearningEvents();
  const buffer = summarizeUsageLearningBuffer(events);

  const journeyRows = [
    ...base.compareLeadRows,
    ...base.detailLeadRows,
  ].map((row) => {
    const trustBoost = row.hasLeadSignal ? 12 : 0;
    const frictionPenalty =
      row.frictionSeverity === "high"
        ? 22
        : row.frictionSeverity === "medium"
          ? 10
          : 0;

    const conversionTrustScore = Math.max(
      0,
      Math.min(
        100,
        row.conversionQualityScore + trustBoost - frictionPenalty * 0.5
      )
    );

    const leadQualityConfidence =
      conversionTrustScore >= 75 && row.hasLeadSignal
        ? "high"
        : conversionTrustScore >= 50
          ? "medium"
          : "low";

    const journeyMaturityScore = Math.round(
      conversionTrustScore * frictionWeight(row.frictionSeverity)
    );

    const lowQualityCta = row.weakCta && leadQualityConfidence === "low";
    const trustDrivenUplift =
      row.funnel === "detail → lead" && row.leadConfidence === "high";

    return {
      ...row,
      conversionTrustScore: Math.round(conversionTrustScore),
      leadQualityConfidence,
      journeyMaturityScore,
      lowQualityCta,
      trustDrivenUplift,
    };
  });

  const abandonedLeadClusters = events
    .filter((e) => e.type === "lead_form_abandoned" || e.type === "lead_started")
    .slice(0, 20)
    .reduce((acc, e) => {
      const page = e.meta?.sourcePage || "unknown";
      acc[page] = (acc[page] || 0) + 1;
      return acc;
    }, {});

  const abandonedClusters = Object.entries(abandonedLeadClusters)
    .map(([page, count]) => ({ page, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const highIntentQuality = journeyRows
    .filter((r) => r.leadQualityConfidence === "high")
    .sort((a, b) => b.conversionTrustScore - a.conversionTrustScore)
    .slice(0, 8);

  const lowQualityJourneys = journeyRows
    .filter((r) => r.lowQualityCta || r.leadQualityConfidence === "low")
    .slice(0, 8);

  const compareToLeadRealism = base.compareLeadRows.map((r) => ({
    pair: r.path,
    realismNote:
      r.completionRate != null && r.completionRate < 40
        ? "Compare engagement weak — lead intent may be exploratory"
        : "Compare-to-lead path shows adequate engagement",
    leadConfidence: r.leadConfidence,
  }));

  const overallConversionTrust = Math.round(
    journeyRows.length > 0
      ? journeyRows.reduce((s, r) => s + r.conversionTrustScore, 0) /
          journeyRows.length
      : base.overallConversionQuality
  );

  const trustTooltipEngagement = buffer.byType?.trust_tooltip_opened || 0;
  const trustUpliftProxy =
    trustTooltipEngagement > 0 && overallConversionTrust >= 55
      ? "positive"
      : "neutral";

  return {
    ...base,
    journeyRows,
    highIntentQuality,
    lowQualityJourneys,
    abandonedLeadClusters: abandonedClusters,
    compareToLeadRealism,
    overallConversionTrust,
    trustUpliftProxy,
    trustTooltipEngagement,
    avgJourneyMaturity:
      journeyRows.length > 0
        ? Math.round(
            journeyRows.reduce((s, r) => s + r.journeyMaturityScore, 0) /
              journeyRows.length
          )
        : 0,
    generatedAt: new Date().toISOString(),
  };
}
