/**
 * Batch-generate SEO discovery content + central manifest.
 * Run: npm run content:generate
 */

import "./lib/bootstrapEnv.mjs";

import { writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import {
  CITIES,
  COMPARE_PAIRS,
  OWNERSHIP_TOPICS,
  BEST_EVS_TOPICS,
} from "./content-generators/data.mjs";
import {
  generateCityEvsPage,
  generateCityChargingPage,
  generateComparePage,
  generateOwnershipPage,
  generateBestEvsPage,
} from "./content-generators/pages.mjs";
import {
  AUTHORITY_ALL_EDITORIAL_TOPICS,
  generateAuthorityEditorialPage,
  authorityRegistryMeta,
} from "./content-generators/authorityPages.mjs";
import {
  validateRegistry,
  entryFromSeoPage,
  mergeRegistryEntries,
} from "./content-generators/registry.mjs";
import { SITE_ORIGIN } from "./content-generators/utils.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const seoDataRoot = join(root, "public/seo-data");
const generatedDir = join(root, "src/content/generated");

function writeJson(relPath, data) {
  const full = join(root, relPath);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function stripBrand(title) {
  return String(title || "").replace(/ \| EVSavari$/, "").trim();
}

function fileExists(relPath) {
  return existsSync(join(root, relPath));
}

const registry = [];

function register(entry, jsonRelPath, payload) {
  registry.push(entry);
  writeJson(jsonRelPath, payload);
}

console.log("Generating SEO content batch…\n");

// —— Cities (25 EV + 25 charging) ——
for (const city of CITIES) {
  const evsPath = `public/seo-data/cities/${city.slug}-evs.json`;
  const chargingPath = `public/seo-data/cities/${city.slug}-charging.json`;

  const evsPage = generateCityEvsPage(city);
  const chargingPage = generateCityChargingPage(city);

  register(
    entryFromSeoPage(evsPage.seoPage, {
      id: `city-${city.slug}-evs`,
      pageType: "city_evs",
      path: `/cities/${city.slug}/evs`,
      h1: stripBrand(evsPage.seoPage.title),
      filePath: evsPath,
    }),
    evsPath,
    evsPage
  );

  register(
    entryFromSeoPage(chargingPage.seoPage, {
      id: `city-${city.slug}-charging`,
      pageType: "city_charging",
      path: `/cities/${city.slug}/charging`,
      h1: stripBrand(chargingPage.seoPage.title),
      filePath: chargingPath,
    }),
    chargingPath,
    chargingPage
  );
}

// —— Compare (25) ——
for (const [left, right] of COMPARE_PAIRS) {
  const page = generateComparePage(left, right);
  const slug = page.seoPage.slug;
  const rel = `public/seo-data/${slug}.json`;
  register(
    entryFromSeoPage(page.seoPage, {
      id: `compare-${slug}`,
      pageType: "compare_guide",
      path: `/compare/${slug}`,
      h1: stripBrand(page.seoPage.title),
      filePath: rel,
    }),
    rel,
    page
  );
}

const AUTHORITY_CANONICAL_PATHS = new Set(
  AUTHORITY_ALL_EDITORIAL_TOPICS.map((t) => t.path)
);

// —— Authority editorial (population + myths) ——
for (const topic of AUTHORITY_ALL_EDITORIAL_TOPICS) {
  const page = generateAuthorityEditorialPage(topic);
  const rel = `public/seo-data/${topic.contentSlug}.json`;
  const meta = authorityRegistryMeta(topic, page.seoPage);
  register(
    entryFromSeoPage(page.seoPage, {
      ...meta,
      h1: meta.h1,
    }),
    rel,
    page
  );
}

// —— Ownership (15 new) ——
for (const topic of OWNERSHIP_TOPICS) {
  const ownershipPath = `/ownership-guides/${topic.segment}`;
  if (AUTHORITY_CANONICAL_PATHS.has(ownershipPath)) {
    continue;
  }
  const page = generateOwnershipPage(topic);
  const rel = `public/seo-data/${topic.contentSlug}.json`;
  register(
    entryFromSeoPage(page.seoPage, {
      id: `ownership-${topic.segment}`,
      pageType: "ownership_guide",
      path: `/ownership-guides/${topic.segment}`,
      h1: stripBrand(page.seoPage.title),
      filePath: rel,
    }),
    rel,
    page
  );
}

// —— Best EVs / buyer-intent (15 new) ——
for (const topic of BEST_EVS_TOPICS) {
  const page = generateBestEvsPage(topic);
  const rel = `public/seo-data/${topic.contentSlug}.json`;
  register(
    entryFromSeoPage(page.seoPage, {
      id: `best-evs-${topic.segment}`,
      pageType: "best_evs",
      path: `/best-evs/${topic.segment}`,
      h1: stripBrand(page.seoPage.title),
      filePath: rel,
    }),
    rel,
    page
  );
}

// Merge legacy root guides from existing index if present
const legacyEntries = [];
const indexPath = join(seoDataRoot, "index.json");
if (fileExists("public/seo-data/index.json")) {
  try {
    const index = JSON.parse(readFileSync(indexPath, "utf8"));
    for (const p of index.pages || []) {
      legacyEntries.push({
        id: `legacy-${p.slug}`,
        pageType: "legacy_guide",
        contentSlug: p.slug,
        path: p.canonicalPath,
        canonicalUrl: `${SITE_ORIGIN}${p.canonicalPath}`,
        title: p.title,
        h1: stripBrand(p.title),
        filePath: `public/seo-data/${p.slug}.json`,
        legacy: true,
      });
    }
  } catch {
    /* skip */
  }
}

const filteredLegacy = legacyEntries.filter(
  (e) => !AUTHORITY_CANONICAL_PATHS.has(e.path)
);
const allEntries = mergeRegistryEntries(registry, filteredLegacy);
const validation = validateRegistry(registry);

console.log(`Registry entries (generated batch): ${registry.length}`);
console.log(`Legacy index entries: ${legacyEntries.length}`);

if (!validation.ok) {
  console.error("\nRegistry validation FAILED:");
  for (const issue of validation.issues) {
    console.error(`  [${issue.code}] ${issue.id}: ${issue.message}`);
  }
  process.exit(1);
}

console.log("Registry validation passed (no duplicate paths/titles/H1s in batch).\n");

// content-manifest.json
writeJson("public/seo-data/content-manifest.json", {
  generatedAt: new Date().toISOString(),
  siteOrigin: SITE_ORIGIN,
  counts: {
    city_evs: CITIES.length,
    city_charging: CITIES.length,
    compare: COMPARE_PAIRS.length,
    ownership: OWNERSHIP_TOPICS.length,
    authority_editorial: AUTHORITY_ALL_EDITORIAL_TOPICS.length,
    best_evs: BEST_EVS_TOPICS.length,
    batch_total: registry.length,
  },
  entries: registry,
});

// Runtime slug extensions for Vite app
mkdirSync(generatedDir, { recursive: true });

const ownershipMap = Object.fromEntries(
  OWNERSHIP_TOPICS.map((t) => [t.segment, t.contentSlug])
);
const bestEvsMap = Object.fromEntries(
  BEST_EVS_TOPICS.map((t) => [t.segment, t.contentSlug])
);
function compareSlugForPair(left, right) {
  const page = generateComparePage(left, right);
  return page.seoPage.slug;
}

const compareSlugs = COMPARE_PAIRS.map(([a, b]) => compareSlugForPair(a, b));
const citySlugs = CITIES.map((c) => c.slug);

const manifestJs = `/** AUTO-GENERATED by scripts/generate-content.mjs — do not edit */
export const CONTENT_REGISTRY_GENERATED_AT = ${JSON.stringify(new Date().toISOString())};

export const GENERATED_CITY_SLUGS = ${JSON.stringify(citySlugs, null, 2)};

export const GENERATED_COMPARE_SLUGS = ${JSON.stringify(compareSlugs, null, 2)};

export const GENERATED_OWNERSHIP_GUIDE_TO_SLUG = ${JSON.stringify(ownershipMap, null, 2)};

export const GENERATED_BEST_EVS_USE_CASE_TO_SLUG = ${JSON.stringify(bestEvsMap, null, 2)};

export const CONTENT_REGISTRY_ENTRIES = ${JSON.stringify(registry, null, 2)};
`;

writeFileSync(join(generatedDir, "manifest.js"), manifestJs, "utf8");

// Update discovery index summary (canonical paths from registry)
const discoveryIndex = registry.map((e) => ({
  slug: e.contentSlug,
  title: e.title,
  canonicalPath: e.path,
  pageType: e.pageType,
}));

writeJson("public/seo-data/discovery-index.json", {
  generatedAt: new Date().toISOString(),
  count: discoveryIndex.length,
  pages: discoveryIndex,
});

console.log("Wrote public/seo-data/content-manifest.json");
console.log("Wrote public/seo-data/discovery-index.json");
console.log("Wrote src/content/generated/manifest.js");
console.log("\nDone. Run: npm run build:sitemaps && npm run seo:qa");
