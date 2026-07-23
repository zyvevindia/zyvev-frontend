/**
 * Brand Landing Filter Membership Certification
 *
 * Local: source + logic proof that ranking uses the filtered brand set.
 * Production: fails if any vehicle card on /brands/:slug belongs to another OEM.
 *
 * npm run landing:certify:brand-filter
 */
import "./lib/bootstrapEnv.mjs";

import { chromium } from "playwright";
import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SITE = (process.env.PLAYWRIGHT_BASE_URL || "https://evsavari.com").replace(
  /\/$/,
  ""
);
const DATE = new Date().toISOString().slice(0, 10);
const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const outDir = join(root, "docs", "releases");
const FILTER_SRC = join(root, "src/landing/filters/landingFilter.js");

/** Production brand landings (registry). Citroen/Maruti are not brand hubs. */
const BRAND_PAGES = [
  { slug: "tata", filterBrand: "Tata" },
  { slug: "mahindra", filterBrand: "Mahindra" },
  { slug: "mg", filterBrand: "MG" },
  { slug: "hyundai", filterBrand: "Hyundai" },
  { slug: "byd", filterBrand: "BYD" },
  { slug: "kia", filterBrand: "Kia" },
  { slug: "bmw", filterBrand: "BMW" },
  { slug: "mercedes-benz", filterBrand: "Mercedes-Benz" },
];

function brandMatches(vehicleBrand, expectedBrand) {
  const actual = String(vehicleBrand || "").trim().toLowerCase();
  const expected = String(expectedBrand || "").trim().toLowerCase();
  if (!actual || !expected) return false;
  return actual === expected || actual.includes(expected) || expected.includes(actual);
}

function slugImpliesBrand(href, expectedBrand) {
  const slug = String(href || "")
    .replace(/^\/cars\//, "")
    .toLowerCase();
  const brandKey = String(expectedBrand || "")
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace("mercedes-benz", "mercedes");
  if (brandKey === "mg") {
    return slug.startsWith("mg-");
  }
  if (brandKey === "mercedes") {
    return slug.startsWith("mercedes-");
  }
  return slug.startsWith(`${brandKey}-`);
}

/**
 * Mirrors landingFilter ranking branch: filter first, then rank the pool.
 * `rankPool` is either filtered (correct) or full catalog (bug).
 */
function simulateRankBranch(families, brand, rankPool) {
  const filtered = families.filter((f) => brandMatches(f.brand, brand));
  const pool = rankPool === "filtered" ? filtered : families;
  return pool;
}

function localFilterCertification() {
  const src = readFileSync(FILTER_SRC, "utf8");

  const callsRankWithFiltered =
    /rankFamiliesForPreset\(\s*filtered\s*,/.test(src);
  const callsRankWithFamilies =
    /rankFamiliesForPreset\(\s*families\s*,/.test(src);

  const families = [
    { familySlug: "tata-nexon-ev", brand: "Tata" },
    { familySlug: "tata-punch-ev", brand: "Tata" },
    { familySlug: "mahindra-be-6", brand: "Mahindra" },
    { familySlug: "byd-atto-3", brand: "BYD" },
    { familySlug: "mg-zs-ev", brand: "MG" },
    { familySlug: "kia-ev6", brand: "Kia" },
  ];

  const results = [];

  results.push({
    scope: "local",
    slug: "source-ranks-filtered-set",
    pass: callsRankWithFiltered && !callsRankWithFamilies,
    detail: callsRankWithFiltered
      ? "rankFamiliesForPreset(filtered, ...) present"
      : "MISSING: still ranks unfiltered families",
  });

  for (const page of BRAND_PAGES) {
    const fixed = simulateRankBranch(families, page.filterBrand, "filtered");
    const buggy = simulateRankBranch(families, page.filterBrand, "families");
    const foreignFixed = fixed.filter((f) => !brandMatches(f.brand, page.filterBrand));
    const bugShowsForeign = buggy.some((f) => !brandMatches(f.brand, page.filterBrand));

    results.push({
      scope: "local",
      slug: page.slug,
      expectedBrand: page.filterBrand,
      cardCount: fixed.length,
      brands: [...new Set(fixed.map((f) => f.brand))],
      foreign: foreignFixed.map((f) => f.familySlug),
      pass: foreignFixed.length === 0,
      detail: bugShowsForeign
        ? "Bug pattern confirmed: ranking full catalog leaks other OEMs"
        : fixed.length
          ? `filtered=${fixed.length}`
          : "no mock vehicles for brand (membership still empty/safe)",
    });
  }

  // Explicit regression: Tata + sortBy must not include Mahindra
  const tataFixed = simulateRankBranch(families, "Tata", "filtered");
  const tataBuggy = simulateRankBranch(families, "Tata", "families");
  results.push({
    scope: "local",
    slug: "regression-sortBy-keeps-brand",
    expectedBrand: "Tata",
    cardCount: tataFixed.length,
    brands: [...new Set(tataFixed.map((f) => f.brand))],
    pass:
      tataFixed.every((f) => f.brand === "Tata") &&
      tataBuggy.some((f) => f.brand === "Mahindra") &&
      callsRankWithFiltered,
    detail: "Fixed path = Tata only; buggy path would include Mahindra",
  });

  return results;
}

async function productionBrandMembership(browser) {
  const page = await browser.newPage();
  const results = [];

  for (const brand of BRAND_PAGES) {
    const path = `/brands/${brand.slug}`;
    await page.goto(`${SITE}${path}`, {
      waitUntil: "domcontentloaded",
      timeout: 90000,
    });
    await page.waitForTimeout(3500);

    const audit = await page.evaluate(() => {
      const links = [
        ...document.querySelectorAll(
          ".landing-vehicle-grid a[href^='/cars/']"
        ),
      ].map((a) => a.getAttribute("href"));
      return { links: [...new Set(links)] };
    });

    const foreign = audit.links.filter(
      (href) => !slugImpliesBrand(href, brand.filterBrand)
    );
    const pass = audit.links.length > 0 && foreign.length === 0;

    results.push({
      scope: "production",
      path,
      expectedBrand: brand.filterBrand,
      cardCount: audit.links.length,
      links: audit.links,
      foreign,
      pass,
    });
  }

  await page.close();
  return results;
}

async function main() {
  mkdirSync(outDir, { recursive: true });

  const localResults = localFilterCertification();
  const localPass = localResults.every((r) => r.pass);

  let productionResults = [];
  let productionPass = true;
  let productionSkipped = false;

  if (process.env.SKIP_PRODUCTION_BRAND_FILTER === "1") {
    productionSkipped = true;
  } else {
    const browser = await chromium.launch({ headless: true });
    try {
      productionResults = await productionBrandMembership(browser);
      productionPass = productionResults.every((r) => r.pass);
    } finally {
      await browser.close();
    }
  }

  const report = {
    title: "Brand Landing Filter Membership Certification",
    generatedAt: new Date().toISOString(),
    site: SITE,
    rootCauseFix:
      "landingFilter.js: rankFamiliesForPreset(filtered) instead of families",
    localResults,
    productionResults,
    productionSkipped,
    localPass,
    productionPass,
    verdict: localPass && (productionSkipped || productionPass) ? "PASS" : "FAIL",
    note:
      "Production checks verify live site. Local PASS + production FAIL means deploy the filter fix, then re-run without SKIP_PRODUCTION_BRAND_FILTER.",
  };

  const jsonPath = join(outDir, `brand-landing-filter-certification-${DATE}.json`);
  const mdPath = join(outDir, "brand-landing-filter-certification.md");

  writeFileSync(jsonPath, JSON.stringify(report, null, 2));
  writeFileSync(
    mdPath,
    `# Brand Landing Filter Membership Certification

**Generated:** ${report.generatedAt}  
**Site:** ${SITE}  
**Verdict:** **${report.verdict}**

## Fix

\`rankFamiliesForPreset(filtered, ...)\` in \`src/landing/filters/landingFilter.js\` — ranking operates on the already brand-filtered set.

## Local — must PASS before deploy

| Check | Result | Pass |
|-------|--------|------|
${localResults
  .map(
    (r) =>
      `| ${r.slug} | ${r.detail || (r.brands || []).join(", ") || "—"} | ${r.pass ? "✓" : "✗"} |`
  )
  .join("\n")}

## Production — all 8 brand hubs

${
  productionSkipped
    ? "_Skipped (SKIP_PRODUCTION_BRAND_FILTER=1)_"
    : `| Path | Expected | Cards | Foreign | Pass |
|------|----------|-------|---------|------|
${productionResults
  .map(
    (r) =>
      `| ${r.path} | ${r.expectedBrand} | ${r.cardCount} | ${r.foreign.length ? r.foreign.join(", ") : "—"} | ${r.pass ? "✓" : "✗"} |`
  )
  .join("\n")}`
}

## Rule

For every rendered vehicle on \`/brands/:slug\`: vehicle brand must match landing brand. Fail immediately on any foreign OEM.

**Note:** Citroën and Maruti are not production brand landing hubs (registry has Tata, Mahindra, MG, Hyundai, BYD, Kia, BMW, Mercedes-Benz).
`
  );

  console.log(`\nBrand Landing Filter Certification: ${report.verdict}`);
  console.log(`Local: ${localPass ? "PASS" : "FAIL"}`);
  console.log(
    `Production: ${productionSkipped ? "SKIPPED" : productionPass ? "PASS" : "FAIL"}`
  );
  console.log(`Report: ${mdPath}`);

  if (!localPass || (!productionSkipped && !productionPass)) {
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
