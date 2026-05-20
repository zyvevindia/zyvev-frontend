/**
 * SEO opportunity queue — merges indexing discipline + traction heuristics (no GSC API).
 */

import {
  pickDiscoveryLandingsWithTraffic,
  rankWeakEngagementByTrafficClass,
} from "./seoTractionOps.js";

/**
 * @param {object} discipline from analyzeSeoIndexingDiscipline
 * @param {object} traction {{ topLandingPages?, topConvertingPages? }}
 */
export function buildSeoOpportunityQueue(discipline = null, traction = {}) {
  const rows = [];
  if (discipline?.orphanDiscoveryPaths?.length) {
    for (const p of discipline.orphanDiscoveryPaths.slice(0, 12)) {
      rows.push({
        key: `orphan:${p}`,
        path: p,
        kind: "orphan_registry_not_in_sitemap",
        severity: "high",
        suggestion:
          "Registry vs sitemap drift — reconcile discovery-index and sitemap generator, then redeploy.",
      });
    }
  }
  if (discipline?.sitemapOnlyDiscoveryPaths?.length) {
    for (const p of discipline.sitemapOnlyDiscoveryPaths.slice(0, 8)) {
      rows.push({
        key: `sitemap-only:${p}`,
        path: p,
        kind: "sitemap_only_not_in_registry",
        severity: "medium",
        suggestion:
          "Sitemap lists URL not in discovery-index — refresh content batch or remove stale sitemap row.",
      });
    }
  }

  const weak = rankWeakEngagementByTrafficClass(
    traction.topLandingPages || [],
    traction.topConvertingPages || [],
    { minViews: 8 }
  );
  for (const w of weak.slice(0, 10)) {
    rows.push({
      key: `weak-engage:${w.label}`,
      path: w.label,
      kind: "high_traffic_low_lead_match",
      trafficClass: w.trafficClass,
      views: w.count,
      severity: w.trafficClass === "discovery" ? "high" : "medium",
      suggestion:
        "Improve internal links + CTA clarity; confirm trust copy matches intent for this template.",
    });
  }

  const discoveryHot = pickDiscoveryLandingsWithTraffic(traction.topLandingPages || [], 4);
  for (const d of discoveryHot.slice(0, 5)) {
    rows.push({
      key: `discovery-traffic:${d.label}`,
      path: d.label,
      kind: "discovery_with_traffic",
      views: d.count,
      severity: "low",
      suggestion: "Monitor CTR in GSC when available; tighten H1 + intro for clarity.",
    });
  }

  return rows.slice(0, 28);
}

export function summarizeSeoOpportunityQueue(rows = []) {
  return {
    total: rows.length,
    high: rows.filter((r) => r.severity === "high").length,
    medium: rows.filter((r) => r.severity === "medium").length,
  };
}
