/**
 * Deterministic SEO / indexing discipline signals from shipped manifests.
 * No GSC API — human-readable deltas for admin observability.
 */

import { normalizePathname } from "../seo/slugs.js";
import { INTELLIGENCE_DISCOVERY_PRESETS } from "../data/intelligenceDiscoveryPresets.js";

function pathSet(rows, key = "path") {
  const set = new Set();
  for (const row of rows || []) {
    const p = normalizePathname(row[key] || row.canonicalPath || "");
    if (p && p !== "/") set.add(p);
  }
  return set;
}

/**
 * @param {object} params
 * @param {object} [params.contentManifest]
 * @param {object} [params.sitemapManifest]
 * @param {object} [params.discoveryIndex]
 */
export function analyzeSeoIndexingDiscipline({
  contentManifest = {},
  sitemapManifest = {},
  discoveryIndex = {},
} = {}) {
  const sitemapDiscovery = pathSet(sitemapManifest.discovery || []);
  const discoveryPages = discoveryIndex.pages || [];
  const indexPaths = new Set();
  for (const row of discoveryPages) {
    const p = normalizePathname(row.canonicalPath || row.path || "");
    if (p && p !== "/") indexPaths.add(p);
  }

  /** Discovery registry paths missing from sitemap discovery section */
  const orphanDiscoveryPaths = [...indexPaths].filter((p) => !sitemapDiscovery.has(p)).slice(0, 40);

  /** Sitemap lists a discovery URL not present in discovery-index (stale sitemap or registry drift) */
  const sitemapOnlyDiscoveryPaths = [...sitemapDiscovery].filter((p) => !indexPaths.has(p)).slice(0, 40);

  const manifestPaths = pathSet(contentManifest.entries || []);

  const manifestNotInDiscoveryIndex = [...manifestPaths].filter((p) => !indexPaths.has(p)).slice(0, 25);

  const conditionalNoindexPresets = Object.values(INTELLIGENCE_DISCOVERY_PRESETS || {})
    .filter((p) => (p.minResults ?? 0) >= 2)
    .map((p) => ({
      slug: p.slug,
      path: p.path,
      minResults: p.minResults,
      note: "May emit noindex when live catalog yields fewer results than minResults.",
    }));

  return {
    generatedAt: new Date().toISOString(),
    counts: {
      sitemapDiscoveryUrls: sitemapDiscovery.size,
      discoveryIndexPages: indexPaths.size,
      contentManifestEntries: manifestPaths.size,
    },
    orphanDiscoveryPaths,
    sitemapOnlyDiscoveryPaths,
    manifestNotInDiscoveryIndex,
    conditionalNoindexPresets,
  };
}
