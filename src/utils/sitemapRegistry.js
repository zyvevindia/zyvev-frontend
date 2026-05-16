/**
 * Client-side sitemap registry preparation — not deployed to public/sitemap.xml yet.
 */

import { SEO_PAGE_SLUGS } from "../data/seoPageSlugs";

import { SITE_ORIGIN } from "../config";

import { canonicalSeoPageUrl, seoPagePath } from "./seoRoutes";

import { canonicalVehicleUrl } from "./vehicleRoutes";

const STATIC_PATHS = [
  "/",
  "/cars",
  "/compare",
  "/about",
  "/contact",
  "/privacy",
];

/**
 * @param {string[]} vehicleSlugs — from API or build manifest
 */
export function buildClientSitemapEntries(vehicleSlugs = []) {
  const entries = [];
  const origin = SITE_ORIGIN;

  for (const path of STATIC_PATHS) {
    entries.push({
      loc: `${origin}${path}`,
      type: "static",
      priority: path === "/" ? 1 : 0.7,
    });
  }

  for (const slug of vehicleSlugs) {
    entries.push({
      loc: canonicalVehicleUrl(slug, origin),
      type: "vehicle_detail",
      priority: 0.8,
    });
  }

  for (const slug of SEO_PAGE_SLUGS) {
    entries.push({
      loc: canonicalSeoPageUrl(slug, origin),
      type: "seo_decision_page",
      priority: 0.75,
    });
  }

  return {
    generatedAt: new Date().toISOString(),
    count: entries.length,
    entries,
    deployNote:
      "Wire to build step → public/sitemap.xml when ready for production crawl.",
  };
}

export function listSeoPathsForSitemap() {
  return SEO_PAGE_SLUGS.map((slug) => seoPagePath(slug));
}
