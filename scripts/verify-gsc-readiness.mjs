/**
 * Pre-flight Google Search Console readiness checks.
 * Run: npm run gsc:verify
 */

import "./lib/bootstrapEnv.mjs";

import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { GUIDE_CONTENT_SLUG_TO_CANONICAL_PATH } from "../src/seo/legacyCanonicalMap.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const publicDir = join(root, "public");
const SITE_ORIGIN = process.env.VITE_SITE_ORIGIN || "https://evsavari.com";

const issues = [];
const warnings = [];
const passed = [];

function ok(msg) {
  passed.push(msg);
}

function warn(msg) {
  warnings.push(msg);
}

function fail(msg) {
  issues.push(msg);
}

function read(rel) {
  return readFileSync(join(root, rel), "utf8");
}

// —— robots.txt ——
const robotsPath = join(publicDir, "robots.txt");
if (!existsSync(robotsPath)) {
  fail("Missing public/robots.txt");
} else {
  const robots = read("public/robots.txt");
  if (!robots.includes("Sitemap:")) fail("robots.txt missing Sitemap directive");
  else ok("robots.txt includes Sitemap directive");

  if (robots.includes("Disallow: /*?*")) {
    fail("robots.txt still has blanket Disallow: /*?* (blocks ?variant=)");
  } else ok("robots.txt allows selective query params");

  if (robots.includes("Allow: /*?variant=")) ok("robots.txt explicitly allows ?variant=");
  else warn("robots.txt missing Allow: /*?variant= rule");

  for (const block of ["/admin", "/dealer", "/seo-data/"]) {
    if (robots.includes(`Disallow: ${block}`)) ok(`robots.txt blocks ${block}`);
    else warn(`robots.txt may not block ${block}`);
  }
}

// —— sitemap index ——
const sitemapIndexPath = join(publicDir, "sitemap.xml");
if (!existsSync(sitemapIndexPath)) {
  fail("Missing public/sitemap.xml");
} else {
  const index = read("public/sitemap.xml");
  const childSitemaps = [
    "static.xml",
    "cars.xml",
    "seo-pages.xml",
    "compare.xml",
  ];
  for (const child of childSitemaps) {
    if (index.includes(`/sitemaps/${child}`)) ok(`sitemap index references ${child}`);
    else fail(`sitemap index missing ${child}`);
  }
  if (index.includes(`${SITE_ORIGIN}/sitemap`)) ok("sitemap index uses production origin");
}

// —— discovery sitemap hygiene ——
const seoPagesPath = join(publicDir, "sitemaps/seo-pages.xml");
if (existsSync(seoPagesPath)) {
  const seoXml = read("public/sitemaps/seo-pages.xml");
  const legacyGuidePattern = /<loc>[^<]*\/cars\/best-evs-/;
  if (legacyGuidePattern.test(seoXml)) {
    fail("seo-pages.xml contains legacy /cars/ guide URLs");
  } else ok("seo-pages.xml excludes legacy /cars/ guide URLs");

  if (seoXml.includes("?variant=") || seoXml.includes("?cars=")) {
    fail("seo-pages.xml contains query-string URLs");
  } else ok("seo-pages.xml has no query-string URLs");

  const urlCount = (seoXml.match(/<loc>/g) || []).length;
  ok(`seo-pages.xml lists ${urlCount} discovery URLs`);
}

// —— canonical map ——
const legacyPaths = Object.keys(GUIDE_CONTENT_SLUG_TO_CANONICAL_PATH).map(
  (slug) => `/cars/${slug}`
);
const canonicalValues = new Set(Object.values(GUIDE_CONTENT_SLUG_TO_CANONICAL_PATH));
for (const legacy of legacyPaths) {
  if (canonicalValues.has(legacy)) {
    fail(`Canonical map still points to legacy path: ${legacy}`);
  }
}
if (!issues.some((i) => i.includes("Canonical map"))) {
  ok(`Legacy guide canonical map: ${Object.keys(GUIDE_CONTENT_SLUG_TO_CANONICAL_PATH).length} slugs → discovery paths`);
}

// —— content manifest ——
const manifestPath = join(publicDir, "seo-data/content-manifest.json");
if (existsSync(manifestPath)) {
  const manifest = JSON.parse(read("public/seo-data/content-manifest.json"));
  ok(`content-manifest.json: ${manifest.entries?.length || 0} registered pages`);
} else {
  warn("content-manifest.json missing — run npm run content:generate");
}

console.log("\nGSC readiness verification\n");
for (const p of passed) console.log(`  ✓ ${p}`);
for (const w of warnings) console.warn(`  ⚠ ${w}`);
for (const i of issues) console.error(`  ✗ ${i}`);

console.log(
  `\n${passed.length} passed | ${warnings.length} warnings | ${issues.length} errors\n`
);

process.exit(issues.length ? 1 : 0);
