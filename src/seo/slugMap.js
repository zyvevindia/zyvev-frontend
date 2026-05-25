/**
 * Maps new discovery URL segments → existing content slugs in /seo-data/.
 */

import {
  GENERATED_BEST_EVS_USE_CASE_TO_SLUG,
  GENERATED_OWNERSHIP_GUIDE_TO_SLUG,
  GENERATED_COMPARE_SLUGS,
} from "../content/generated/manifest.js";

/** /best-evs/:useCase */
const BASE_BEST_EVS_USE_CASE_TO_SLUG = {
  "under-10-lakh": "best-evs-under-10-lakh",
  "under-20-lakh": "best-evs-under-20-lakh",
  "city-driving": "best-evs-for-city-driving",
  "family": "best-family-electric-cars",
  "office-commute": "best-evs-for-office-commute",
  "highway-driving": "best-evs-for-highway-driving",
  "daily-commute": "best-evs-for-daily-commute",
  "city-cars-india": "best-city-electric-cars-india",
};

export const BEST_EVS_USE_CASE_TO_SLUG = {
  ...BASE_BEST_EVS_USE_CASE_TO_SLUG,
  ...GENERATED_BEST_EVS_USE_CASE_TO_SLUG,
};

/** /charging-guides/:slug */
export const CHARGING_GUIDE_TO_SLUG = {
  "home-charging": "best-evs-for-home-charging",
  "daily-commute": "best-evs-for-daily-commute",
  "low-stress": "lowest-charging-stress-evs",
  "apartment": "best-evs-for-apartment-living",
  "charging-types": "authority-ev-charging-types",
  "fast-vs-slow": "authority-fast-vs-slow",
  "public-charging": "authority-public-charging",
  "overnight-safety": "authority-overnight-safety",
  "extension-board-risks": "authority-extension-risks",
  "apartment-setup": "authority-apartment-setup",
};

/** /ownership-guides/:slug */
const BASE_OWNERSHIP_GUIDE_TO_SLUG = {
  "first-time-buyers": "authority-first-time-buyer",
  "easiest-first-ev": "easiest-evs-for-first-time-buyers",
  "apartment-living": "best-evs-for-apartment-living",
  "apartment-parking": "best-evs-for-apartment-parking",
  "low-maintenance": "lowest-maintenance-electric-cars",
  "how-evs-work": "authority-how-evs-work",
  "maintenance-basics": "authority-ev-maintenance",
  "battery-lifespan": "authority-ev-battery-lifespan",
  "apartment-suitability": "authority-apartment-suitability",
  "city-commute": "authority-city-commute",
  "family-ownership": "authority-family-ownership",
  "ev-myths": "authority-ev-myths-hub",
  "myth-battery-dies-quickly": "authority-myth-battery-dies-quickly",
  "myth-rain-flood-safety": "authority-myth-rain-flood-safety",
  "myth-fire-risk": "authority-myth-fire-risk",
  "myth-highway-practicality": "authority-myth-highway-practicality",
  "myth-apartment-charging-impossible": "authority-myth-apartment-charging-impossible",
  "myth-maintenance-expensive": "authority-myth-maintenance-expensive",
  "myth-battery-replacement-cost": "authority-myth-battery-replacement-cost",
  "myth-resale-value-loss": "authority-myth-resale-value-loss",
};

export const OWNERSHIP_GUIDE_TO_SLUG = {
  ...BASE_OWNERSHIP_GUIDE_TO_SLUG,
  ...GENERATED_OWNERSHIP_GUIDE_TO_SLUG,
};

/** /compare/:slug (dedicated SEO compare URLs) */
export const COMPARE_GUIDE_SLUGS = new Set([
  "nexon-ev-vs-mg-zs-ev",
  "comet-ev-vs-tiago-ev",
  ...GENERATED_COMPARE_SLUGS,
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
  return OWNERSHIP_GUIDE_TO_SLUG[key] || `ownership-${key}`;
}

export function resolveCompareGuideContentSlug(compareSlug) {
  const key = normalizeSegment(compareSlug);
  if (COMPARE_GUIDE_SLUGS.has(key)) return key;
  if (key.includes("-vs-")) return key;
  return null;
}
