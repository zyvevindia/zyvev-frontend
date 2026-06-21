/**
 * Vehicle review registry — editorial documents keyed by review slug and vehicle slug.
 *
 * Catalog data lives elsewhere; this registry holds opinion and ownership intelligence only.
 */

/** @type {import("./types.js").VehicleReview[]} */
const VEHICLE_REVIEWS = [];

/** @type {Map<string, import("./types.js").VehicleReview>} */
const byReviewSlug = new Map(
  VEHICLE_REVIEWS.map((review) => [review.slug, review]),
);

/** @type {Map<string, import("./types.js").VehicleReview>} */
const byVehicleSlug = new Map(
  VEHICLE_REVIEWS.map((review) => [review.vehicleSlug, review]),
);

/**
 * @param {string} slug - Review document slug
 * @returns {import("./types.js").VehicleReview | null}
 */
export function getVehicleReview(slug) {
  if (!slug) return null;
  return byReviewSlug.get(slug) ?? null;
}

/**
 * @param {string} vehicleSlug - Catalog vehicle slug
 * @returns {import("./types.js").VehicleReview | null}
 */
export function getReviewByVehicleSlug(vehicleSlug) {
  if (!vehicleSlug) return null;
  return byVehicleSlug.get(vehicleSlug) ?? null;
}

/**
 * @returns {import("./types.js").VehicleReview[]}
 */
export function listReviews() {
  return [...VEHICLE_REVIEWS];
}
