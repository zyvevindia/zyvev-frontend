/**
 * Review page route helpers — slug resolution and canonical paths.
 */

import { TIER1_MODEL_FAMILY_SLUGS } from "../data/tier1ModelFamilies.js";

export const REVIEW_SITE_ORIGIN_DEFAULT = "https://evsavari.com";

const REVIEW_SLUG_SUFFIX = "-review";

/**
 * @param {string|null|undefined} slug
 * @returns {string}
 */
function normalizeReviewSlug(slug) {
  if (slug == null || slug === "") return "";
  return String(slug)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

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

/**
 * Editorial reviews are published for tier-1 model families.
 * @param {string} vehicleSlug
 * @returns {boolean}
 */
export function isEditorialReviewAvailable(vehicleSlug) {
  const slug = normalizeReviewSlug(vehicleSlug);
  if (!slug) return false;

  if (TIER1_MODEL_FAMILY_SLUGS.includes(slug)) {
    return true;
  }

  return TIER1_MODEL_FAMILY_SLUGS.some((family) => slug.startsWith(`${family}-`));
}
