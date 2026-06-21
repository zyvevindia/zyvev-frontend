/**
 * Review page route helpers — slug resolution and canonical paths.
 */

export const REVIEW_SITE_ORIGIN_DEFAULT = "https://evsavari.com";

const REVIEW_SLUG_SUFFIX = "-review";

/**
 * @param {string} vehicleSlug
 * @returns {string}
 */
export function buildReviewSlug(vehicleSlug) {
  const normalized = String(vehicleSlug || "").trim().toLowerCase();
  if (!normalized) return "";
  if (normalized.endsWith(REVIEW_SLUG_SUFFIX)) return normalized;
  return `${normalized}${REVIEW_SLUG_SUFFIX}`;
}

/**
 * @param {string} reviewSlug
 * @returns {string}
 */
export function resolveVehicleSlugFromReviewSlug(reviewSlug) {
  const normalized = String(reviewSlug || "").trim().toLowerCase();
  if (!normalized) return "";
  if (normalized.endsWith(REVIEW_SLUG_SUFFIX)) {
    return normalized.slice(0, -REVIEW_SLUG_SUFFIX.length);
  }
  return normalized;
}

/**
 * @param {string} reviewSlug
 * @returns {string}
 */
export function reviewPagePath(reviewSlug) {
  const slug = String(reviewSlug || "").trim().toLowerCase();
  if (!slug) return "/reviews";
  return `/reviews/${slug}`;
}

/**
 * @param {string} vehicleSlug
 * @param {string} [siteOrigin]
 * @returns {string}
 */
export function canonicalReviewUrl(
  vehicleSlug,
  siteOrigin = REVIEW_SITE_ORIGIN_DEFAULT
) {
  const path = reviewPagePath(buildReviewSlug(vehicleSlug));
  return `${String(siteOrigin).replace(/\/$/, "")}${path}`;
}
