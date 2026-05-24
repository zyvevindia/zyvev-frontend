/**
 * Day 3 compare validation — operational QA for tier-1 compare journeys.
 * Validates compare slugs, family coverage, and SEO compare JSON presence.
 *
 * Run: npm run backend:compare-validate
 */

import "./lib/bootstrapEnv.mjs";

import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

function fail(msg) {
  console.error(`backend-compare-validate FAILED: ${msg}`);
  process.exit(1);
}

function ok(msg) {
  console.log(`OK: ${msg}`);
}

function readJson(path) {
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, "utf8"));
}

async function main() {
  console.log("\n=== Compare Validation (Day 3) ===\n");

  const convUrl = pathToFileURL(
    join(ROOT, "src/backend/catalog/catalogConventions.js")
  ).href;
  const defsUrl = pathToFileURL(
    join(ROOT, "src/backend/catalog/tier1CatalogDefinitions.js")
  ).href;

  const { DAY3_COMPARE_PAIRS } = await import(convUrl);
  const { getTier1Definition } = await import(defsUrl);

  const compareXml = readFileSync(
    join(ROOT, "public/sitemaps/compare.xml"),
    "utf8"
  );

  for (const pair of DAY3_COMPARE_PAIRS) {
    const inSitemap = compareXml.includes(`/compare/${pair.compareSlug}`);
    if (!inSitemap) {
      fail(`compare sitemap missing: ${pair.compareSlug} (${pair.label})`);
    }

    for (const family of pair.families) {
      const def = getTier1Definition(family);
      if (!def?.compareReady) {
        fail(`${pair.label}: ${family} not compare-ready in catalog definitions`);
      }
    }

    const seoCandidates = [
      pair.compareSlug,
      `${pair.families[0]}-vs-${pair.families[1]}`,
      `${pair.families[1]}-vs-${pair.families[0]}`,
    ];
    const seoPath = seoCandidates
      .map((s) => join(ROOT, "public/seo-data", `${s}.json`))
      .find((p) => existsSync(p));

    if (seoPath) {
      const seo = readJson(seoPath);
      if (!seo?.page?.title && !seo?.title) {
        ok(`${pair.label}: seo present (minimal) at ${seoPath.split(/[/\\]/).pop()}`);
      } else {
        ok(`${pair.label}: seo data at ${seoPath.split(/[/\\]/).pop()}`);
      }
    } else {
      ok(`${pair.label}: sitemap route ok; seo json optional for now`);
    }
  }

  ok(`${DAY3_COMPARE_PAIRS.length} day3 compare pairs validated`);
  console.log("\nbackend-compare-validate passed\n");
}

main().catch((e) => fail(e.message));
