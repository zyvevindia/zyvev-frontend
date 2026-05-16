/**
 * Maps legacy /cars/{guide-slug} content slugs → canonical discovery paths.
 * Single source of truth for guide canonicalization.
 */

const DEFAULT_ORIGIN = "https://evsavari.com";

function absoluteUrl(path, siteOrigin = DEFAULT_ORIGIN) {
  const normalized = String(path || "/").startsWith("/")
    ? path
    : `/${path}`;
  return `${String(siteOrigin).replace(/\/$/, "")}${normalized}`;
}

/**
 * Content slug (seo-data file key) → canonical discovery path (no origin).
 */
export const GUIDE_CONTENT_SLUG_TO_CANONICAL_PATH = Object.freeze({
  "best-evs-under-10-lakh": "/best-evs/under-10-lakh",
  "best-evs-under-20-lakh": "/best-evs/under-20-lakh",
  "best-evs-for-city-driving": "/best-evs/city-driving",
  "best-family-electric-cars": "/best-evs/family",
  "best-evs-for-office-commute": "/best-evs/office-commute",
  "best-evs-for-highway-driving": "/best-evs/highway-driving",
  "best-city-electric-cars-india": "/best-evs/city-cars-india",
  "best-evs-for-daily-commute": "/charging-guides/daily-commute",
  "best-evs-for-home-charging": "/charging-guides/home-charging",
  "lowest-charging-stress-evs": "/charging-guides/low-stress",
  "lowest-maintenance-electric-cars": "/ownership-guides/low-maintenance",
  "best-evs-for-first-time-buyers": "/ownership-guides/first-time-buyers",
  "easiest-evs-for-first-time-buyers": "/ownership-guides/easiest-first-ev",
  "best-evs-for-apartment-living": "/ownership-guides/apartment-living",
  "best-evs-for-apartment-parking": "/ownership-guides/apartment-parking",
  "nexon-ev-vs-mg-zs-ev": "/compare/nexon-ev-vs-mg-zs-ev",
  "comet-ev-vs-tiago-ev": "/compare/comet-ev-vs-tiago-ev",
});

/**
 * Canonical URL for a guide by content slug (discovery path preferred).
 */
export function resolveGuideCanonicalUrl(
  contentSlug,
  siteOrigin
) {
  const path = resolveGuideCanonicalPath(contentSlug);
  return absoluteUrl(path, siteOrigin);
}

/**
 * Canonical path only (no duplicate query params).
 */
export function resolveGuideCanonicalPath(contentSlug) {
  const slug = String(contentSlug || "").trim().toLowerCase();
  return (
    GUIDE_CONTENT_SLUG_TO_CANONICAL_PATH[slug] ||
    `/cars/${slug}`
  );
}

/**
 * Legacy path for a guide (still routable, not sitemap-canonical).
 */
export function legacyGuidePath(contentSlug) {
  return `/cars/${String(contentSlug || "").trim().toLowerCase()}`;
}

/**
 * Whether legacy /cars/{slug} should noindex (canonical elsewhere).
 */
export function isLegacyGuideSuperseded(contentSlug) {
  const slug = String(contentSlug || "").trim().toLowerCase();
  return Boolean(GUIDE_CONTENT_SLUG_TO_CANONICAL_PATH[slug]);
}

/**
 * Fallback when slug only known from legacy URL shape.
 */
export function resolveGuideCanonicalFromLegacySlug(
  legacySlug,
  siteOrigin = DEFAULT_ORIGIN
) {
  return resolveGuideCanonicalUrl(legacySlug, siteOrigin);
}
