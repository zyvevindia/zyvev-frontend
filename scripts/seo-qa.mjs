/**
 * SEO QA — run: npm run seo:qa
 * Audits discovery canonicals, sitemap coverage, schema, links, FAQs.
 */

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { auditSeoPages, auditDiscoveryManifest } from "../src/seo/qa.js";
import { buildFullSitemapManifest, listExpectedDiscoveryPaths } from "../src/seo/sitemap.js";
import { resolveGuideCanonicalPath, GUIDE_CONTENT_SLUG_TO_CANONICAL_PATH } from "../src/seo/legacyCanonicalMap.js";
import { SEO_PAGE_SLUGS } from "../src/data/seoPageSlugs.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const SITE_ORIGIN =
  process.env.VITE_SITE_ORIGIN || "https://evsavari.com";

function loadJson(relPath) {
  return JSON.parse(readFileSync(join(root, relPath), "utf8"));
}

function stripBrand(title) {
  return String(title || "").replace(/ \| EVSavari$/, "").trim();
}

function discoverSeoDataExtras() {
  const brands = [];
  const cityRoutes = [];
  const brandsDir = join(root, "public/seo-data/brands");
  const citiesDir = join(root, "public/seo-data/cities");

  if (existsSync(brandsDir)) {
    for (const file of readdirSync(brandsDir)) {
      if (file.endsWith(".json")) brands.push(file.replace(/\.json$/, ""));
    }
  }
  if (existsSync(citiesDir)) {
    for (const file of readdirSync(citiesDir)) {
      if (!file.endsWith(".json")) continue;
      const base = file.replace(/\.json$/, "");
      if (base.endsWith("-charging")) {
        cityRoutes.push({ city: base.replace(/-charging$/, ""), type: "charging" });
      } else if (base.endsWith("-evs")) {
        cityRoutes.push({ city: base.replace(/-evs$/, ""), type: "evs" });
      }
    }
  }
  return { brands, cityRoutes };
}

function loadGuidePage(contentSlug, canonicalPath) {
  const data = loadJson(`public/seo-data/${contentSlug}.json`);
  const seo = data?.seoPage || {};
  const faq = Array.isArray(seo.faq) ? seo.faq : [];
  const ranked = Array.isArray(seo.rankedVehicles) ? seo.rankedVehicles : [];

  return {
    id: contentSlug,
    path: canonicalPath,
    title: seo.title,
    description: seo.metaDescription,
    canonical: `${SITE_ORIGIN}${canonicalPath}`,
    h1: stripBrand(seo.title),
    faqCount: faq.length,
    rankedCount: ranked.length,
    internalLinkCount: ranked.length > 0 ? 5 : 0,
    hasSchemaCandidates: Boolean(seo.title && canonicalPath),
    category: seo.category,
    sitemapEligible: true,
  };
}

function loadNestedPage(relPath, canonicalPath) {
  const data = loadJson(`public/seo-data/${relPath}.json`);
  const seo = data?.seoPage || data || {};
  const faq = Array.isArray(seo.faq) ? seo.faq : [];

  return {
    id: relPath,
    path: canonicalPath,
    title: seo.title,
    description: seo.metaDescription || seo.description,
    canonical: `${SITE_ORIGIN}${canonicalPath}`,
    h1: stripBrand(seo.title),
    faqCount: faq.length,
    rankedCount: Array.isArray(seo.rankedVehicles) ? seo.rankedVehicles.length : 0,
    hasSchemaCandidates: Boolean(seo.title),
    category: seo.category || "discovery",
    sitemapEligible: true,
  };
}

const extras = discoverSeoDataExtras();
const pages = [
  {
    id: "guides-hub",
    path: "/guides",
    title: "EV guides | EVSavari",
    description: "Browse EV buying guides, comparisons, and charging insights.",
    canonical: `${SITE_ORIGIN}/guides`,
    h1: "EV guides",
    faqCount: 0,
    rankedCount: 0,
    internalLinkCount: 5,
    hasSchemaCandidates: true,
    category: "hub",
    sitemapEligible: true,
  },
];

for (const slug of SEO_PAGE_SLUGS) {
  const path = resolveGuideCanonicalPath(slug);
  pages.push(loadGuidePage(slug, path));
}

for (const brand of extras.brands) {
  pages.push(
    loadNestedPage(`brands/${brand}`, `/brands/${brand}`)
  );
}

for (const { city, type } of extras.cityRoutes) {
  const suffix = type === "charging" ? "charging" : "evs";
  const file = type === "charging" ? `${city}-charging` : `${city}-evs`;
  pages.push(
    loadNestedPage(`cities/${file}`, `/cities/${city}/${suffix}`)
  );
}

const sitemapPaths = listExpectedDiscoveryPaths(extras);
const manifest = buildFullSitemapManifest(SITE_ORIGIN, extras);
const sitemapLocPaths = new Set(
  manifest.discovery.map((e) => e.path)
);

const basic = auditSeoPages(pages);
const discovery = auditDiscoveryManifest({
  pages,
  sitemapPaths,
  sitemapLocPaths,
  legacyGuidePaths: SEO_PAGE_SLUGS.map((s) => `/cars/${s}`),
  siteOrigin: SITE_ORIGIN,
});

const result = {
  ok: basic.ok && discovery.ok,
  issueCount: basic.issueCount + discovery.issueCount,
  warningCount: basic.warningCount + discovery.warningCount,
  issues: [...basic.issues, ...discovery.issues],
  warnings: [...basic.warnings, ...discovery.warnings],
  pagesAudited: pages.length,
  sitemapDiscoveryCount: sitemapPaths.length,
  canonicalGuideCount: Object.keys(GUIDE_CONTENT_SLUG_TO_CANONICAL_PATH).length,
};

console.log(
  `SEO QA: ${result.pagesAudited} pages | ${result.issueCount} errors | ${result.warningCount} warnings`
);
console.log(
  `  Discovery sitemap paths: ${result.sitemapDiscoveryCount} | Canonical guides: ${result.canonicalGuideCount}`
);

for (const issue of result.issues) {
  console.error(`ERROR [${issue.code}] ${issue.page}: ${issue.message}`);
}
for (const warn of result.warnings) {
  console.warn(
    `WARN [${warn.code}] ${warn.page}: ${warn.message}${warn.duplicateOf ? ` (↔ ${warn.duplicateOf})` : ""}`
  );
}

process.exit(result.ok ? 0 : 1);
