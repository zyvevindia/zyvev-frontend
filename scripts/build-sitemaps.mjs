/**
 * Generate public/sitemap*.xml, sitemap-manifest.json, and robots.txt.
 * Run: npm run build:sitemaps
 */

import "./lib/bootstrapEnv.mjs";

import { writeFileSync, mkdirSync, readdirSync, existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildStaticSitemapEntries,
  buildVehicleFamilySitemapEntries,
  buildDiscoveryGuideSitemapEntries,
  buildCompareGuideSitemapEntries,
  buildIntelligenceDiscoverySitemapEntries,
} from "../src/seo/sitemap.js";
import { GUIDE_CONTENT_SLUG_TO_CANONICAL_PATH } from "../src/seo/legacyCanonicalMap.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const publicDir = join(root, "public");
const sitemapsDir = join(publicDir, "sitemaps");

const SITE_ORIGIN =
  process.env.VITE_SITE_ORIGIN || "https://evsavari.com";
const DEFAULT_LASTMOD = new Date().toISOString().slice(0, 10);

function loadLastmodByPath() {
  const map = {};
  const manifestPath = join(publicDir, "seo-data/content-manifest.json");

  if (!existsSync(manifestPath)) {
    return map;
  }

  try {
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));

    for (const row of manifest.entries || []) {
      if (!row.path) continue;
      const raw = row.updatedAt || row.generatedAt || manifest.generatedAt;

      if (raw) {
        map[row.path] = String(raw).slice(0, 10);
      }
    }
  } catch {
    /* non-fatal */
  }

  return map;
}

function discoveryEntry(path, priority, siteOrigin = SITE_ORIGIN, lastmod) {
  return {
    loc: `${siteOrigin}${path}`,
    path,
    priority,
    changefreq: "weekly",
    ...(lastmod ? { lastmod } : {}),
  };
}

function mergeDiscoveryEntries(baseEntries, siteOrigin, lastmodByPath = {}, defaultLastmod) {
  const byPath = new Map();
  for (const e of baseEntries) {
    byPath.set(e.path, e);
  }

  byPath.set("/guides", discoveryEntry("/guides", 0.85, siteOrigin, lastmodByPath["/guides"] || defaultLastmod));

  for (const path of Object.values(GUIDE_CONTENT_SLUG_TO_CANONICAL_PATH)) {
    const priority = path.startsWith("/compare/") ? 0.82 : 0.8;
    byPath.set(
      path,
      discoveryEntry(path, priority, siteOrigin, lastmodByPath[path] || defaultLastmod)
    );
  }

  const manifestPath = join(publicDir, "seo-data/content-manifest.json");
  if (existsSync(manifestPath)) {
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    for (const row of manifest.entries || []) {
      if (!row.path) continue;
      let priority = 0.8;
      if (row.pageType === "city_evs" || row.pageType === "city_charging") {
        priority = 0.76;
      }
      if (row.pageType === "brand") priority = 0.78;
      if (row.pageType === "compare_guide") priority = 0.82;
      if (row.pageType === "best_evs") priority = 0.81;
      byPath.set(
        row.path,
        discoveryEntry(
          row.path,
          priority,
          siteOrigin,
          lastmodByPath[row.path] || defaultLastmod
        )
      );
    }
  }

  for (const entry of buildIntelligenceDiscoverySitemapEntries(siteOrigin)) {
    byPath.set(entry.path, {
      ...entry,
      lastmod: lastmodByPath[entry.path] || defaultLastmod,
    });
  }

  return [...byPath.values()];
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function urlsetXml(entries, defaultLastmod = DEFAULT_LASTMOD) {
  const body = entries
    .map(
      (e) => `  <url>
    <loc>${escapeXml(e.loc)}</loc>
    <lastmod>${escapeXml(e.lastmod || defaultLastmod)}</lastmod>
    <changefreq>${e.changefreq || "weekly"}</changefreq>
    <priority>${Number(e.priority ?? 0.75).toFixed(2)}</priority>
  </url>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`;
}

function sitemapIndexXml(sitemapFiles, lastmod = DEFAULT_LASTMOD) {
  const body = sitemapFiles
    .map(
      (file) => `  <sitemap>
    <loc>${escapeXml(`${SITE_ORIGIN}/sitemaps/${file}`)}</loc>
    <lastmod>${lastmod}</lastmod>
  </sitemap>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</sitemapindex>
`;
}

function discoverSeoDataExtras() {
  const brands = [];
  const cityRoutes = [];
  const brandsDir = join(publicDir, "seo-data", "brands");
  const citiesDir = join(publicDir, "seo-data", "cities");

  if (existsSync(brandsDir)) {
    for (const file of readdirSync(brandsDir)) {
      if (file.endsWith(".json")) {
        brands.push(file.replace(/\.json$/, ""));
      }
    }
  }

  if (existsSync(citiesDir)) {
    for (const file of readdirSync(citiesDir)) {
      if (!file.endsWith(".json")) continue;
      const base = file.replace(/\.json$/, "");
      if (base.endsWith("-charging")) {
        cityRoutes.push({
          city: base.replace(/-charging$/, ""),
          type: "charging",
        });
      } else if (base.endsWith("-evs")) {
        cityRoutes.push({
          city: base.replace(/-evs$/, ""),
          type: "evs",
        });
      }
    }
  }

  return { brands, cityRoutes };
}

function buildRobotsTxt() {
  return `# EVSavari — production robots.txt
# Generated by build-sitemaps.mjs — do not hand-edit in prod without syncing generator

User-agent: *
Allow: /

# Admin / CRM / agents / auth — not for public index
Disallow: /admin
Disallow: /admin/
Disallow: /crm
Disallow: /crm/
Disallow: /agent
Disallow: /agent/
Disallow: /sales
Disallow: /sales/
Disallow: /dealer
Disallow: /dealer/
Disallow: /login
Disallow: /users
Disallow: /kanban

# Compare tool session noise (canonical editorial compares use /compare/:slug)
Disallow: /compare?
Disallow: /*?cars=*
Disallow: /*?compareMode=*
Disallow: /*?utm_*
Disallow: /*?fbclid*
Disallow: /*?gclid*
Disallow: /*?debug*
Disallow: /*?ref=*

# Variant trim selection on vehicle pages (family URL is canonical)
Allow: /*?variant=

# Legacy vehicle prefix — canonical is /cars/:familySlug
Disallow: /car/

# Internal / non-public surfaces
Disallow: /seo-data/
Disallow: /api/
Disallow: /debug/

# Allow high-value discovery paths explicitly
Allow: /cars
Allow: /cars/
Allow: /compare
Allow: /compare/
Allow: /guides
Allow: /guides/
Allow: /brands/
Allow: /best-evs/
Allow: /cities/
Allow: /discover/

Sitemap: ${SITE_ORIGIN}/sitemap.xml
`;
}

const extras = discoverSeoDataExtras();
const lastmodByPath = loadLastmodByPath();
const manifestGeneratedAt = (() => {
  const manifestPath = join(publicDir, "seo-data/content-manifest.json");
  if (!existsSync(manifestPath)) return DEFAULT_LASTMOD;
  try {
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    return String(manifest.generatedAt || DEFAULT_LASTMOD).slice(0, 10);
  } catch {
    return DEFAULT_LASTMOD;
  }
})();

mkdirSync(sitemapsDir, { recursive: true });

const staticEntries = buildStaticSitemapEntries(SITE_ORIGIN).map((e) => ({
  ...e,
  lastmod: DEFAULT_LASTMOD,
}));
const vehicleEntries = buildVehicleFamilySitemapEntries(SITE_ORIGIN).map((e) => ({
  ...e,
  lastmod: lastmodByPath[e.path] || DEFAULT_LASTMOD,
}));
const discoveryEntries = mergeDiscoveryEntries(
  buildDiscoveryGuideSitemapEntries(SITE_ORIGIN, extras),
  SITE_ORIGIN,
  lastmodByPath,
  manifestGeneratedAt
);
const compareEntries = buildCompareGuideSitemapEntries(SITE_ORIGIN, {
  lastmodByPath,
}).map((e) => ({
  ...e,
  lastmod: e.lastmod || lastmodByPath[e.path] || manifestGeneratedAt,
}));

writeFileSync(join(sitemapsDir, "static.xml"), urlsetXml(staticEntries));
writeFileSync(join(sitemapsDir, "cars.xml"), urlsetXml(vehicleEntries));
writeFileSync(join(sitemapsDir, "seo-pages.xml"), urlsetXml(discoveryEntries));
writeFileSync(join(sitemapsDir, "compare.xml"), urlsetXml(compareEntries));

writeFileSync(
  join(publicDir, "sitemap.xml"),
  sitemapIndexXml(["static.xml", "cars.xml", "seo-pages.xml", "compare.xml"])
);

writeFileSync(
  join(publicDir, "sitemap-manifest.json"),
  JSON.stringify(
    {
      siteOrigin: SITE_ORIGIN,
      generatedAt: new Date().toISOString(),
      static: staticEntries,
      vehicles: vehicleEntries,
      discovery: discoveryEntries,
      compare: compareEntries,
      counts: {
        static: staticEntries.length,
        vehicles: vehicleEntries.length,
        discovery: discoveryEntries.length,
        compare: compareEntries.length,
        total:
          staticEntries.length +
          vehicleEntries.length +
          discoveryEntries.length +
          compareEntries.length,
      },
      legacyGuideUrlsExcluded: true,
      sitemapFiles: {
        static: staticEntries.length,
        cars: vehicleEntries.length,
        discovery: discoveryEntries.length,
        compare: compareEntries.length,
      },
    },
    null,
    2
  )
);

writeFileSync(join(publicDir, "robots.txt"), buildRobotsTxt());

const total =
  staticEntries.length +
  vehicleEntries.length +
  discoveryEntries.length +
  compareEntries.length;

console.log(`Sitemaps generated (${SITE_ORIGIN})`);
console.log(`  static.xml:     ${staticEntries.length} URLs`);
console.log(`  cars.xml:       ${vehicleEntries.length} URLs (family slugs only)`);
console.log(`  seo-pages.xml:  ${discoveryEntries.length} URLs (discovery canonical)`);
console.log(`  compare.xml:    ${compareEntries.length} URLs`);
console.log(`  Total indexed:  ${total} URLs`);
console.log(`  robots.txt updated`);
