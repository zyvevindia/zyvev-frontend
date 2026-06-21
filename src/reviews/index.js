/**
 * Editorial review layer — public API.
 *
 * Catalog = facts and specifications.
 * Reviews = editorial opinion and ownership intelligence.
 */

export {
  REVIEW_CONFIDENCE,
  REVIEW_CONFIDENCE_VERIFIED,
  REVIEW_CONFIDENCE_EDITORIAL,
  REVIEW_CONFIDENCE_ESTIMATED,
  REVIEW_LIMITS,
  REVIEW_SECTION_FORMAT,
} from "./constants.js";

export {
  getVehicleReview,
  getReviewByVehicleSlug,
  listReviews,
} from "./reviewRegistry.js";

export { buildReviewContext } from "./buildReviewContext.js";
export { buildVehicleReview } from "./buildVehicleReview.js";

export {
  buildReviewSlug,
  resolveVehicleSlugFromReviewSlug,
  reviewPagePath,
  canonicalReviewUrl,
} from "./reviewRoutes.js";
