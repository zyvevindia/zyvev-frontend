/**
 * Review page SEO metadata — editorial vehicle reviews.
 */

import { SITE_ORIGIN } from "../config.js";
import { buildPageMeta } from "./meta.js";
import { canonicalReviewUrl } from "../reviews/reviewRoutes.js";

const REVIEW_META_DESCRIPTION =
  "Editorial review covering ownership cost, charging experience, highway capability, family suitability and final verdict.";

/**
 * @param {{
 *   vehicleName: string,
 *   vehicleSlug: string,
 *   image?: string,
 *   siteOrigin?: string,
 * }} params
 */
export function buildReviewPageMeta({
  vehicleName,
  vehicleSlug,
  image,
  siteOrigin = SITE_ORIGIN,
}) {
  const displayName = String(vehicleName || "Electric vehicle").trim();
  const title = `${displayName} Review`;

  return buildPageMeta({
    title,
    description: REVIEW_META_DESCRIPTION,
    canonical: canonicalReviewUrl(vehicleSlug, siteOrigin),
    image,
    ogType: "article",
    keywords: [
      displayName,
      "EV review",
      "electric car review India",
      "ownership cost",
      "charging experience",
    ].join(", "),
    h1: title,
  });
}

export { REVIEW_META_DESCRIPTION };
