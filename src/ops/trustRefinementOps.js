/**
 * Trust refinement queue — cross high-traffic slugs with trust-related audit issues.
 */

import { AUDIT_ISSUE } from "../intelligence/catalogAudit.js";

const TRUST_CODES = new Set([
  AUDIT_ISSUE.WEAK_CONFIDENCE,
  AUDIT_ISSUE.STALE_TRUST,
  AUDIT_ISSUE.UNREVIEWED,
  AUDIT_ISSUE.PARTIAL_BUNDLE,
]);

/**
 * @param {object[]} auditVehicles from buildCatalogOpsSummary.vehicles
 * @param {object} liveOps
 */
export function buildTrustRefinementQueue(auditVehicles = [], liveOps = {}) {
  const top = liveOps.topViewed || liveOps.topCars || [];
  const topSet = new Set(
    top.map((r) => String(r.slug || r.familySlug || "").trim()).filter(Boolean)
  );

  const weak = (auditVehicles || []).filter((v) =>
    (v.issues || []).some((i) => TRUST_CODES.has(i.code))
  );

  const scored = weak.map((v) => {
    const onHotList = topSet.has(v.slug);
    const trustIssueCount = (v.issues || []).filter((i) =>
      TRUST_CODES.has(i.code)
    ).length;
    const topRow =
      top.find((r) => (r.slug || r.familySlug) === v.slug) || null;
    const views = topRow?.views ?? topRow?.count ?? 0;
    const score = trustIssueCount * 4 + (onHotList ? 20 : 0) + Number(views || 0) * 0.02;
    return {
      slug: v.slug,
      name: v.name,
      summary: v.summary,
      trustIssueCount,
      highTraffic: onHotList,
      approxViews: Number(views) || null,
      score,
    };
  });

  return scored.sort((a, b) => b.score - a.score).slice(0, 20);
}

/**
 * Aggregate trust-warning style summaries for ops text.
 */
export function summarizeTrustWarnings(auditVehicles = []) {
  const counts = {};
  for (const v of auditVehicles || []) {
    for (const i of v.issues || []) {
      if (TRUST_CODES.has(i.code)) {
        counts[i.code] = (counts[i.code] || 0) + 1;
      }
    }
  }
  return counts;
}
