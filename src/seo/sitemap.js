/**
 * Sitemap entry generation — canonical discovery URLs only.
 */

import { TIER1_MODEL_FAMILY_SLUGS } from "../data/tier1ModelFamilies.js";
import { INTELLIGENCE_DISCOVERY_PRESETS } from "../data/intelligenceDiscoveryPresets.js";
import { GENERATED_COMPARE_SLUGS } from "../content/generated/manifest.js";
import { buildReviewSlug } from "../reviews/reviewRoutes.js";

import { GUIDE_CONTENT_SLUG_TO_CANONICAL_PATH } from "./legacyCanonicalMap.js";

/** Default when not passed (Node build scripts, tests). */
export const DEFAULT_SITE_ORIGIN = "https://evsavari.com";

function absoluteUrl(path, siteOrigin) {
  const normalized = String(path || "/").startsWith("/")
    ? path
    : `/${path}`;
  return `${String(siteOrigin).replace(/\/$/, "")}${normalized}`;
}

function uniqueEntries(entries) {
  const seen = new Set();
  return entries.filter((entry) => {
    if (seen.has(entry.loc)) return false;
    seen.add(entry.loc);
    return true;
  });
}

function entry(
  path,
  {
    priority = 0.75,
    changefreq = "weekly",
    siteOrigin = DEFAULT_SITE_ORIGIN,
    lastmod,
  } = {}
) {
  return {
    loc: absoluteUrl(path, siteOrigin),
    path,
    priority,
    changefreq,
    ...(lastmod ? { lastmod } : {}),
  };
}

/**
 * All discovery guide URLs (canonical paths only — no legacy /cars/ guides).
 */
export function buildDiscoveryGuideSitemapEntries(
  siteOrigin = DEFAULT_SITE_ORIGIN,
  extras = {}
) {
  const { brands = [], cityRoutes = [] } = extras;
  const entries = [];

  entries.push(
    entry("/guides", { priority: 0.85, changefreq: "weekly", siteOrigin })
  );

  const canonicalPaths = new Set(
    Object.values(GUIDE_CONTENT_SLUG_TO_CANONICAL_PATH)
  );

  for (const path of canonicalPaths) {
    let priority = 0.8;
    if (path.startsWith("/compare/")) priority = 0.82;
    if (path.startsWith("/brands/") || path.startsWith("/cities/")) {
      priority = 0.78;
    }
    entries.push(entry(path, { priority, siteOrigin }));
  }

  for (const brand of brands) {
    entries.push(
      entry(`/brands/${brand}`, { priority: 0.78, siteOrigin })
    );
  }

  for (const { city, type } of cityRoutes) {
    const suffix = type === "charging" ? "charging" : "evs";
    entries.push(
      entry(`/cities/${city}/${suffix}`, { priority: 0.76, siteOrigin })
    );
  }

  return uniqueEntries(entries);
}

/**
 * Rule-ranked intelligence discovery pages — /discover/:preset
 */
export function buildIntelligenceDiscoverySitemapEntries(
  siteOrigin = DEFAULT_SITE_ORIGIN
) {
  return Object.values(INTELLIGENCE_DISCOVERY_PRESETS).map((preset) =>
    entry(preset.path, {
      priority: 0.81,
      changefreq: "weekly",
      siteOrigin,
    })
  );
}

export function buildStaticSitemapEntries(siteOrigin = DEFAULT_SITE_ORIGIN) {
  return [
    entry("/", { priority: 1, changefreq: "daily", siteOrigin }),
    entry("/cars", { priority: 0.9, changefreq: "daily", siteOrigin }),
    entry("/compare", { priority: 0.85, changefreq: "weekly", siteOrigin }),
    entry("/guides", { priority: 0.85, changefreq: "weekly", siteOrigin }),
    entry("/popular", { priority: 0.82, changefreq: "daily", siteOrigin }),
    entry("/latest", { priority: 0.8, changefreq: "daily", siteOrigin }),
    entry("/upcoming", { priority: 0.78, changefreq: "weekly", siteOrigin }),
    entry("/bikes", { priority: 0.75, changefreq: "weekly", siteOrigin }),
    entry("/scooters", { priority: 0.75, changefreq: "weekly", siteOrigin }),
    entry("/about", { priority: 0.6, changefreq: "monthly", siteOrigin }),
    entry("/contact", { priority: 0.6, changefreq: "monthly", siteOrigin }),
    entry("/privacy", { priority: 0.4, changefreq: "yearly", siteOrigin }),
    entry("/terms", { priority: 0.4, changefreq: "yearly", siteOrigin }),
  ];
}

/**
 * Vehicle family detail pages — /cars/:familySlug (no ?variant=).
 */
export function buildVehicleFamilySitemapEntries(
  siteOrigin = DEFAULT_SITE_ORIGIN
) {
  return TIER1_MODEL_FAMILY_SLUGS.map((familySlug) =>
    entry(`/cars/${familySlug}`, {
      priority: 0.8,
      changefreq: "weekly",
      siteOrigin,
    })
  );
}

/**
 * Editorial vehicle review pages — /reviews/:vehicleSlug-review
 */
export function buildReviewSitemapEntries(
  siteOrigin = DEFAULT_SITE_ORIGIN
) {
  return TIER1_MODEL_FAMILY_SLUGS.map((familySlug) =>
    entry(`/reviews/${buildReviewSlug(familySlug)}`, {
      priority: 0.77,
      changefreq: "weekly",
      siteOrigin,
    })
  );
}

/** Programmatic ownership page path segments (keep in sync with ownershipRoutes.js). */
const OWNERSHIP_SITEMAP_SEGMENTS = Object.freeze([
  "running-cost",
  "tco",
  "petrol-savings",
  "emi",
]);

/** Question-based ownership page path segments (keep in sync with ownershipQuestionRoutes.js). */
const OWNERSHIP_QUESTION_SITEMAP_SEGMENTS = Object.freeze([
  "how-much-does-it-cost-to-run",
  "ownership-cost",
  "how-much-can-you-save",
  "emi-calculator",
]);

/**
 * Programmatic ownership calculator pages — /ownership/:slug/:pageType
 */
export function buildOwnershipSitemapEntries(
  siteOrigin = DEFAULT_SITE_ORIGIN
) {
  const entries = [
    entry("/ownership", {
      priority: 0.8,
      changefreq: "weekly",
      siteOrigin,
    }),
    entry("/ownership/vehicles", {
      priority: 0.8,
      changefreq: "weekly",
      siteOrigin,
    }),
  ];

  for (const familySlug of TIER1_MODEL_FAMILY_SLUGS) {
    for (const segment of OWNERSHIP_SITEMAP_SEGMENTS) {
      entries.push(
        entry(`/ownership/${familySlug}/${segment}`, {
          priority: 0.74,
          changefreq: "weekly",
          siteOrigin,
        })
      );
    }

    for (const segment of OWNERSHIP_QUESTION_SITEMAP_SEGMENTS) {
      entries.push(
        entry(`/ownership/${familySlug}/${segment}`, {
          priority: 0.75,
          changefreq: "weekly",
          siteOrigin,
        })
      );
    }
  }

  return uniqueEntries(entries);
}

/**
 * Editorial compare guides — /compare/:slug
 */
export function buildCompareGuideSitemapEntries(
  siteOrigin = DEFAULT_SITE_ORIGIN,
  { lastmodByPath = {} } = {}
) {
  const entries = [
    entry("/compare", { priority: 0.85, changefreq: "weekly", siteOrigin }),
  ];

  for (const slug of GENERATED_COMPARE_SLUGS) {
    const path = `/compare/${slug}`;
    entries.push(
      entry(path, {
        priority: 0.82,
        changefreq: "weekly",
        siteOrigin,
        lastmod: lastmodByPath[path],
      })
    );
  }

  return uniqueEntries(entries);
}

export function buildCompareHubSitemapEntries(
  siteOrigin = DEFAULT_SITE_ORIGIN
) {
  return buildCompareGuideSitemapEntries(siteOrigin);
}

export function buildFullSitemapManifest(
  siteOrigin = DEFAULT_SITE_ORIGIN,
  extras = {}
) {
  const staticEntries = buildStaticSitemapEntries(siteOrigin);
  const vehicleEntries = buildVehicleFamilySitemapEntries(siteOrigin);
  const reviewEntries = buildReviewSitemapEntries(siteOrigin);
  const discoveryEntries = buildDiscoveryGuideSitemapEntries(
    siteOrigin,
    extras
  );
  const intelligenceDiscoveryEntries =
    buildIntelligenceDiscoverySitemapEntries(siteOrigin);
  const compareEntries = buildCompareGuideSitemapEntries(siteOrigin);

  const mergedDiscovery = uniqueEntries([
    ...discoveryEntries,
    ...intelligenceDiscoveryEntries,
  ]);

  return {
    siteOrigin,
    generatedAt: new Date().toISOString(),
    static: staticEntries,
    vehicles: vehicleEntries,
    reviews: reviewEntries,
    discovery: mergedDiscovery,
    compare: compareEntries,
    counts: {
      static: staticEntries.length,
      vehicles: vehicleEntries.length,
      reviews: reviewEntries.length,
      discovery: mergedDiscovery.length,
      compare: compareEntries.length,
      total:
        staticEntries.length +
        vehicleEntries.length +
        reviewEntries.length +
        mergedDiscovery.length +
        compareEntries.length,
    },
    legacyGuideUrlsExcluded: true,
  };
}

/** For QA: every routable discovery path we expect in sitemap */
export function listExpectedDiscoveryPaths(extras = {}) {
  const { brands = [], cityRoutes = [] } = extras;
  const paths = new Set(["/guides"]);
  for (const p of Object.values(GUIDE_CONTENT_SLUG_TO_CANONICAL_PATH)) {
    paths.add(p);
  }
  for (const slug of GENERATED_COMPARE_SLUGS) {
    paths.add(`/compare/${slug}`);
  }
  for (const brand of brands) {
    paths.add(`/brands/${brand}`);
  }
  for (const { city, type } of cityRoutes) {
    const suffix = type === "charging" ? "charging" : "evs";
    paths.add(`/cities/${city}/${suffix}`);
  }
  return [...paths];
}
