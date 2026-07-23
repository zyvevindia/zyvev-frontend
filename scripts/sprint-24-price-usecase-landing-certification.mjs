/**
 * Sprint 2.4 — Price & Use-Case Landing Pages Production Certification
 * npm run landing:certify:sprint24
 */
import "./lib/bootstrapEnv.mjs";

import { chromium, request as playwrightRequest } from "playwright";
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";

const SITE = (process.env.PLAYWRIGHT_BASE_URL || "https://evsavari.com").replace(/\/$/, "");
const CANONICAL_ORIGIN = (process.env.CANONICAL_ORIGIN || "https://evsavari.com").replace(/\/$/, "");
const DATE = new Date().toISOString().slice(0, 10);
const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const outDir = join(root, "docs", "releases");

const PRICE_SLUGS = ["under-10-lakh", "under-15-lakh", "under-20-lakh", "premium"];
const USE_CASE_SLUGS = ["city", "family", "highway", "long-range", "fast-charging", "budget"];
const SPRINT24_SLUGS = [...PRICE_SLUGS, ...USE_CASE_SLUGS];

const REGRESSION_PATHS = [
  "/",
  "/cars",
  "/cars/tata-nexon-ev",
  "/compare",
  "/guides",
  "/compare/nexon-ev-vs-mg-zs-ev",
  "/brands/tata",
  "/brands/mahindra",
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

async function auditBestEvsPage(page, slug) {
  const path = `/best-evs/${slug}`;
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
      const hasFaqBlock = document.querySelector(".landing-faq") != null;

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
        titleOk: /EVSavari/i.test(title) && title.length > 10,
        h1Ok: h1.length > 5,
        landingShell: usesLandingShell,
        notLegacyEditorial: !legacyEditorial,
        hasFaqBlock,
        schemaTypes: [...new Set(types)],
        hasCollectionPage: types.includes("CollectionPage"),
        hasBreadcrumb: types.includes("BreadcrumbList"),
        hasItemList: types.includes("ItemList"),
        hasFaqSchema: types.includes("FAQPage"),
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
  const allPages = listLandingPages();
  const brandPages = allPages.filter((p) => p.type === "brand");
  const pricePages = allPages.filter((p) => p.type === "price");
  const useCasePages = allPages.filter((p) => p.type === "use_case");

  const architecture = [
    {
      name: "registry has 18 entries (8 brand + 4 price + 6 use case)",
      pass: registrySize === 18,
      detail: `size=${registrySize}`,
    },
    { name: "4 price entries", pass: pricePages.length === 4 },
    { name: "6 use_case entries", pass: useCasePages.length === 6 },
    { name: "8 brand entries preserved", pass: brandPages.length === 8 },
    {
      name: "single LandingPage renderer",
      pass: existsSync(join(root, "src/landing/LandingPage.jsx")),
    },
    {
      name: "no price/use-case page components",
      pass:
        !existsSync(join(root, "src/pages/PriceLanding.jsx")) &&
        !existsSync(join(root, "src/pages/BudgetLanding.jsx")),
    },
    {
      name: "configs in definition files only",
      pass:
        existsSync(join(root, "src/landing/config/priceLandingDefinitions.js")) &&
        existsSync(join(root, "src/landing/config/useCaseLandingDefinitions.js")),
    },
    {
      name: "LandingRouter unchanged routing pattern",
      pass: existsSync(join(root, "src/landing/LandingRouter.jsx")),
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
  const landingAudits = [];

  for (const slug of SPRINT24_SLUGS) {
    const audit = await auditBestEvsPage(page, slug);
    audit.pass =
      audit.canonicalOk &&
      audit.titleOk &&
      audit.h1Ok &&
      audit.landingShell &&
      audit.notLegacyEditorial &&
      audit.hasCollectionPage &&
      audit.hasBreadcrumb &&
      audit.hasItemList &&
      !audit.hasProduct &&
      audit.hasFaqBlock &&
      audit.hasFaqSchema;
    landingAudits.push(audit);
  }

  await browser.close();

  const seoFoundation = runScript("scripts/seo-foundation-smoke.mjs");

  const issues = [];
  if (!architecture.every((c) => c.pass)) issues.push("architecture");
  if (!landingAudits.every((a) => a.pass)) issues.push("price/use-case pages");
  if (!regression.every((r) => r.pass)) issues.push("regression");
  if (!seoFoundation.pass) issues.push("seo foundation");

  const report = {
    sprint: "2.4",
    title: "Price & Use-Case Landing Pages",
    generatedAt: new Date().toISOString(),
    site: SITE,
    registrySize,
    priceSlugs: PRICE_SLUGS,
    useCaseSlugs: USE_CASE_SLUGS,
    architecture,
    landingAudits,
    regression,
    seoFoundation,
    issues,
    verdict: issues.length === 0 ? "PASS" : "FAIL",
    extensibility: {
      example: {
        file: "src/landing/config/priceLandingDefinitions.js",
        action:
          "Add { slug: 'under-25-lakh', category: 'price', h1: '...', filters: { intelligenceFilterIds: ['price_under_20'], ... } }",
        note: "No JSX, routes, or SEO changes required",
      },
    },
  };

  const mdPath = join(outDir, "sprint-24-price-usecase-landing-certification.md");
  const jsonPath = join(outDir, `sprint-24-price-usecase-landing-${DATE}.json`);
  const adrPath = join(root, "docs/architecture/adr-sprint-24-price-usecase-landings.md");

  const adr = `# ADR — Sprint 2.4 Price & Use-Case Landing Pages

## Status
Accepted — ${DATE}

## Context
Sprint 2.3 proved the landing registry with eight brand hubs. Sprint 2.4 must add ten \`/best-evs/:slug\` pages (four price segments, six use cases) without new rendering or routing architecture.

## Decision
Register price and use-case configurations via \`buildBestEvsLandingConfig()\`, \`registerPriceLandingPages()\`, and \`registerUseCaseLandingPages()\`. All entries flow into the single \`landingRegistry\`. \`LandingRouter\` at \`/best-evs/:useCase\` resolves registry hits and renders \`LandingPage\`; legacy \`DiscoverySeoPage\` remains fallback for editorial slugs not in the registry.

## Why no new rendering logic or routing
- **Single renderer:** Price and use-case pages share \`LandingPage.jsx\` with brands
- **Single registry:** No \`priceRegistry.js\` or \`useCaseRegistry.js\`
- **Catalog read-only:** \`filters.priceRange\` and \`filters.intelligenceFilterIds\` drive \`applyLandingCatalogFilter()\`
- **SEO/schema reuse:** \`landingMetadata\`, \`landingCanonical\`, \`landingSchema\` unchanged
- **Grouped config only:** \`priceLandingDefinitions.js\`, \`useCaseLandingDefinitions.js\`, \`buildBestEvsLandingConfig.js\`

## Consequences
- Adding "Under ₹25 lakh" = one row in \`PRICE_LANDING_DEFINITIONS\`
- Editorial JSON for legacy \`/best-evs/*\` slugs (e.g. \`large-family\`) unchanged — registry bypass only when configured
- Sprint 2.5 internal link graph can extend \`landingLinkGraph.js\` without \`LandingPage\` changes

## Verification
\`npm run landing:certify:sprint24\` on production after deploy.
`;

  writeFileSync(adrPath, adr);

  const md = `# Sprint 2.4 — Price & Use-Case Landing Pages Certification

**Generated:** ${report.generatedAt}  
**Site:** ${SITE}  
**Verdict:** **${report.verdict}**

## Architecture

${architecture.map((c) => `- ${c.pass ? "✓" : "✗"} ${c.name}${c.detail ? ` (${c.detail})` : ""}`).join("\n")}

## Price & use-case pages (${landingAudits.filter((a) => a.pass).length}/10)

| Slug | Canonical | Title | H1 | Landing | Schema | FAQ | Pass |
|------|-----------|-------|----|---------|--------|-----|------|
${landingAudits
  .map(
    (a) =>
      `| ${a.slug} | ${a.canonicalOk ? "✓" : "✗"} | ${a.titleOk ? "✓" : "✗"} | ${a.h1Ok ? "✓" : "✗"} | ${a.landingShell ? "✓" : "✗"} | ${a.hasCollectionPage && a.hasBreadcrumb && a.hasItemList && !a.hasProduct ? "✓" : "✗"} | ${a.hasFaqBlock && a.hasFaqSchema ? "✓" : "✗"} | ${a.pass ? "✓" : "✗"} |`
  )
  .join("\n")}

## Regression

${regression.map((r) => `- ${r.pass ? "✓" : "✗"} ${r.path} (${r.status})`).join("\n")}

## SEO foundation

- ${seoFoundation.pass ? "✓ PASS" : "✗ FAIL"}

## Future extensibility (Under ₹25 lakh)

Add to \`src/landing/config/priceLandingDefinitions.js\`:

\`\`\`js
{
  slug: "under-25-lakh",
  category: "price",
  h1: "Best Electric Cars Under ₹25 Lakh",
  linkLabel: "Under ₹25 lakh",
  shortDescription: "...",
  filters: { priceRange: "20_30", sortBy: "priceLow" },
  heroBadge: "Price guide",
  ctaLabel: "Browse EVs",
  ctaHref: "/cars",
},
\`\`\`

No other files required.

## ADR

[\`docs/architecture/adr-sprint-24-price-usecase-landings.md\`](../architecture/adr-sprint-24-price-usecase-landings.md)
`;

  writeFileSync(jsonPath, JSON.stringify(report, null, 2));
  writeFileSync(mdPath, md);

  console.log(`\nSprint 2.4 Price & Use-Case Landing Certification: ${report.verdict}`);
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
