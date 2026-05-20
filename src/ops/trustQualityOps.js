/**
 * Trust quality / explanation refinement — ops-only hints (deterministic).
 */

import { AUDIT_ISSUE } from "../intelligence/catalogAudit.js";

const CLARITY_BY_CODE = {
  [AUDIT_ISSUE.WEAK_CONFIDENCE]:
    "Tighten confidence vs estimate wording on range/price; add one-line methodology pointer.",
  [AUDIT_ISSUE.STALE_TRUST]:
    "Refresh verification timestamps and stale banner copy after catalog change.",
  [AUDIT_ISSUE.UNREVIEWED]:
    "Schedule editorial review — unreviewed intelligence on a hot EV erodes trust.",
  [AUDIT_ISSUE.PARTIAL_BUNDLE]:
    "Partial intelligence bundle — verify catalog fields before expanding claims.",
  [AUDIT_ISSUE.MISSING_OWNERSHIP]:
    "Ownership assumptions invisible or thin — spell out tariff + km/year in one line.",
  [AUDIT_ISSUE.MISSING_CHARGING]:
    "Charging section weak — add AC/DC clarity and apartment vs landed note where applicable.",
};

/**
 * @param {object} auditVehicle from buildCatalogOpsSummary.vehicles
 */
export function buildTrustExplanationHints(auditVehicle) {
  const hints = [];
  for (const i of auditVehicle?.issues || []) {
    const msg = CLARITY_BY_CODE[i.code];
    if (msg) hints.push({ code: i.code, hint: msg });
  }
  return hints.slice(0, 5);
}

/**
 * @param {object[]} auditVehicles
 * @param {object} liveOps
 */
export function buildTrustQualityRefinementQueue(auditVehicles = [], liveOps = {}) {
  const top = liveOps.topViewed || liveOps.topCars || [];
  const hot = new Set(top.map((r) => String(r.slug || r.familySlug || "").trim()).filter(Boolean));

  const rows = (auditVehicles || [])
    .filter((v) => hot.has(v.slug))
    .map((v) => {
      const hints = buildTrustExplanationHints(v);
      if (!hints.length) return null;
      return {
        slug: v.slug,
        name: v.name,
        hints,
        score: hints.length * 10 + (v.issueCount || 0),
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)
    .slice(0, 16);

  return rows;
}
