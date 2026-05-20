/**
 * Top-priority EV refinement queue — deterministic score from traffic × audit × freshness.
 */

import { FRESHNESS_STATE } from "../intelligence/freshnessMetadata.js";

const STALEISH = new Set([
  FRESHNESS_STATE.POTENTIALLY_STALE,
  FRESHNESS_STATE.NEEDS_REVIEW,
]);

/**
 * @param {object[]} auditVehicles from buildCatalogOpsSummary.vehicles
 * @param {object} liveOps
 * @param {number} [limit]
 */
export function buildTopPriorityEvQueue(auditVehicles = [], liveOps = {}, limit = 20) {
  const top = liveOps.topViewed || liveOps.topCars || [];
  const bySlug = new Map(
    (auditVehicles || []).map((v) => [String(v.slug || "").trim(), v])
  );

  const rows = top
    .map((row) => {
      const slug = String(row.slug || row.familySlug || "").trim();
      if (!slug) return null;
      const audit = bySlug.get(slug);
      const views = Number(row.views ?? row.count ?? 0) || 0;
      if (!views || !audit) return null;

      const issues = audit.issueCount || 0;
      const staleish = STALEISH.has(audit.freshness?.state) ? 1 : 0;
      const trustWeak = (audit.issues || []).some((i) =>
        ["weak_confidence", "stale_trust_metadata", "unreviewed_intelligence"].includes(i.code)
      )
        ? 1
        : 0;

      const codes = new Set((audit.issues || []).map((i) => i.code));
      const gapFlags = {
        weakCharging: codes.has("missing_charging_intelligence"),
        weakOwnership: codes.has("missing_ownership_data"),
        weakFeaturesFaq: codes.has("missing_feature_mapping"),
        compareRisk: codes.has("compare_incompatibility_risk"),
        incompleteTaxonomy: codes.has("incomplete_taxonomy_mapping"),
      };

      const score = views * (1 + issues * 1.2 + staleish * 8 + trustWeak * 5);
      const priorityTier = score >= 800 ? "P1" : score >= 350 ? "P2" : "P3";

      return {
        slug,
        name: row.name || audit.name,
        views,
        issueCount: issues,
        summary: audit.summary,
        freshnessState: audit.freshness?.state,
        score,
        priorityTier,
        gapFlags,
        suggestions: buildRefinementSuggestions(audit, gapFlags),
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return rows;
}

function buildRefinementSuggestions(audit, gapFlags = {}) {
  const out = [];
  const codes = new Set((audit.issues || []).map((i) => i.code));
  for (const i of audit.issues || []) {
    if (i.code === "missing_charging_intelligence") {
      out.push("Add or verify DC/AC charging fields in catalog.");
    } else if (i.code === "missing_ownership_data") {
      out.push("Enrich ownership / running-cost intelligence.");
    } else if (i.code === "weak_confidence") {
      out.push("Editorial pass on range/price confidence labels.");
    } else if (i.code === "stale_trust_metadata") {
      out.push("Refresh trust metadata after catalog verification.");
    } else if (i.code === "compare_incompatibility_risk") {
      out.push("Fix slug/variant mapping for compare safety.");
    } else if (i.code === "missing_feature_mapping") {
      out.push("Add FAQs + feature highlights for this high-traffic EV.");
    } else if (i.code === "incomplete_taxonomy_mapping") {
      out.push("Align range/price/battery with taxonomy bands.");
    }
  }
  if (gapFlags?.weakFeaturesFaq && !codes.has("missing_feature_mapping")) {
    out.push("Editorial: strengthen trust FAQ + recommendation rationale.");
  }
  return [...new Set(out)].slice(0, 6);
}
