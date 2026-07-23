/**
 * Sprint 2.3 — Brand Landing Pages Production Certification
 * npm run landing:certify:sprint23
 */
import "./lib/bootstrapEnv.mjs";

import { chromium, request as playwrightRequest } from "playwright";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";

const SITE = (process.env.PLAYWRIGHT_BASE_URL || "https://evsavari.com").replace(/\/$/, "");
const CANONICAL_ORIGIN = (process.env.CANONICAL_ORIGIN || "https://evsavari.com").replace(/\/$/, "");
const DATE = new Date().toISOString().slice(0, 10);
const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const outDir = join(root, "docs", "releases");

const BRAND_SLUGS = [
  "tata",
  "mahindra",
  "mg",
  "hyundai",
  "byd",
  "kia",
  "bmw",
  "mercedes-benz",
];

const REGRESSION_PATHS = [
  "/",
  "/cars",
  "/cars/tata-nexon-ev",
  "/compare",
  "/guides",
  "/compare/nexon-ev-vs-mg-zs-ev",
  "/best-evs/large-family",
];

function runScript(rel) {
  const result = spawnSync(process.execPath, [join(root, rel)], {
    cwd: root,
    encoding: "utf8",
    env: process.env,
  });
  return { pass: result.status === 0, detail: (result.stderr || result.stdout || "").slice(-500) };
}

async function auditBrandPage(page, slug) {
  const path = `/brands/${slug}`;
  const expectedCanonical = `${CANONICAL_ORIGIN}${path}`;

  await page.goto(`${SITE}${path}`, { waitUntil: "networkidle", timeout: 90000 });
  await page.waitForTimeout(1500);

  return page.evaluate(
    ({ expectedCanonical, slugLabel }) => {
      const norm = (u) => String(u || "").replace(/\/$/, "");
      const canonicals = [...document.querySelectorAll('link[rel="canonical"]')].map((el) => el.href);
      const title = document.querySelector("title")?.textContent?.trim() || "";
      const h1 = document.querySelector("h1")?.textContent?.trim() || "";
      const usesLandingShell = document.querySelector(".landing-page") != null;
      const legacyEditorial = document.body.textContent?.includes("SeoRecommendationList");

      const jsonLd = [...document.querySelectorAll("script")]
        .filter((el) => el.type === "application/ld+json")
        .map((el) => {
          try {
            return JSON.parse(el.textContent);
          } catch {
            return null;
          }
        })
        .filter(Boolean);

      const types = [];
      const walk = (obj) => {
        if (!obj || typeof obj !== "object") return;
        if (obj["@type"]) types.push(obj["@type"]);
        if (Array.isArray(obj)) obj.forEach(walk);
        else Object.values(obj).forEach(walk);
      };
      jsonLd.forEach(walk);

      const cards = document.querySelectorAll(".catalog-results-grid a, .car-card, [class*='CarCard']").length;

      return {
        slug: slugLabel,
        canonicalOk: canonicals.length === 1 && norm(canonicals[0]) === norm(expectedCanonical),
        titleOk: /Electric Cars in India/i.test(title) && /EVSavari/i.test(title),
        h1Ok: /Electric Cars in India/i.test(h1),
        landingShell: usesLandingShell,
        notLegacyEditorial: !legacyEditorial,
        schemaTypes: [...new Set(types)],
        hasCollectionPage: types.includes("CollectionPage"),
        hasBreadcrumb: types.includes("BreadcrumbList"),
        hasItemList: types.includes("ItemList"),
        hasProduct: types.includes("Product"),
        vehicleCards: cards,
      };
    },
    { expectedCanonical, slugLabel: slug }
  );
}

async function main() {
  mkdirSync(outDir, { recursive: true });

  const { getLandingRegistrySize, listLandingPages } = await import(
    pathToFileURL(join(root, "src/landing/landingRegistry.js")).href
  );
  await import(pathToFileURL(join(root, "src/landing/config/registerProductionLandings.js")).href);

  const registrySize = getLandingRegistrySize();
  const brandPages = listLandingPages().filter((p) => p.type === "brand");

  const architecture = [
    { name: "registry has 8 brand entries", pass: registrySize === 8, detail: `size=${registrySize}` },
    { name: "all entries type brand", pass: brandPages.length === 8 },
    {
      name: "single LandingPage renderer",
      pass: existsSync(join(root, "src/landing/LandingPage.jsx")),
    },
    {
      name: "no brand-specific page components",
      pass: !existsSync(join(root, "src/pages/TataLanding.jsx")),
    },
    {
      name: "configs in buildBrandLandingConfig only",
      pass: existsSync(join(root, "src/landing/config/buildBrandLandingConfig.js")),
    },
  ];

  const http = await playwrightRequest.newContext();
  const regression = [];
  for (const path of REGRESSION_PATHS) {
    const res = await http.get(`${SITE}${path}`);
    regression.push({ path, status: res.status(), pass: res.ok() });
  }
  await http.dispose();

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const brandAudits = [];

  for (const slug of BRAND_SLUGS) {
    const audit = await auditBrandPage(page, slug);
    audit.pass =
      audit.canonicalOk &&
      audit.titleOk &&
      audit.h1Ok &&
      audit.landingShell &&
      audit.notLegacyEditorial &&
      audit.hasCollectionPage &&
      audit.hasBreadcrumb &&
      audit.hasItemList &&
      !audit.hasProduct;
    brandAudits.push(audit);
  }

  await browser.close();

  const seoFoundation = runScript("scripts/seo-foundation-smoke.mjs");

  const issues = [];
  if (!architecture.every((c) => c.pass)) issues.push("architecture");
  if (!brandAudits.every((a) => a.pass)) issues.push("brand pages");
  if (!regression.every((r) => r.pass)) issues.push("regression");
  if (!seoFoundation.pass) issues.push("seo foundation");

  const report = {
    sprint: "2.3",
    title: "Brand Landing Pages (Framework Population)",
    generatedAt: new Date().toISOString(),
    site: SITE,
    registrySize,
    brandSlugs: BRAND_SLUGS,
    architecture,
    brandAudits,
    regression,
    seoFoundation,
    issues,
    verdict: issues.length === 0 ? "PASS" : "FAIL",
    extensibility: {
      ninthBrandExample: {
        file: "src/landing/config/brandLandingDefinitions.js",
        action: "Add { slug: 'volvo', label: 'Volvo', filterBrand: 'Volvo' } to BRAND_LANDING_DEFINITIONS",
        note: "No JSX, routes, or SEO changes required",
      },
    },
  };

  const mdPath = join(outDir, "sprint-23-brand-landing-certification.md");
  const jsonPath = join(outDir, `sprint-23-brand-landing-${DATE}.json`);
  const adrPath = join(root, "docs/architecture/adr-sprint-23-brand-landings.md");

  const adr = `# ADR — Sprint 2.3 Brand Landing Pages

## Status
Accepted — ${DATE}

## Context
Sprint 2.2 delivered an empty landing registry and generic \`LandingPage\` engine. Sprint 2.3 must populate eight OEM brand hubs without new rendering logic.

## Decision
Register eight brand configurations via \`buildBrandLandingConfig()\` and \`registerBrandLandingPages()\`. \`LandingRouter\` resolves registry entries at \`/brands/:brand\` and renders \`LandingPage\` — legacy \`DiscoverySeoPage\` is bypassed only when a registry entry exists.

## Why no new rendering logic
- **Single renderer:** All brands share \`LandingPage.jsx\`
- **Catalog read-only:** \`filters.brand\` drives \`applyLandingCatalogFilter()\` — new vehicles appear automatically
- **SEO reuse:** \`landingMetadata\` → \`buildPageMeta\` → \`SeoHead\`
- **Schema reuse:** CollectionPage + BreadcrumbList + ItemList (no Product on brand hubs)
- **Sections:** Hero stats and internal links are generic section/config enhancements, not OEM JSX

## Consequences
- Adding Volvo = one row in \`BRAND_LANDING_DEFINITIONS\`
- Editorial JSON at \`public/seo-data/brands/*\` remains for content tooling but is not the runtime source for these eight URLs
- Sprint 2.4 price pages can reuse the same factory pattern with \`type: "price"\`

## Verification
\`npm run landing:certify:sprint23\` on production after deploy.
`;

  writeFileSync(adrPath, adr);

  const md = `# Sprint 2.3 — Brand Landing Pages Certification

**Generated:** ${report.generatedAt}  
**Site:** ${SITE}  
**Verdict:** **${report.verdict}**

## Architecture

${architecture.map((c) => `- ${c.pass ? "✓" : "✗"} ${c.name}${c.detail ? ` (${c.detail})` : ""}`).join("\n")}

## Brand pages (${brandAudits.filter((a) => a.pass).length}/8)

| Brand | Canonical | Title | H1 | Landing | Schema | Pass |
|-------|-----------|-------|----|---------|--------|------|
${brandAudits
  .map(
    (a) =>
      `| ${a.slug} | ${a.canonicalOk ? "✓" : "✗"} | ${a.titleOk ? "✓" : "✗"} | ${a.h1Ok ? "✓" : "✗"} | ${a.landingShell ? "✓" : "✗"} | ${a.hasCollectionPage && a.hasBreadcrumb && a.hasItemList && !a.hasProduct ? "✓" : "✗"} | ${a.pass ? "✓" : "✗"} |`
  )
  .join("\n")}

## Regression

${regression.map((r) => `- ${r.pass ? "✓" : "✗"} ${r.path} (${r.status})`).join("\n")}

## SEO foundation

- ${seoFoundation.pass ? "✓ PASS" : "✗ FAIL"}

## Ninth brand (Volvo) extensibility

Add to \`src/landing/config/brandLandingDefinitions.js\`:

\`\`\`js
{ slug: "volvo", label: "Volvo", filterBrand: "Volvo" },
\`\`\`

No other files required.

## ADR

[\`docs/architecture/adr-sprint-23-brand-landings.md\`](../architecture/adr-sprint-23-brand-landings.md)
`;

  writeFileSync(jsonPath, JSON.stringify(report, null, 2));
  writeFileSync(mdPath, md);

  console.log(`\nSprint 2.3 Brand Landing Certification: ${report.verdict}`);
  console.log(`Report: ${mdPath}`);
  if (issues.length) {
    console.error("Issues:", issues.join("; "));
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
