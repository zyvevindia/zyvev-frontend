/**
 * High-intent EV journey analysis — compare → lead funnels (deterministic).
 */

import { rankCompareDropOffHotspots } from "./trafficObservationOps.js";
import { rankLowConvertingHighTrafficLandings } from "./trafficObservationOps.js";

export function buildHighIntentJourneyReport(ctx = {}) {
  const traffic = ctx.traffic || {};
  const liveOps = ctx.liveOps || {};

  const topEvs = (traffic.topViewedEvs || liveOps.topViewed || []).slice(0, 12);
  const topCompare = (traffic.topComparePages || []).slice(0, 10);
  const topConvert = (traffic.topConvertingPages || []).slice(0, 10);
  const abandon = rankCompareDropOffHotspots(traffic.compareTrends);
  const lowConvert = rankLowConvertingHighTrafficLandings(
    traffic.topLandingPages,
    traffic.topConvertingPages
  );

  const funnels = topCompare.map((pair, i) => {
    const slug = pair.label || pair.slug;
    const trend = (traffic.compareTrends || []).find(
      (t) => String(t.slug) === String(slug)
    );
    const started = Number(trend?.started ?? pair.count ?? 0);
    const completionRate = Number(trend?.completionRate ?? NaN);
    const leads = topConvert.find((c) =>
      String(c.label || "").includes(String(slug).split("-vs-")[0])
    );

    let frictionSeverity = "low";
    if (!Number.isNaN(completionRate) && completionRate < 35) {
      frictionSeverity = "high";
    } else if (!Number.isNaN(completionRate) && completionRate < 55) {
      frictionSeverity = "medium";
    }

    const journeyQualityScore = Math.max(
      0,
      Math.min(
        100,
        (Number.isNaN(completionRate) ? 50 : completionRate) -
          (frictionSeverity === "high" ? 25 : frictionSeverity === "medium" ? 10 : 0) +
          (leads ? 15 : 0)
      )
    );

    const conversionConfidence =
      journeyQualityScore >= 75
        ? "high"
        : journeyQualityScore >= 50
          ? "medium"
          : "low";

    return {
      key: slug || i,
      pairSlug: slug,
      compareStarts: started,
      completionRate: Number.isNaN(completionRate) ? null : completionRate,
      frictionSeverity,
      journeyQualityScore: Math.round(journeyQualityScore),
      conversionConfidence,
      weakCta: lowConvert.some((l) => String(l.label).includes("compare")),
      mobileFrictionNote:
        frictionSeverity === "high"
          ? "Check sticky CTA + compare card overflow on mobile"
          : null,
      scrollDepthProxy:
        completionRate != null && completionRate < 50
          ? "likely shallow engagement"
          : "adequate",
    };
  });

  const topPerforming = [...funnels]
    .sort((a, b) => b.journeyQualityScore - a.journeyQualityScore)
    .slice(0, 5);

  return {
    topEvs,
    topComparePairs: topCompare,
    topConvertingPages: topConvert,
    compareAbandonment: abandon,
    funnels,
    topPerforming,
    highFriction: funnels.filter((f) => f.frictionSeverity === "high"),
    leadFunnel: {
      leads: traffic.leadConversions?.total ?? 0,
      compareStarted: traffic.compareConversions?.started ?? 0,
      compareCompletionRate: traffic.compareConversions?.completionRate ?? null,
    },
    generatedAt: new Date().toISOString(),
  };
}
