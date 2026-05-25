/**
 * Listing route modes — separates browse catalog from recommendation/compare discovery.
 */

/** URL segments that render browse hubs (no category field filter, no recommendation widget). */
export const BROWSE_ONLY_LISTING_SEGMENTS = Object.freeze([
  "popular",
  "latest",
  "upcoming",
]);

/**
 * @param {string} pathname
 * @param {string} [categoryParam] — from route :category
 * @returns {string | null}
 */
export function resolveListingSegment(pathname, categoryParam) {
  if (categoryParam) return String(categoryParam).toLowerCase();
  const segment = String(pathname || "")
    .replace(/^\//, "")
    .split("/")[0]
    .toLowerCase();
  if (
    ["bikes", "scooters", "popular", "latest", "upcoming", "cars"].includes(
      segment
    )
  ) {
    return segment === "cars" ? null : segment;
  }
  return null;
}

/**
 * @param {string | null} segment
 */
export function isBrowseOnlyListingSegment(segment) {
  return (
    segment != null &&
    BROWSE_ONLY_LISTING_SEGMENTS.includes(String(segment).toLowerCase())
  );
}

/**
 * Category segments like bikes/latest filter on family.category; browse-only does not.
 * @param {string | null} segment
 */
export function shouldFilterFamiliesByListingSegment(segment) {
  if (!segment) return false;
  return !isBrowseOnlyListingSegment(segment);
}

/**
 * Recommendation widget only on open catalog discovery (/cars), not hub segments.
 * @param {{ segment: string | null, compareMode: boolean, hasFamilies: boolean }} opts
 */
export function shouldShowListingRecommendationWidget({
  segment,
  compareMode,
  hasFamilies,
}) {
  if (compareMode || !hasFamilies) return false;
  if (segment) return false;
  return true;
}

/**
 * Compare discovery allowed on /cars and browse-only hubs (e.g. /popular).
 * @param {string | null} segment
 * @param {boolean} compareModeRequested
 */
export function resolveListingCompareMode(segment, compareModeRequested) {
  if (!compareModeRequested) return false;
  if (!segment) return true;
  return isBrowseOnlyListingSegment(segment);
}

/**
 * @param {object} variant
 */
export function isUpcomingCatalogVariant(variant) {
  if (!variant) return false;
  const status = String(
    variant.status || variant.catalogMeta?.status || ""
  ).toLowerCase();
  const availability = String(
    variant.availability || variant.catalogMeta?.availability || ""
  ).toLowerCase();
  return (
    status === "upcoming" ||
    availability.includes("upcoming") ||
    availability.includes("pre-launch")
  );
}

/**
 * @param {object} family
 */
export function isUpcomingFamily(family) {
  if (!family) return false;
  const variants = family.variants || [];
  if (variants.some(isUpcomingCatalogVariant)) return true;
  return isUpcomingCatalogVariant(family.defaultVariant);
}

/**
 * Browse hub dataset shaping (after search/brand/intelligence filters).
 * @param {object[]} families
 * @param {string | null} segment
 * @returns {object[]}
 */
export function applyBrowseSegmentFamilies(families, segment) {
  const list = [...(families || [])];
  if (!segment || !isBrowseOnlyListingSegment(segment)) {
    return list;
  }

  const key = String(segment).toLowerCase();

  if (key === "latest") {
    list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    return list;
  }

  if (key === "upcoming") {
    return list.filter(isUpcomingFamily);
  }

  if (key === "popular") {
    list.sort((a, b) => {
      const featuredDelta =
        (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
      if (featuredDelta !== 0) return featuredDelta;
      return (b.createdAt || 0) - (a.createdAt || 0);
    });
    return list;
  }

  return list;
}
