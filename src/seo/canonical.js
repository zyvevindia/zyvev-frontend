/**
 * Unified canonical URL builders for all discovery page types.
 */

import { SITE_ORIGIN } from "../config";

import { canonicalVehicleUrl } from "../utils/vehicleRoutes";

import { canonicalSeoPageUrl } from "../utils/seoRoutes";

export { SITE_ORIGIN };

export function absoluteUrl(path, siteOrigin = SITE_ORIGIN) {
  const normalized = String(path || "/").startsWith("/")
    ? path
    : `/${path}`;
  return `${siteOrigin}${normalized}`;
}

export function canonicalLegacyGuideUrl(slug, siteOrigin = SITE_ORIGIN) {
  return canonicalSeoPageUrl(slug, siteOrigin);
}

export function canonicalBestEvsUrl(useCase, siteOrigin = SITE_ORIGIN) {
  const segment = String(useCase || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-");
  return absoluteUrl(`/best-evs/${segment}`, siteOrigin);
}

export function canonicalCompareGuideUrl(compareSlug, siteOrigin = SITE_ORIGIN) {
  const segment = String(compareSlug || "")
    .trim()
    .toLowerCase();
  return absoluteUrl(`/compare/${segment}`, siteOrigin);
}

export function canonicalChargingGuideUrl(slug, siteOrigin = SITE_ORIGIN) {
  const segment = String(slug || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-");
  return absoluteUrl(`/charging-guides/${segment}`, siteOrigin);
}

export function canonicalOwnershipGuideUrl(slug, siteOrigin = SITE_ORIGIN) {
  const segment = String(slug || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-");
  return absoluteUrl(`/ownership-guides/${segment}`, siteOrigin);
}

export function canonicalBrandUrl(brand, siteOrigin = SITE_ORIGIN) {
  const segment = String(brand || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-");
  return absoluteUrl(`/brands/${segment}`, siteOrigin);
}

export function canonicalCityEvsUrl(city, siteOrigin = SITE_ORIGIN) {
  const segment = String(city || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-");
  return absoluteUrl(`/cities/${segment}/evs`, siteOrigin);
}

export function canonicalCityChargingUrl(city, siteOrigin = SITE_ORIGIN) {
  const segment = String(city || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-");
  return absoluteUrl(`/cities/${segment}/charging`, siteOrigin);
}

export function canonicalGuidesHubUrl(siteOrigin = SITE_ORIGIN) {
  return absoluteUrl("/guides", siteOrigin);
}

export function canonicalCompareHubUrl(siteOrigin = SITE_ORIGIN) {
  return absoluteUrl("/compare", siteOrigin);
}

export function canonicalListingUrl(path = "/cars", siteOrigin = SITE_ORIGIN) {
  return absoluteUrl(path, siteOrigin);
}

export const CANONICAL_BUILDERS = {
  legacy_guide: canonicalLegacyGuideUrl,
  best_evs: canonicalBestEvsUrl,
  compare_guide: canonicalCompareGuideUrl,
  charging_guide: canonicalChargingGuideUrl,
  ownership_guide: canonicalOwnershipGuideUrl,
  brand: canonicalBrandUrl,
  city_evs: canonicalCityEvsUrl,
  city_charging: canonicalCityChargingUrl,
  guides_hub: canonicalGuidesHubUrl,
  compare_hub: canonicalCompareHubUrl,
  vehicle: canonicalVehicleUrl,
};
