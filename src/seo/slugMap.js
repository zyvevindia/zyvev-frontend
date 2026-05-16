/**
 * Maps new discovery URL segments → existing content slugs in /seo-data/.
 */

/** /best-evs/:useCase */
export const BEST_EVS_USE_CASE_TO_SLUG = {
  "under-10-lakh": "best-evs-under-10-lakh",
  "under-20-lakh": "best-evs-under-20-lakh",
  "city-driving": "best-evs-for-city-driving",
  "family": "best-family-electric-cars",
  "office-commute": "best-evs-for-office-commute",
  "highway-driving": "best-evs-for-highway-driving",
  "daily-commute": "best-evs-for-daily-commute",
  "city-cars-india": "best-city-electric-cars-india",
};

/** /charging-guides/:slug */
export const CHARGING_GUIDE_TO_SLUG = {
  "home-charging": "best-evs-for-home-charging",
  "daily-commute": "best-evs-for-daily-commute",
  "low-stress": "lowest-charging-stress-evs",
  "apartment": "best-evs-for-apartment-living",
};

/** /ownership-guides/:slug */
export const OWNERSHIP_GUIDE_TO_SLUG = {
  "first-time-buyers": "best-evs-for-first-time-buyers",
  "easiest-first-ev": "easiest-evs-for-first-time-buyers",
  "apartment-living": "best-evs-for-apartment-living",
  "apartment-parking": "best-evs-for-apartment-parking",
  "low-maintenance": "lowest-maintenance-electric-cars",
};

/** /compare/:slug (dedicated SEO compare URLs) */
export const COMPARE_GUIDE_SLUGS = new Set([
  "nexon-ev-vs-mg-zs-ev",
  "comet-ev-vs-tiago-ev",
]);

export function normalizeSegment(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function resolveBestEvsContentSlug(useCase) {
  const key = normalizeSegment(useCase);
  return (
    BEST_EVS_USE_CASE_TO_SLUG[key] ||
    (key.startsWith("best-evs-") ? key : `best-evs-for-${key}`)
  );
}

export function resolveChargingGuideContentSlug(slug) {
  const key = normalizeSegment(slug);
  return (
    CHARGING_GUIDE_TO_SLUG[key] ||
    `best-evs-for-${key}`
  );
}

export function resolveOwnershipGuideContentSlug(slug) {
  const key = normalizeSegment(slug);
  return (
    OWNERSHIP_GUIDE_TO_SLUG[key] ||
    `best-evs-for-${key}`
  );
}

export function resolveCompareGuideContentSlug(compareSlug) {
  const key = normalizeSegment(compareSlug);
  if (COMPARE_GUIDE_SLUGS.has(key)) return key;
  if (key.includes("-vs-")) return key;
  return null;
}
