/**
 * Read-only registry accessors for the Link Graph Engine.
 * Never duplicates catalog, landing, or guide data — reads existing sources.
 */

import { BRAND_LANDING_DEFINITIONS } from "../landing/config/brandLandingDefinitions.js";
import { PRICE_LANDING_DEFINITIONS } from "../landing/config/priceLandingDefinitions.js";
import { USE_CASE_LANDING_DEFINITIONS } from "../landing/config/useCaseLandingDefinitions.js";
import { GENERATED_COMPARE_SLUGS, GENERATED_CITY_SLUGS } from "../content/generated/manifest.js";
import { BEGINNER_EV_TOPICS } from "../content/authority/beginnerTopics.js";
import { CHARGING_GUIDE_TOPICS } from "../content/authority/chargingTopics.js";
import { OWNERSHIP_EXPLAINER_TOPICS } from "../content/authority/ownershipGuidance.js";
import {
  CATALOG_PRICE_RANGES,
  matchesCatalogPriceRange,
} from "../intelligence/catalogPriceFilters.js";

export function getRegisteredBrandLandings() {
  return BRAND_LANDING_DEFINITIONS;
}

export function getRegisteredPriceLandings() {
  return PRICE_LANDING_DEFINITIONS;
}

export function getRegisteredUseCaseLandings() {
  return USE_CASE_LANDING_DEFINITIONS;
}

export function getCompareGuideSlugs() {
  return GENERATED_COMPARE_SLUGS;
}

function publishedGuideTopics(topics) {
  return topics.filter((t) => t.canonicalPath && t.readiness === "published");
}

export function getBuyingGuideTopics() {
  return publishedGuideTopics(BEGINNER_EV_TOPICS);
}

export function getOwnershipGuideTopics() {
  return publishedGuideTopics(OWNERSHIP_EXPLAINER_TOPICS);
}

export function getChargingGuideTopics() {
  return publishedGuideTopics(CHARGING_GUIDE_TOPICS);
}

/**
 * @param {string} brandName
 */
export function brandNameToSlug(brandName) {
  return String(brandName || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-");
}

/**
 * Resolve registered price landing slugs relevant to a catalog price.
 * @param {number} priceInr
 * @returns {string[]}
 */
export function resolvePriceLandingSlugsForPrice(priceInr) {
  const price = Number(priceInr) || 0;
  if (price <= 0) {
    return getRegisteredPriceLandings().map((d) => d.slug);
  }

  const slugs = [];
  for (const def of getRegisteredPriceLandings()) {
    const rangeId = def.filters?.priceRange;
    if (rangeId && matchesCatalogPriceRange(price, rangeId)) {
      slugs.push(def.slug);
      continue;
    }
    const intelIds = def.filters?.intelligenceFilterIds || [];
    if (intelIds.includes("price_under_10") && price <= 999_999) slugs.push(def.slug);
    else if (intelIds.includes("price_under_15") && price <= 1_500_000) slugs.push(def.slug);
    else if (intelIds.includes("price_under_20") && price <= 2_000_000) slugs.push(def.slug);
  }

  if (matchesCatalogPriceRange(price, "above_30")) {
    slugs.push("premium");
  }

  return [...new Set(slugs)];
}

export function getCitySlugs() {
  return GENERATED_CITY_SLUGS;
}

const CITY_DISPLAY = {
  bengaluru: "Bengaluru",
  mumbai: "Mumbai",
  delhi: "Delhi NCR",
  hyderabad: "Hyderabad",
  chennai: "Chennai",
  pune: "Pune",
};

export function citySlugToLabel(slug) {
  return CITY_DISPLAY[slug] || String(slug || "").replace(/-/g, " ");
}
