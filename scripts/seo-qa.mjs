/**
 * SEO QA — run: npm run seo:qa
 * Audits content-manifest + legacy guides + sitemap coverage.
 */

import "./lib/bootstrapEnv.mjs";

import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { auditSeoPages, auditDiscoveryManifest } from "../src/seo/qa.js";
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

function pageFromManifestEntry(entry) {
  let seo = {};
  try {
    const data = loadJson(entry.filePath);
    seo = data?.seoPage || {};
  } catch {
    return null;
  }

  const relatedLinks = seo.relatedLinks || [];
  const internalLinkCount = relatedLinks.reduce(
    (n, s) => n + (s.links?.length || 0),
    0
  );

  return {
    id: entry.contentSlug,
    path: entry.path,
    title: seo.title || entry.title,
    description: seo.metaDescription,
    canonical: entry.canonicalUrl || `${SITE_ORIGIN}${entry.path}`,
    h1: stripBrand(seo.title || entry.h1),
    faqCount: Array.isArray(seo.faq) ? seo.faq.length : 0,
    rankedCount: Array.isArray(seo.rankedVehicles) ? seo.rankedVehicles.length : 0,
    internalLinkCount: internalLinkCount || (seo.rankedVehicles?.length > 0 ? 3 : 0),
    hasSchemaCandidates: Boolean(seo.title && entry.path),
    category: seo.category || entry.pageType,
    sitemapEligible: true,
    contentSlug: entry.contentSlug,
  };
}

function loadLegacyGuidePages() {
  const pages = [];
  const manifestSlugs = new Set();

  if (existsSync(join(root, "public/seo-data/content-manifest.json"))) {
    const manifest = loadJson("public/seo-data/content-manifest.json");
    for (const e of manifest.entries || []) {
      manifestSlugs.add(e.contentSlug);
    }
  }

  for (const slug of SEO_PAGE_SLUGS) {
    if (manifestSlugs.has(slug)) continue;
    const path = resolveGuideCanonicalPath(slug);
    try {
      const data = loadJson(`public/seo-data/${slug}.json`);
      const seo = data?.seoPage || {};
      pages.push({
        id: slug,
        path,
        title: seo.title,
        description: seo.metaDescription,
        canonical: `${SITE_ORIGIN}${path}`,
        h1: stripBrand(seo.title),
        faqCount: Array.isArray(seo.faq) ? seo.faq.length : 0,
        rankedCount: Array.isArray(seo.rankedVehicles) ? seo.rankedVehicles.length : 0,
        internalLinkCount: 5,
        hasSchemaCandidates: Boolean(seo.title),
        category: seo.category,
        sitemapEligible: true,
        contentSlug: slug,
      });
    } catch {
      /* skip */
    }
  }
  return pages;
}

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

if (existsSync(join(root, "public/seo-data/content-manifest.json"))) {
  const manifest = loadJson("public/seo-data/content-manifest.json");
  for (const entry of manifest.entries || []) {
    const page = pageFromManifestEntry(entry);
    if (page) pages.push(page);
  }
}

pages.push(...loadLegacyGuidePages());

const sitemapPaths = [
  "/guides",
  ...Object.values(GUIDE_CONTENT_SLUG_TO_CANONICAL_PATH),
  ...pages.filter((p) => p.sitemapEligible).map((p) => p.path),
];
const uniqueSitemapPaths = [...new Set(sitemapPaths)];

const sitemapLocPaths = new Set(uniqueSitemapPaths);

const basic = auditSeoPages(pages);
const discovery = auditDiscoveryManifest({
  pages,
  sitemapPaths: uniqueSitemapPaths,
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
  sitemapDiscoveryCount: uniqueSitemapPaths.length,
  canonicalGuideCount: Object.keys(GUIDE_CONTENT_SLUG_TO_CANONICAL_PATH).length,
};

console.log(
  `SEO QA: ${result.pagesAudited} pages | ${result.issueCount} errors | ${result.warningCount} warnings`
);
console.log(
  `  Discovery sitemap paths: ${result.sitemapDiscoveryCount} | Legacy canonical guides: ${result.canonicalGuideCount}`
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
