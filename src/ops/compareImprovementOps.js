/**
 * Compare improvement queue — high-intent pairs, abandonment, missing guides (deterministic).
 */

import { rankMissingCompareGuidesForPopularPairs } from "./compareGuideCoverageOps.js";
import { rankCompareDropOffHotspots } from "./trafficObservationOps.js";

/**
 * @param {{
 *   compareTrends?: object[],
 *   topCompares?: object[],
 * }} opts
 */
export function buildCompareImprovementQueue(opts = {}) {
  const trends = opts.compareTrends || [];
  const hotspots = rankCompareDropOffHotspots(trends, {});
  const hotspotSlugs = new Set(hotspots.map((h) => String(h.slug || "").trim()).filter(Boolean));

  const missing = rankMissingCompareGuidesForPopularPairs(opts.topCompares || []);

  const rows = [];

  for (const h of hotspots) {
    const slug = String(h.slug || "").trim();
    if (!slug) continue;
    rows.push({
      key: `abandon:${slug}`,
      pairSlug: slug,
      signals: {
        started: Number(h.started ?? 0),
        completionRate: Number(h.completionRate ?? 0),
      },
      issues: ["high_abandonment"],
      suggestion:
        "Review compare UX + spec parity for this pair; check trust rows load on mobile.",
    });
  }

  for (const m of missing) {
    const key = `missing-guide:${m.pairSlug}`;
    if (rows.some((r) => r.pairSlug === m.pairSlug)) continue;
    rows.push({
      key,
      pairSlug: m.pairSlug,
      slugs: m.slugs,
      signals: { intentSignal: m.intentSignal },
      issues: ["missing_compare_guide"],
      suggestion: m.suggestion,
    });
  }

  /** Pairs with traffic but no hotspot row — weak completion heuristic */
  for (const t of trends) {
    const slug = String(t.slug || "").trim();
    if (!slug || hotspotSlugs.has(slug)) continue;
    const cr = Number(t.completionRate);
    const started = Number(t.started ?? 0);
    if (started >= 6 && !Number.isNaN(cr) && cr < 55) {
      rows.push({
        key: `weak-completion:${slug}`,
        pairSlug: slug,
        signals: { started, completionRate: cr },
        issues: ["weak_compare_completion"],
        suggestion:
          "Tune compare onboarding / empty states; verify both vehicles have charging + range blocks.",
      });
    }
  }

  return rows.slice(0, 20);
}

/**
 * Short summary lines for ops dashboards.
 */
export function summarizeCompareImprovement(rows = []) {
  const abandon = rows.filter((r) => r.issues.includes("high_abandonment")).length;
  const guides = rows.filter((r) => r.issues.includes("missing_compare_guide")).length;
  return {
    total: rows.length,
    highAbandonment: abandon,
    missingGuides: guides,
  };
}
