/**
 * Ownership & charging authority depth — quality clusters, no spam generation.
 */

import { ensureArray } from "../utils/compareArrayUtils.js";
import { INTELLIGENCE_DISCOVERY_PRESETS } from "../data/intelligenceDiscoveryPresets.js";
import { AUTHORITY_GUIDE_TARGETS } from "./seoAuthorityOps.js";
import { buildSeoAuthorityReport } from "./seoAuthorityOps.js";

/** Editorial authority topics (support systems only). */
export const AUTHORITY_DEPTH_TOPICS = Object.freeze([
  {
    id: "charging_reality",
    title: "EV charging reality guides",
    paths: [
      "/charging-guides/home-charging",
      "/charging-guides/low-stress",
      "/discover/fastest-charging",
    ],
    cluster: "charging",
  },
  {
    id: "ownership_cost",
    title: "EV ownership cost realism",
    paths: ["/ownership/running-cost", "/ownership/insurance-tco"],
    cluster: "ownership",
  },
  {
    id: "apartment_charging",
    title: "Apartment charging guidance",
    paths: ["/discover/apartment-living", "/charging-guides/home-charging"],
    cluster: "charging",
  },
  {
    id: "city_highway",
    title: "City vs highway EV suitability",
    paths: ["/discover/city-driving", "/discover/highway-evs"],
    cluster: "discovery",
  },
  {
    id: "battery_degradation",
    title: "EV battery degradation basics",
    paths: ["/ownership/battery-health", "/ownership/long-term-reliability"],
    cluster: "ownership",
  },
  {
    id: "running_cost",
    title: "EV running-cost explainers",
    paths: ["/ownership/running-cost", "/discover/under-15-lakh"],
    cluster: "ownership",
  },
]);

function pathInSitemap(path, ctx) {
  if (Object.values(INTELLIGENCE_DISCOVERY_PRESETS).some((p) => p.path === path)) {
    return true;
  }
  const orphans = ctx.seoDiscipline?.orphanDiscoveryPaths || [];
  return !orphans.includes(path);
}

function scoreTopicDepth(topic, ctx) {
  const pathsPresent = topic.paths.filter((p) => pathInSitemap(p, ctx)).length;
  const completeness = Math.round((pathsPresent / topic.paths.length) * 100);
  const compareLinks = (ctx.traffic?.topComparePages || []).length > 0 ? 15 : 0;
  const depthScore = Math.min(100, completeness + compareLinks);
  return {
    ...topic,
    pathsPresent,
    pathTotal: topic.paths.length,
    guideSupportCompleteness: completeness,
    authorityDepthScore: depthScore,
  };
}

/**
 * Per-family guide support from compare traffic + discovery presets.
 */
function buildFamilyGuideSupport(ctx) {
  const byFamily = {};
  const topCompare = ctx.traffic?.topComparePages || [];

  for (const { slug } of [
    { slug: "tata-nexon-ev" },
    { slug: "tata-punch-ev" },
    { slug: "tata-tiago-ev" },
    { slug: "mg-comet-ev" },
    { slug: "byd-atto-3" },
    { slug: "mahindra-xuv400" },
    { slug: "tata-curvv-ev" },
    { slug: "mg-windsor-ev" },
  ]) {
    const inCompare = topCompare.some((r) =>
      String(r.label || "").includes(slug)
    );
    byFamily[slug] = {
      guideSupportScore: inCompare ? 72 : 58,
      suggestedGuides: AUTHORITY_DEPTH_TOPICS.slice(0, 2).map((t) => t.id),
    };
  }
  return byFamily;
}

export function buildAuthorityDepthReport(ctx = {}) {
  const seo = buildSeoAuthorityReport(ctx);
  const topics = AUTHORITY_DEPTH_TOPICS.map((t) => scoreTopicDepth(t, ctx));
  const avgDepth =
    topics.length > 0
      ? Math.round(
          topics.reduce((s, t) => s + t.authorityDepthScore, 0) / topics.length
        )
      : 0;
  const avgCompleteness =
    topics.length > 0
      ? Math.round(
          topics.reduce((s, t) => s + t.guideSupportCompleteness, 0) /
            topics.length
        )
      : 0;

  const compareGuideLinks = [
    ...(ensureArray(seo.compareToGuideLinks) || []),
    ...topics.flatMap((t) =>
      (ctx.traffic?.topComparePages || [])
        .slice(0, 2)
        .map((cmp) => ({
          from: `/compare/${cmp.label}`,
          to: t.paths[0],
          topic: t.id,
          reason: `Authority depth: ${t.title}`,
        }))
    ),
  ].slice(0, 12);

  return {
    topics,
    avgAuthorityDepthScore: avgDepth,
    avgGuideSupportCompleteness: avgCompleteness,
    compareGuideLinks,
    authorityGuideTargets: AUTHORITY_GUIDE_TARGETS,
    topicalAuthorityScore: seo.topicalAuthorityScore,
    byFamily: buildFamilyGuideSupport(ctx),
    maturityLevel:
      avgDepth >= 80 ? "mature" : avgDepth >= 65 ? "developing" : "early",
    generatedAt: new Date().toISOString(),
  };
}
