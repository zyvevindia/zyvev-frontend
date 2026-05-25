/**
 * Listing route modes — separates browse catalog from recommendation/compare discovery.
 */

/** URL segments that render full catalog browse (no category field filter, no recommendation widget). */
export const BROWSE_ONLY_LISTING_SEGMENTS = Object.freeze(["popular"]);

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
