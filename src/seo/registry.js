/**
 * Scalable SEO page type registry — route patterns, canonicals, content resolution.
 */

import {
  canonicalBestEvsUrl,
  canonicalBrandUrl,
  canonicalChargingGuideUrl,
  canonicalCityChargingUrl,
  canonicalCityEvsUrl,
  canonicalCompareGuideUrl,
  canonicalGuidesHubUrl,
  canonicalLegacyGuideUrl,
  canonicalOwnershipGuideUrl,
} from "./canonical";

import {
  BEST_EVS_USE_CASE_TO_SLUG,
  CHARGING_GUIDE_TO_SLUG,
  OWNERSHIP_GUIDE_TO_SLUG,
  resolveBestEvsContentSlug,
  resolveChargingGuideContentSlug,
  resolveCompareGuideContentSlug,
  resolveOwnershipGuideContentSlug,
  normalizeSegment,
} from "./slugMap";

import { SEO_PAGE_SLUGS } from "../data/seoPageSlugs";
import { CONTENT_REGISTRY_ENTRIES } from "../content/generated/manifest.js";
import {
  resolveGuideCanonicalPath,
  resolveGuideCanonicalUrl,
} from "./legacyCanonicalMap";

export const PAGE_TYPES = Object.freeze({
  LEGACY_GUIDE: "legacy_guide",
  BEST_EVS: "best_evs",
  COMPARE_GUIDE: "compare_guide",
  CHARGING_GUIDE: "charging_guide",
  OWNERSHIP_GUIDE: "ownership_guide",
  BRAND: "brand",
  CITY_EVS: "city_evs",
  CITY_CHARGING: "city_charging",
  GUIDES_HUB: "guides_hub",
});

/**
 * @typedef {object} DiscoveryRouteContext
 * @property {string} pageType
 * @property {string} contentSlug - slug for fetchSeoPage / static JSON
 * @property {string} canonicalUrl
 * @property {string} path
 * @property {object} params
 * @property {string} [staticDataPath] - optional nested json path
 */

/**
 * Resolve a discovery route into fetch + canonical context.
 * @returns {DiscoveryRouteContext | null}
 */
export function resolveDiscoveryRoute(pageType, params = {}) {
  switch (pageType) {
    case PAGE_TYPES.BEST_EVS: {
      const useCase = normalizeSegment(params.useCase);
      const contentSlug = resolveBestEvsContentSlug(useCase);
      return {
        pageType,
        contentSlug,
        canonicalUrl: canonicalBestEvsUrl(useCase),
        path: `/best-evs/${useCase}`,
        params: { useCase },
      };
    }

    case PAGE_TYPES.COMPARE_GUIDE: {
      const compareSlug = normalizeSegment(params.compareSlug);
      const contentSlug = resolveCompareGuideContentSlug(compareSlug);
      if (!contentSlug) return null;
      return {
        pageType,
        contentSlug,
        canonicalUrl: canonicalCompareGuideUrl(compareSlug),
        path: `/compare/${compareSlug}`,
        params: { compareSlug },
      };
    }

    case PAGE_TYPES.CHARGING_GUIDE: {
      const slug = normalizeSegment(params.slug);
      const contentSlug = resolveChargingGuideContentSlug(slug);
      return {
        pageType,
        contentSlug,
        canonicalUrl: canonicalChargingGuideUrl(slug),
        path: `/charging-guides/${slug}`,
        params: { slug },
      };
    }

    case PAGE_TYPES.OWNERSHIP_GUIDE: {
      const slug = normalizeSegment(params.slug);
      const contentSlug = resolveOwnershipGuideContentSlug(slug);
      return {
        pageType,
        contentSlug,
        canonicalUrl: canonicalOwnershipGuideUrl(slug),
        path: `/ownership-guides/${slug}`,
        params: { slug },
      };
    }

    case PAGE_TYPES.BRAND: {
      const brand = normalizeSegment(params.brand);
      return {
        pageType,
        contentSlug: `brand-${brand}`,
        canonicalUrl: canonicalBrandUrl(brand),
        path: `/brands/${brand}`,
        params: { brand },
        staticDataPath: `brands/${brand}`,
      };
    }

    case PAGE_TYPES.CITY_EVS: {
      const city = normalizeSegment(params.city);
      return {
        pageType,
        contentSlug: `city-${city}-evs`,
        canonicalUrl: canonicalCityEvsUrl(city),
        path: `/cities/${city}/evs`,
        params: { city },
        staticDataPath: `cities/${city}-evs`,
      };
    }

    case PAGE_TYPES.CITY_CHARGING: {
      const city = normalizeSegment(params.city);
      return {
        pageType,
        contentSlug: `city-${city}-charging`,
        canonicalUrl: canonicalCityChargingUrl(city),
        path: `/cities/${city}/charging`,
        params: { city },
        staticDataPath: `cities/${city}-charging`,
      };
    }

    default:
      return null;
  }
}

/** Canonical discovery manifest (sitemap + QA). No legacy /cars/ guide duplicates. */
export function buildRegistryManifest() {
  const entries = [];

  entries.push({
    id: "guides-hub",
    pageType: PAGE_TYPES.GUIDES_HUB,
    path: "/guides",
    contentSlug: "guides-hub",
    canonicalUrl: canonicalGuidesHubUrl(),
  });

  for (const slug of SEO_PAGE_SLUGS) {
    const path = resolveGuideCanonicalPath(slug);
    entries.push({
      id: `guide-${slug}`,
      pageType: path.startsWith("/compare/")
        ? PAGE_TYPES.COMPARE_GUIDE
        : path.startsWith("/best-evs/")
          ? PAGE_TYPES.BEST_EVS
          : path.startsWith("/charging-guides/")
            ? PAGE_TYPES.CHARGING_GUIDE
            : PAGE_TYPES.OWNERSHIP_GUIDE,
      path,
      contentSlug: slug,
      canonicalUrl: resolveGuideCanonicalUrl(slug),
      legacyPath: `/cars/${slug}`,
    });
  }

  const seen = new Set(entries.map((e) => e.path));
  for (const row of CONTENT_REGISTRY_ENTRIES) {
    if (seen.has(row.path)) continue;
    seen.add(row.path);
    entries.push({
      id: row.id,
      pageType: row.pageType,
      path: row.path,
      contentSlug: row.contentSlug,
      canonicalUrl: row.canonicalUrl,
    });
  }

  return entries;
}
