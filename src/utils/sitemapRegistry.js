/**
 * Client-side sitemap registry — mirrors build:sitemaps output for dev tooling.
 */

import { SITE_ORIGIN } from "../config";
import { buildFullSitemapManifest } from "../seo/sitemap";

export function buildClientSitemapEntries() {
  const manifest = buildFullSitemapManifest(SITE_ORIGIN);
  const entries = [
    ...manifest.static,
    ...manifest.vehicles,
    ...manifest.discovery,
  ].map((e) => ({
    loc: e.loc,
    path: e.path,
    priority: e.priority,
  }));

  return {
    generatedAt: manifest.generatedAt,
    count: manifest.counts.total,
    entries,
    legacyGuideUrlsExcluded: true,
  };
}

export function listSeoPathsForSitemap() {
  return buildFullSitemapManifest(SITE_ORIGIN).discovery.map((e) => e.path);
}
