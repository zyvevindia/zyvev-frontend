/**
 * SEO authority expansion — clusters, internal links, guide opportunities.
 */

import { buildSeoOpportunityQueue } from "./seoOpportunityOps.js";
import { ensureArray } from "../utils/compareArrayUtils.js";
import { GENERATED_COMPARE_SLUGS } from "../content/generated/manifest.js";
import { INTELLIGENCE_DISCOVERY_PRESETS } from "../data/intelligenceDiscoveryPresets.js";

/** Controlled authority clusters — no mass-generated pages. */
export const AUTHORITY_GUIDE_TARGETS = Object.freeze([
  {
    id: "best_ev_under_10_lakh",
    title: "Best EV under ₹10 lakh",
    path: "/best-evs/under-10-lakh",
    cluster: "best_ev_authority",
    linkFrom: ["/discover/under-15-lakh", "/compare"],
  },
  {
    id: "best_ev_city",
    title: "Best EV for city driving",
    path: "/discover/city-driving",
    cluster: "discovery",
    linkFrom: ["/compare", "/charging-guides/home-charging"],
  },
  {
    id: "best_ev_highway",
    title: "Best EV for highway driving",
    path: "/discover/highway-evs",
    cluster: "discovery",
    linkFrom: ["/compare", "/ownership/highway-ownership"],
  },
  {
    id: "best_ev_family",
    title: "Best EV for family",
    path: "/discover/family-friendly",
    cluster: "discovery",
    linkFrom: ["/compare", "/best-evs/large-family"],
  },
  {
    id: "ev_charging_guide",
    title: "EV charging guide",
    path: "/charging-guides/home-charging",
    cluster: "charging",
    linkFrom: ["/compare", "/discover/apartment-living"],
  },
  {
    id: "ev_ownership_cost",
    title: "EV ownership cost guide",
    path: "/ownership/running-cost",
    cluster: "ownership",
    linkFrom: ["/cars", "/compare"],
  },
  {
    id: "ownership_reality",
    title: "Ownership reality & TCO",
    path: "/guides/ownership-running-cost",
    cluster: "ownership_reality",
    linkFrom: ["/compare", "/cars"],
  },
  {
    id: "apartment_charging",
    title: "Apartment & society charging",
    path: "/guides/ownership-society-rwa",
    cluster: "apartment",
    linkFrom: ["/compare", "/discover/apartment-living"],
  },
  {
    id: "city_vs_highway",
    title: "City vs highway suitability",
    path: "/discover/city-driving",
    cluster: "suitability",
    linkFrom: ["/compare", "/discover/highway-evs"],
  },
  {
    id: "ev_beginner",
    title: "EV beginner guidance",
    path: "/discover/under-15-lakh",
    cluster: "beginner",
    linkFrom: ["/compare", "/cars"],
  },
  {
    id: "family_practicality",
    title: "Family EV practicality",
    path: "/discover/family-friendly",
    cluster: "family",
    linkFrom: ["/compare", "/best-evs/large-family"],
  },
  {
    id: "long_trip_guidance",
    title: "Long-trip EV guidance",
    path: "/guides/ownership-highway-ownership",
    cluster: "highway",
    linkFrom: ["/compare", "/discover/highway-evs"],
  },
]);

function clusterFromPath(path = "") {
  const p = String(path).toLowerCase();
  if (p.includes("/compare/")) return "compare";
  if (p.includes("/charging")) return "charging";
  if (p.includes("/ownership")) return "ownership";
  if (p.includes("/best-ev")) return "best_ev_authority";
  if (p.startsWith("/discover")) return "discovery";
  return "other";
}

/**
 * @param {object} ctx
 */
export function buildSeoAuthorityReport(ctx = {}) {
  const opportunities = buildSeoOpportunityQueue(ctx.seoDiscipline, {
    topLandingPages: ctx.traffic?.topLandingPages,
    topConvertingPages: ctx.traffic?.topConvertingPages,
  });

  const comparePages = (ctx.traffic?.topComparePages || [])
    .slice(0, 15)
    .map((r) => ({
      path: `/compare/${r.label}`,
      slug: r.label,
      views: r.count,
      inManifest: GENERATED_COMPARE_SLUGS.includes(r.label),
    }));

  const strongestCompare = [...comparePages]
    .sort((a, b) => b.views - a.views)
    .slice(0, 6);

  const weakCompare = opportunities
    .filter((o) => o.path?.includes("/compare") || o.kind?.includes("traffic"))
    .slice(0, 8);

  const clusters = {};
  for (const row of opportunities) {
    const c = clusterFromPath(row.path);
    if (!clusters[c]) {
      clusters[c] = { id: c, count: 0, paths: [] };
    }
    clusters[c].count += 1;
    if (clusters[c].paths.length < 5) clusters[c].paths.push(row.path);
  }

  for (const preset of Object.values(INTELLIGENCE_DISCOVERY_PRESETS || {})) {
    const c = clusterFromPath(preset.path);
    if (!clusters[c]) clusters[c] = { id: c, label: c, count: 0, paths: [] };
    clusters[c].guideCandidates = (clusters[c].guideCandidates || 0) + 1;
  }

  const internalLinkRecs = opportunities.slice(0, 12).map((o) => ({
    from: "hub or related discovery",
    to: o.path,
    reason: o.suggestion,
    severity: o.severity,
  }));

  const presetSlugs = new Set(
    Object.keys(INTELLIGENCE_DISCOVERY_PRESETS || {})
  );
  const clusterCompleteness = Object.fromEntries(
    [
      "discovery",
      "charging",
      "ownership",
      "ownership_reality",
      "apartment",
      "suitability",
      "beginner",
      "family",
      "highway",
      "compare",
      "best_ev_authority",
    ].map(
      (id) => {
        const presetCount = AUTHORITY_GUIDE_TARGETS.filter(
          (g) => g.cluster === id
        ).length;
        const clusterPaths = clusters[id]?.paths?.length ?? 0;
        const score = Math.min(
          100,
          presetCount * 15 + clusterPaths * 5 + (clusters[id]?.count ?? 0) * 2
        );
        return [id, { id, score, presetCount, clusterPaths }];
      }
    )
  );

  const presetPaths = new Set(
    Object.values(INTELLIGENCE_DISCOVERY_PRESETS || {}).map((p) => p.path)
  );

  const guideOpportunities = AUTHORITY_GUIDE_TARGETS.map((guide) => {
    const hasPreset =
      presetPaths.has(guide.path) ||
      presetSlugs.has(guide.path.replace("/discover/", ""));
    const trafficBoost = strongestCompare.some((c) =>
      guide.linkFrom.some((lf) => c.path?.includes("compare"))
    )
      ? 12
      : 0;
    const guideOpportunityScore = Math.min(
      100,
      55 +
        (hasPreset ? 20 : 0) +
        trafficBoost +
        (weakCompare.length > 2 && guide.cluster === "charging" ? 15 : 0)
    );
    return {
      ...guide,
      guideOpportunityScore,
      editorialNote: hasPreset
        ? "Deepen editorial on existing hub — link from top compare pairs."
        : "Ensure hub exists in sitemap before scaling internal links.",
    };
  }).sort((a, b) => b.guideOpportunityScore - a.guideOpportunityScore);

  const compareToGuideLinks = ensureArray(strongestCompare).flatMap((cmp) =>
    guideOpportunities.slice(0, 2).map((g) => ({
      from: cmp.path,
      to: g.path,
      reason: `Support ${g.title} authority from high-traffic compare`,
    }))
  );

  const topicalAuthorityScore = Math.round(
    Object.values(clusterCompleteness).reduce((s, c) => s + c.score, 0) /
      Math.max(Object.keys(clusterCompleteness).length, 1)
  );

  const clusterAuthorityScore = Math.max(
    0,
    100 -
      (ctx.seoDiscipline?.orphanDiscoveryPaths?.length || 0) * 4 -
      weakCompare.length * 3
  );

  const compareSeoMaturity =
    strongestCompare.length >= 4 && weakCompare.length <= 2
      ? "mature"
      : strongestCompare.length >= 2
        ? "developing"
        : "early";

  const events = ctx.usageEvents || [];
  const usefulnessCount = events.filter(
    (e) => e.type === "usefulness_feedback" && e.meta?.useful === "1"
  ).length;
  const usefulnessTotal = events.filter(
    (e) => e.type === "usefulness_feedback"
  ).length;

  const weakAuthorityClusters = Object.entries(clusterCompleteness)
    .filter(([, c]) => c.score < 55)
    .map(([id, c]) => ({ clusterId: id, score: c.score }))
    .sort((a, b) => a.score - b.score);

  const underlinkedComparePages = strongestCompare
    .filter((c) => !c.inManifest)
    .slice(0, 8);

  const trustContentOpportunities = guideOpportunities
    .filter((g) => g.guideOpportunityScore >= 70)
    .slice(0, 8);

  const authorityDepthTrend =
    topicalAuthorityScore >= 70 ? "deepening" : topicalAuthorityScore >= 55 ? "building" : "early";

  const authorityQualityTrend =
    usefulnessTotal >= 5 && usefulnessCount / usefulnessTotal >= 0.55
      ? "improving"
      : usefulnessTotal >= 3
        ? "stable"
        : "early";

  const weakTrustContentClusters = weakAuthorityClusters.filter(
    (c) => c.score < 45
  );

  const comparePagesLackingSupport = weakCompare
    .filter((w) => w.severity !== "low")
    .map((w) => ({
      pairSlug: w.pairSlug || w.slug,
      reason: "weak_compare_authority_support",
    }))
    .slice(0, 10);

  const guideUsefulnessTrend =
    usefulnessRate != null && usefulnessRate >= 65
      ? "improving"
      : usefulnessRate != null
        ? "stable"
        : "early";

  const ownershipContentGaps = Object.entries(clusterCompleteness)
    .filter(([id]) => id.includes("ownership") || id === "ownership_reality")
    .filter(([, c]) => c.score < 60)
    .map(([id, c]) => ({ clusterId: id, score: c.score }));

  const chargingContentGaps = Object.entries(clusterCompleteness)
    .filter(([id]) => id.includes("charging") || id === "apartment")
    .filter(([, c]) => c.score < 60)
    .map(([id, c]) => ({ clusterId: id, score: c.score }));

  return {
    opportunities,
    strongestCompare,
    weakCompare,
    underlinkedDiscovery: (
      ctx.seoDiscipline?.orphanDiscoveryPaths || []
    ).slice(0, 10),
    topicalClusters: Object.values(clusters),
    internalLinkRecs,
    guideOpportunities,
    compareToGuideLinks,
    clusterCompleteness,
    topicalAuthorityScore,
    clusterAuthorityScore,
    compareSeoMaturity,
    needsGuideSupport: weakCompare.filter((w) => w.severity !== "low"),
    authorityDepthTrend,
    weakAuthorityClusters,
    underlinkedComparePages,
    trustContentOpportunities,
    guideUsefulnessSignals: {
      positive: usefulnessCount,
      total: usefulnessTotal,
      rate:
        usefulnessTotal > 0
          ? Math.round((usefulnessCount / usefulnessTotal) * 100)
          : null,
    },
    authorityQualityTrend,
    weakTrustContentClusters,
    comparePagesLackingSupportContent: comparePagesLackingSupport,
    guideUsefulnessTrend,
    ownershipContentGaps,
    chargingContentGaps,
    contentTrustTrend: authorityQualityTrend,
    authorityUsefulnessScore: topicalAuthorityScore,
    weakPracticalContentClusters: weakTrustContentClusters,
    compareSupportContentGaps: comparePagesLackingSupport,
    lowEngagementAuthorityPages: guideOpportunities
      .filter((g) => g.guideOpportunityScore < 55)
      .slice(0, 8),
    internalDiscoveryHealth:
      (ctx.seoDiscipline?.orphanDiscoveryPaths?.length ?? 0) <= 2
        ? "healthy"
        : (ctx.seoDiscipline?.orphanDiscoveryPaths?.length ?? 0) <= 6
          ? "watch"
          : "weak",
    weakDiscoveryPaths: (ctx.seoDiscipline?.orphanDiscoveryPaths || []).slice(
      0,
      8
    ),
    orphanAuthorityContent: guideOpportunities
      .filter((g) => g.guideOpportunityScore < 50)
      .slice(0, 6),
    underlinkedPracticalGuides: internalLinkRecs
      .filter((r) => r.severity !== "low")
      .slice(0, 8),
    comparePagesLackingGuidance: comparePagesLackingSupport,
    weakInternalAuthorityFlow:
      internalLinkRecs.filter((r) => r.severity === "high").length >= 3
        ? "weak"
        : "adequate",
    weakAuthorityDiscovery: internalLinkRecs
      .filter((r) => r.severity === "high")
      .slice(0, 6),
    authorityDiscoveryPersistence:
      topicalAuthorityScore >= 65 ? "deepening" : "building",
    compareSupportAuthorityDepth:
      compareToGuideLinks.length >= 4 ? "adequate" : "shallow",
    practicalDiscoveryQuality:
      clusterAuthorityScore >= 60 ? "healthy" : "early",
    underlinkedOwnershipGuides: guideOpportunities
      .filter((g) => g.cluster === "ownership_reality" || g.cluster === "ownership")
      .slice(0, 6),
    weakAuthorityDiscoveryFlows:
      internalDiscoveryHealth === "weak" ? "needs_work" : "adequate",
    orphanPracticalContentAlerts: guideOpportunities
      .filter((g) => g.guideOpportunityScore < 50)
      .slice(0, 6),
    lowTrustAuthorityPaths: weakTrustContentClusters,
    practicalGuidesLackingDiscovery: guideOpportunities
      .filter((g) => g.guideOpportunityScore < 55)
      .slice(0, 6),
    weakCompareSupportAuthority: needsGuideSupport.slice(0, 8),
    authorityCompoundingHealthy:
      authorityDepthTrend === "deepening" || authorityQualityTrend === "improving",
    authorityDiscoveryDurability: authorityDiscoveryPersistence,
    practicalContentDiscoveryPersistence:
      practicalDiscoveryQuality === "healthy" ? "persistent" : "building",
    weakDiscoveryRetention:
      internalDiscoveryHealth === "weak" ? "weak" : "adequate",
    compareSupportAuthorityPersistence: compareSupportAuthorityDepth,
    underlinkedHighRetentionGuides: guideOpportunities
      .filter((g) => g.guideOpportunityScore >= 65)
      .slice(0, 6),
    mostDurableAuthorityDiscovery: trustContentOpportunities.slice(0, 6),
    weakAuthorityRetentionPaths: weakAuthorityDiscovery,
    highRetentionCompareSupportContent: ensureArray(compareToGuideLinks).slice(
      0,
      8
    ),
    practicalContentDiscoveryGaps: practicalGuidesLackingDiscovery,
    authorityDiscoveryPersistence: authorityDiscoveryPersistence,
    practicalContentDiscoveryQuality: practicalDiscoveryQuality,
    underlinkedAuthorityContent: underlinkedPracticalGuides,
    weakDiscoveryRetentionPaths: weakDiscoveryPaths,
    compareSupportAuthorityDurability: compareSupportAuthorityPersistence,
    strongCompareSupportAuthority: highRetentionCompareSupportContent,
    authorityMemorabilityTrend:
      topicalAuthorityScore >= 70 && authorityQualityTrend === "improving"
        ? "memorable"
        : "building",
    practicalContentRetentionPersistence:
      practicalDiscoveryQuality === "healthy" ? "persistent" : "building",
    weakAuthorityMemoryPaths: weakDiscoveryPaths,
    underlinkedHighValuePracticalGuides:
      guideOpportunities.filter((g) => g.guideOpportunityScore >= 60).slice(0, 6),
    mostMemorableAuthorityContent: trustContentOpportunities.slice(0, 6),
    authorityMemorabilityPersistence:
      authorityMemorabilityTrend === "memorable" ? "persistent" : "building",
    practicalGuideUsefulnessDurability:
      guideUsefulnessTrend === "improving" ? "durable" : "building",
    compareSupportAuthorityQuality:
      compareSupportAuthorityDepth === "adequate" ? "strong" : "emerging",
    weakAuthorityMemoryHotspots: weakDiscoveryPaths,
    authorityConsistencyPersistence:
      authorityDiscoveryPersistence === "deepening" ? "persistent" : "building",
    practicalContentDiscoveryQuality: practicalDiscoveryQuality,
    weakDiscoveryConsistency:
      internalDiscoveryHealth === "weak" ? "weak" : "adequate",
    underlinkedPracticalContentAlerts: practicalGuidesLackingDiscovery,
    weakAuthorityConsistency:
      weakInternalAuthorityFlow === "weak" ? "weak" : "adequate",
    contentQualityPersistence:
      authorityQualityTrend === "improving" ? "persistent" : "building",
    authorityUsefulnessDurability: authorityDiscoveryPersistence,
    underlinkedHighValueGuides: underlinkedHighValuePracticalGuides,
    contentFreshnessPersistence:
      guideUsefulnessTrend === "improving" ? "fresh" : "adequate",
    compareSupportAuthorityFreshness: compareSupportAuthorityQuality,
    weakPracticalContentFreshness:
      weakAuthorityConsistency === "weak" ? "stale" : "adequate",
    authorityUsefulnessStability:
      authorityUsefulnessDurability === "deepening" ||
      authorityUsefulnessDurability === "persistent"
        ? "stable"
        : "building",
    compareSupportAuthorityFreshness:
      compareSupportAuthorityQuality === "strong" ? "fresh" : "adequate",
    compareSupportFreshness:
      compareSupportAuthorityQuality === "strong" ? "fresh" : "adequate",
    generatedAt: new Date().toISOString(),
    exportMeta: {
      reportType: "seo-authority",
      version: 4,
      generatedAt: new Date().toISOString(),
      reviewOwner: "seo-editorial",
    },
  };
}
