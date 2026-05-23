/**
 * Conversion insights — compare/detail → lead funnels (public beta).
 */

import { rankCompareDropOffHotspots } from "./trafficObservationOps.js";
import { rankLowConvertingHighTrafficLandings } from "./trafficObservationOps.js";
import { extractFamilySlug } from "../utils/modelFamily.js";

function frictionFromRate(rate) {
  if (rate == null || Number.isNaN(rate)) return "unknown";
  if (rate < 30) return "high";
  if (rate < 55) return "medium";
  return "low";
}

export function buildConversionInsightsReport(ctx = {}) {
  const traffic = ctx.traffic || {};
  const started = Number(traffic.compareConversions?.started ?? 0);
  const completed = Number(traffic.compareConversions?.total ?? 0);
  const compareCompletionRate =
    traffic.compareConversions?.completionRate ??
    (started > 0 ? Math.round((completed / started) * 100) : null);

  const compareToLead = traffic.compareToLead || {};
  const leadsTotal = Number(traffic.leadConversions?.total ?? 0);

  const topEvs = (traffic.topViewedEvs || []).slice(0, 10);
  const topCompare = (traffic.topComparePages || []).slice(0, 12);
  const topConvert = (traffic.topConvertingPages || []).slice(0, 12);
  const abandon = rankCompareDropOffHotspots(traffic.compareTrends);
  const lowConvert = rankLowConvertingHighTrafficLandings(
    traffic.topLandingPages,
    traffic.topConvertingPages
  );

  const compareLeadRows = topCompare.map((pair) => {
    const slug = pair.label || pair.slug;
    const trend = (traffic.compareTrends || []).find(
      (t) => String(t.slug) === String(slug)
    );
    const completionRate = Number(trend?.completionRate ?? NaN);
    const compareStarts = Number(trend?.started ?? pair.count ?? 0);
    const leadMatch = topConvert.find((c) =>
      String(c.label || "").includes(String(slug).split("-vs-")[0])
    );

    const frictionSeverity = frictionFromRate(
      Number.isNaN(completionRate) ? null : completionRate
    );

    const conversionQualityScore = Math.max(
      0,
      Math.min(
        100,
        (Number.isNaN(completionRate) ? 45 : completionRate) * 0.6 +
          (leadMatch ? 25 : 0) -
          (frictionSeverity === "high" ? 20 : frictionSeverity === "medium" ? 8 : 0)
      )
    );

    const leadConfidence =
      conversionQualityScore >= 72
        ? "high"
        : conversionQualityScore >= 48
          ? "medium"
          : "low";

    return {
      key: `compare-${slug}`,
      path: `/compare/${slug}`,
      funnel: "compare → lead",
      views: compareStarts,
      completionRate: Number.isNaN(completionRate) ? null : completionRate,
      frictionSeverity,
      conversionQualityScore: Math.round(conversionQualityScore),
      leadConfidence,
      hasLeadSignal: Boolean(leadMatch),
      weakCta: frictionSeverity === "high",
    };
  });

  const detailLeadRows = topEvs.map((ev) => {
    const family = extractFamilySlug(ev.label);
    const convertRow = topConvert.find((c) =>
      String(c.label || "").includes(family)
    );
    const views = ev.count || 0;
    const conversionQualityScore = Math.max(
      0,
      Math.min(100, (convertRow ? 70 : 35) + Math.min(views * 0.5, 25))
    );
    return {
      key: `detail-${family}`,
      path: `/cars/${family}`,
      funnel: "detail → lead",
      views,
      frictionSeverity: convertRow ? "low" : views > 20 ? "medium" : "low",
      conversionQualityScore: Math.round(conversionQualityScore),
      leadConfidence: convertRow ? "high" : views > 30 ? "medium" : "low",
      hasLeadSignal: Boolean(convertRow),
      weakCta: !convertRow && views > 25,
    };
  });

  const whatsapp = traffic.whatsappConversions || traffic.compareToWhatsApp;
  const callbackPreference = {
    whatsappClicks: Number(whatsapp?.total ?? whatsapp?.clicks ?? 0),
    callbackLeads: Number(
      traffic.leadConversions?.bySource?.find?.((s) =>
        String(s.label || "").toLowerCase().includes("callback")
      )?.count ?? 0
    ),
    note:
      "Preference inferred from traffic-ops when admin token present; otherwise directional only.",
  };

  const mobileFrictionNote =
    compareCompletionRate != null && compareCompletionRate < 45
      ? "Compare completion below 45% — review sticky lead CTA and card layout on mobile."
      : null;

  const topConverting = [...detailLeadRows, ...compareLeadRows]
    .filter((r) => r.leadConfidence === "high")
    .sort((a, b) => b.conversionQualityScore - a.conversionQualityScore)
    .slice(0, 8);

  const lowConvertingHighTraffic = lowConvert.slice(0, 8).map((r) => ({
    path: r.label,
    views: r.views,
    conversionRate: r.conversionRate,
    note: "High traffic with weak lead conversion — tighten CTA copy and trust strip.",
  }));

  const overallConversionQuality = Math.round(
    (compareCompletionRate != null ? compareCompletionRate * 0.4 : 40) +
      Math.min(leadsTotal * 3, 35) +
      (topConverting.length >= 3 ? 15 : 5)
  );

  return {
    compareCompletionRate,
    leadsTotal,
    compareLeadRows,
    detailLeadRows,
    compareAbandonment: abandon.slice(0, 8),
    abandonedLeadFlows: abandon.slice(0, 5),
    weakCtaPages: [...compareLeadRows, ...detailLeadRows].filter((r) => r.weakCta),
    mobileFrictionNote,
    callbackPreference,
    topConverting,
    lowConvertingHighTraffic,
    overallConversionQuality,
    frictionSummary: {
      high: [...compareLeadRows, ...detailLeadRows].filter(
        (r) => r.frictionSeverity === "high"
      ).length,
      medium: [...compareLeadRows, ...detailLeadRows].filter(
        (r) => r.frictionSeverity === "medium"
      ).length,
    },
    generatedAt: new Date().toISOString(),
  };
}
