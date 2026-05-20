/**
 * Catalog expansion signals — reuses audit issue codes (deterministic).
 */

import { AUDIT_ISSUE } from "../intelligence/catalogAudit.js";
import { aggregateModelFamilies } from "../utils/modelFamily.js";

/**
 * @param {object[]} normalizedCars
 * @param {object} [liveOps]
 */
export function buildCatalogExpansionReport(normalizedCars = [], liveOps = {}) {
  const cars = normalizedCars || [];
  const families = aggregateModelFamilies(cars);

  const singleVariantFamilies = families.filter(
    (f) => Array.isArray(f.variants) && f.variants.length === 1
  );

  const multiVariantNames = families.filter(
    (f) => Array.isArray(f.variants) && f.variants.length > 1
  );

  return {
    catalogSize: cars.length,
    familyCount: families.length,
    singleVariantFamilyCount: singleVariantFamilies.length,
    /** Families with only one variant — worth checking OEM line-ups (not auto-wrong). */
    singleVariantSample: singleVariantFamilies.slice(0, 10).map((f) => ({
      familySlug: f.familySlug,
      familyName: f.familyName,
      brand: f.brand,
    })),
    multiVariantCount: multiVariantNames.length,
    missingEvFeedbackHint:
      "Use issue category “Missing EV” in user reports to queue real demand signals.",
    issueCodesWatched: [
      AUDIT_ISSUE.MISSING_CHARGING,
      AUDIT_ISSUE.MISSING_OWNERSHIP,
      AUDIT_ISSUE.PARTIAL_BUNDLE,
      AUDIT_ISSUE.UNREVIEWED,
      AUDIT_ISSUE.STALE_TRUST,
      AUDIT_ISSUE.COMPARE_RISK,
    ],
    topViewedSlugs: (liveOps.topViewed || liveOps.topCars || [])
      .map((r) => r.slug || r.familySlug)
      .filter(Boolean)
      .slice(0, 20),
  };
}
