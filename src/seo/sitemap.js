/**
 * Sitemap entry generation — canonical discovery URLs only.
 */

import { TIER1_MODEL_FAMILY_SLUGS } from "../data/tier1ModelFamilies.js";

/** Default when not passed (Node build scripts, tests). */
export const DEFAULT_SITE_ORIGIN = "https://evsavari.com";
import { GUIDE_CONTENT_SLUG_TO_CANONICAL_PATH } from "./legacyCanonicalMap.js";

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

function entry(path, { priority = 0.75, changefreq = "weekly", siteOrigin = SITE_ORIGIN } = {}) {
  return {
    loc: absoluteUrl(path, siteOrigin),
    path,
    priority,
    changefreq,
  };
}

/**
 * All discovery guide URLs (canonical paths only — no legacy /cars/ guides).
 * @param {string} [siteOrigin]
 * @param {{ brands?: string[], cityRoutes?: Array<{ city: string, type: 'evs'|'charging' }> }} [extras]
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

export function buildStaticSitemapEntries(siteOrigin = DEFAULT_SITE_ORIGIN) {
  return [
    entry("/", { priority: 1, changefreq: "daily", siteOrigin }),
    entry("/cars", { priority: 0.9, changefreq: "daily", siteOrigin }),
    entry("/compare", { priority: 0.85, changefreq: "weekly", siteOrigin }),
    entry("/about", { priority: 0.6, changefreq: "monthly", siteOrigin }),
    entry("/contact", { priority: 0.6, changefreq: "monthly", siteOrigin }),
    entry("/privacy", { priority: 0.4, changefreq: "yearly", siteOrigin }),
    entry("/terms", { priority: 0.4, changefreq: "yearly", siteOrigin }),
  ];
}

/**
 * Vehicle family detail pages only — no variant slugs, no ?variant=.
 */
export function buildVehicleFamilySitemapEntries(siteOrigin = SITE_ORIGIN) {
  return TIER1_MODEL_FAMILY_SLUGS.map((familySlug) =>
    entry(`/cars/${familySlug}`, {
      priority: 0.8,
      changefreq: "weekly",
      siteOrigin,
    })
  );
}

export function buildCompareHubSitemapEntries(siteOrigin = DEFAULT_SITE_ORIGIN) {
  return [
    entry("/compare", { priority: 0.85, changefreq: "weekly", siteOrigin }),
  ];
}

export function buildFullSitemapManifest(
  siteOrigin = DEFAULT_SITE_ORIGIN,
  extras = {}
) {
  const staticEntries = buildStaticSitemapEntries(siteOrigin);
  const vehicleEntries = buildVehicleFamilySitemapEntries(siteOrigin);
  const discoveryEntries = buildDiscoveryGuideSitemapEntries(
    siteOrigin,
    extras
  );

  return {
    siteOrigin,
    generatedAt: new Date().toISOString(),
    static: staticEntries,
    vehicles: vehicleEntries,
    discovery: discoveryEntries,
    counts: {
      static: staticEntries.length,
      vehicles: vehicleEntries.length,
      discovery: discoveryEntries.length,
      total:
        staticEntries.length +
        vehicleEntries.length +
        discoveryEntries.length,
    },
    /** @deprecated legacy /cars/ guide URLs excluded */
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
  for (const brand of brands) {
    paths.add(`/brands/${brand}`);
  }
  for (const { city, type } of cityRoutes) {
    const suffix = type === "charging" ? "charging" : "evs";
    paths.add(`/cities/${city}/${suffix}`);
  }
  return [...paths];
}
