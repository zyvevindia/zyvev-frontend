import { buildCatalogOpsSummary } from "./catalogAudit.js";
import { GENERATED_COMPARE_SLUGS } from "../content/generated/manifest.js";
import { ensureArray } from "../utils/compareArrayUtils.js";

/**
 * Content expansion ops — thin discovery/compare coverage signals.
 * @param {object[]} cars normalized catalog
 */
export function buildContentOpsSummary(cars = []) {
  const catalog = buildCatalogOpsSummary(cars);
  const slugs = new Set(
    (cars || [])
      .map((c) => c.slug || c.familySlug)
      .filter(Boolean)
  );

  const comparePairsAvailable = ensureArray(GENERATED_COMPARE_SLUGS).length;
  const familiesWithCompareGuide = [...slugs].filter((slug) =>
    GENERATED_COMPARE_SLUGS.some((pair) => pair.includes(slug))
  ).length;

  const thinProfiles = catalog.vehicles.filter(
    (v) =>
      v.issueCount >= 2 ||
      v.issues.some((i) =>
        ["missing_charging_intelligence", "missing_ownership_data", "partial_intelligence_bundle"].includes(
          i.code
        )
      )
  );

  const weakIntelligence = catalog.vehicles.filter((v) =>
    v.issues.some((i) =>
      ["weak_confidence", "unreviewed_intelligence", "stale_trust_metadata"].includes(
        i.code
      )
    )
  );

  return {
    ...catalog,
    contentOps: {
      totalFamilies: slugs.size,
      familiesWithCompareGuide,
      compareGuidesTotal: comparePairsAvailable,
      compareCoveragePct:
        slugs.size > 0
          ? Math.round((familiesWithCompareGuide / slugs.size) * 100)
          : 0,
      thinProfileCount: thinProfiles.length,
      weakIntelligenceCount: weakIntelligence.length,
      thinProfiles: thinProfiles.slice(0, 15).map((v) => ({
        slug: v.slug,
        name: v.name,
        summary: v.summary,
      })),
      discoveryGapNote:
        slugs.size < 12
          ? "Catalog may be too small for all discovery presets — verify /discover pages."
          : null,
    },
  };
}
