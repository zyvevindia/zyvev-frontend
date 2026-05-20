/**
 * Stale catalog rows that also appear in top-viewed API list.
 */

/**
 * @param {object[]} auditVehicles from buildCatalogOpsSummary
 * @param {object} liveOps
 */
export function findStaleHighTrafficFamilies(auditVehicles = [], liveOps = {}) {
  const top = liveOps.topViewed || liveOps.topCars || [];
  const topSlugs = new Set(
    top.map((r) => String(r.slug || r.familySlug || "").trim()).filter(Boolean)
  );

  const staleStates = new Set(["potentially_stale", "needs_review"]);

  return (auditVehicles || [])
    .filter((v) => topSlugs.has(v.slug))
    .filter((v) => {
      const st = String(v.freshness?.state || "").toLowerCase();
      return staleStates.has(st) || v.freshness?.isStale;
    })
    .map((v) => ({
      slug: v.slug,
      name: v.name,
      freshnessState: v.freshness?.state,
      summary: v.summary,
    }))
    .slice(0, 12);
}
