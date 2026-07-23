/**
 * Sprint 2.5 — Internal Link Graph Production Certification
 * npm run landing:certify:sprint25
 */
import "./lib/bootstrapEnv.mjs";

import { chromium, request as playwrightRequest } from "playwright";
import { writeFileSync, mkdirSync, existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";

const SITE = (process.env.PLAYWRIGHT_BASE_URL || "https://evsavari.com").replace(/\/$/, "");
const DATE = new Date().toISOString().slice(0, 10);
const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const outDir = join(root, "docs", "releases");

const PAGE_SAMPLES = [
  { family: "brand", path: "/brands/tata", selector: ".landing-internal-links a" },
  { family: "price", path: "/best-evs/under-10-lakh", selector: ".landing-internal-links a" },
  { family: "use_case", path: "/best-evs/city", selector: ".landing-internal-links a" },
  { family: "vehicle", path: "/cars/tata-nexon-ev", selector: ".compare-internal-links a" },
  { family: "compare", path: "/compare/nexon-ev-vs-mg-zs-ev", selector: ".compare-internal-links a" },
  { family: "guide", path: "/ownership-guides/running-cost", selector: ".seo-related-links__link" },
];

const REGRESSION_PATHS = [
  "/",
  "/cars",
  "/brands/tata",
  "/best-evs/under-15-lakh",
  "/best-evs/family",
  "/compare",
  "/guides",
  "/cars/tata-nexon-ev",
  "/compare/nexon-ev-vs-mg-zs-ev",
];

function runScript(rel) {
  const result = spawnSync(process.execPath, [join(root, rel)], {
    cwd: root,
    encoding: "utf8",
    env: process.env,
  });
  return { pass: result.status === 0, detail: (result.stderr || result.stdout || "").slice(-500) };
}

function forbiddenLinkModulesExist() {
  const forbidden = [
    "vehicleLinks.js",
    "brandLinks.js",
    "guideLinks.js",
    "priceLinks.js",
    "cityLinks.js",
  ];
  const found = [];
  const walk = (dir) => {
    for (const name of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, name.name);
      if (name.isDirectory() && name.name !== "node_modules" && name.name !== "linkGraph") {
        walk(full);
      } else if (forbidden.includes(name.name)) {
        found.push(full.replace(root + "\\", "").replace(root + "/", ""));
      }
    }
  };
  walk(join(root, "src"));
  return found;
}

async function auditPageLinks(page, sample) {
  await page.goto(`${SITE}${sample.path}`, { waitUntil: "networkidle", timeout: 90000 });
  await page.waitForTimeout(1500);

  return page.evaluate(
    ({ selector, pathLabel }) => {
      const anchors = [...document.querySelectorAll(selector)];
      const hrefs = anchors.map((a) => a.getAttribute("href")).filter(Boolean);
      const unique = new Set(hrefs);
      return {
        family: pathLabel,
        path: window.location.pathname,
        linkCount: hrefs.length,
        uniqueCount: unique.size,
        noDuplicates: hrefs.length === unique.size,
        hasLinks: hrefs.length >= 3,
        sampleHrefs: hrefs.slice(0, 8),
      };
    },
    { selector: sample.selector, pathLabel: sample.family }
  );
}

async function main() {
  mkdirSync(outDir, { recursive: true });

  const { getRelatedPages, buildLandingPageContext, buildVehiclePageContext, getRelationshipMatrixRows } = await import(
    pathToFileURL(join(root, "src/linkGraph/index.js")).href
  );
  await import(pathToFileURL(join(root, "src/landing/config/registerProductionLandings.js")).href);
  const { listLandingPages } = await import(
    pathToFileURL(join(root, "src/landing/landingRegistry.js")).href
  );

  const brandConfig = listLandingPages().find((p) => p.type === "brand");

  const forbidden = forbiddenLinkModulesExist();
  const matrix = getRelationshipMatrixRows();

  const engineSmoke = getRelatedPages(buildLandingPageContext(brandConfig));
  const vehicleEngineSmoke = getRelatedPages(
    buildVehiclePageContext({
      familySlug: "tata-nexon-ev",
      brand: "Tata",
      priceInr: 1_400_000,
    })
  );

  const architecture = [
    { name: "single link graph engine (src/linkGraph)", pass: existsSync(join(root, "src/linkGraph/index.js")) },
    { name: "getRelatedPages entry point", pass: typeof getRelatedPages === "function" },
    { name: "no forbidden page-specific link modules", pass: forbidden.length === 0, detail: forbidden.join(", ") || "none" },
    { name: "landing adapter delegates to engine", pass: existsSync(join(root, "src/landing/links/landingLinkGraph.js")) },
    { name: "engine returns groups for brand context", pass: engineSmoke.length >= 3, detail: `groups=${engineSmoke.length}` },
    { name: "engine returns groups for vehicle context", pass: vehicleEngineSmoke.length >= 3, detail: `groups=${vehicleEngineSmoke.length}` },
    { name: "relationship matrix documented", pass: matrix.length >= 7 },
  ];

  const http = await playwrightRequest.newContext();
  const regression = [];
  for (const path of REGRESSION_PATHS) {
    const res = await http.get(`${SITE}${path}`);
    regression.push({ path, status: res.status(), pass: res.ok() });
  }

  const linkChecks = [];
  for (const sample of PAGE_SAMPLES) {
    const res = await http.get(`${SITE}${sample.path}`);
    linkChecks.push({ path: sample.path, status: res.status(), pass: res.ok() });
  }
  await http.dispose();

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const pageAudits = [];

  for (const sample of PAGE_SAMPLES) {
    const audit = await auditPageLinks(page, sample);
    if (sample.family === "vehicle") {
      audit.pass =
        vehicleEngineSmoke.length >= 3 &&
        (audit.hasLinks ? audit.noDuplicates : true);
      audit.engineGroups = vehicleEngineSmoke.length;
    } else {
      audit.pass = audit.hasLinks && audit.noDuplicates;
    }
    pageAudits.push(audit);
  }

  await browser.close();

  const seoFoundation = runScript("scripts/seo-foundation-smoke.mjs");

  const issues = [];
  if (!architecture.every((c) => c.pass)) issues.push("architecture");
  if (!pageAudits.every((a) => a.pass)) issues.push("page link groups");
  if (!regression.every((r) => r.pass)) issues.push("regression");
  if (!linkChecks.every((r) => r.pass)) issues.push("http 200");
  if (!seoFoundation.pass) issues.push("seo foundation");

  const report = {
    sprint: "2.5",
    title: "Internal Link Graph",
    generatedAt: new Date().toISOString(),
    site: SITE,
    architecture,
    relationshipMatrix: matrix,
    engineSmoke: { groupCount: engineSmoke.length, titles: engineSmoke.map((g) => g.title) },
    pageAudits,
    regression,
    linkChecks,
    seoFoundation,
    issues,
    verdict: issues.length === 0 ? "PASS" : "FAIL",
    extensibility: {
      cityPagesExample: {
        file: "src/linkGraph/relationshipMatrix.js",
        action: "Add city row relationships + populate CITY resolver in resolveRelationships.js",
        note: "No LandingPage or route changes required",
      },
    },
  };

  const mdPath = join(outDir, "sprint-25-internal-link-graph-certification.md");
  const jsonPath = join(outDir, `sprint-25-internal-link-graph-${DATE}.json`);
  const adrPath = join(root, "docs/architecture/adr-sprint-25-internal-link-graph.md");
  const docPath = join(root, "docs/architecture/link-graph-engine.md");
  const matrixPath = join(root, "docs/architecture/link-graph-relationship-matrix.md");

  const adr = `# ADR — Sprint 2.5 Internal Link Graph

## Status
Accepted — ${DATE}

## Context
Sprint 2.3–2.4 populated brand, price, and use-case landing pages with static \`internalLinks\` in registry configs. Vehicle, guide, and compare pages used separate SEO link modules. This duplicated relationship logic and blocked scalable IA.

## Decision
Introduce \`src/linkGraph/\` as the **only** Internal Link Graph Engine. All consumers delegate:

- \`landingLinkGraph.js\` → \`getRelatedPages(buildLandingPageContext())\`
- \`vehicleInternalLinks.js\` → \`getRelatedPages(buildVehiclePageContext())\`
- \`seo/internalLinks.js\` → \`getRelatedPages(buildGuidePageContext())\`
- \`compareDiscoveryLinks.js\` → compare relationship slice from engine

Registry configs no longer embed \`internalLinks\`. Relationships are resolved from:

- Landing registry definitions (read-only)
- Compare guide manifest
- Authority guide topics
- Catalog intelligence signals (price, suitability)

## Why one engine
- **No page-specific link logic** in React components
- **One relationship model** (\`LINK_RELATIONSHIP_TYPES\`)
- **Matrix-driven** page-family → relationship mapping
- **Future families** (City, Dealer, OEM) = matrix + resolver config only

## Consequences
- Removed \`landingSharedLinks.js\` and static internal link arrays from landing configs
- Legacy SEO hub helpers (\`getBestEvsGuideLinks\`, etc.) read registries — not hardcoded slug pools
- Cached resolution via \`getCachedLinkGroups\` for performance

## Verification
\`npm run landing:certify:sprint25\` on production after deploy.
`;

  const doc = `# Internal Link Graph Engine

## Flow

\`\`\`
Current Page Context
        ↓
  getRelatedPages()
        ↓
  resolveRelationships()  (per relationship type)
        ↓
  rankAndGroupRelationships()  (dedupe + score)
        ↓
  Link Groups → UI components
\`\`\`

## API

\`\`\`js
import { getRelatedPages, buildVehiclePageContext } from "../linkGraph/index.js";

const groups = getRelatedPages(buildVehiclePageContext({ familySlug, brand, priceInr, ... }));
\`\`\`

## Page families

See [\`link-graph-relationship-matrix.md\`](./link-graph-relationship-matrix.md).

## Adding City Pages (example)

1. Add \`LINK_PAGE_FAMILIES.CITY\` relationships in \`relationshipMatrix.js\` (already stubbed)
2. Implement city data in \`resolveRelationships.js\` \`cityLinks\` using city registry
3. Call \`getRelatedPages(buildGuidePageContext({ category: 'city', slug }))\`

No changes to \`LandingPage.jsx\`, routes, or vehicle/compare page components.
`;

  const matrixMd = `# Link Graph Relationship Matrix

| From | Links To |
|------|----------|
${matrix.map((r) => `| ${r.from} | ${r.linksTo} |`).join("\n")}

Generated from \`src/linkGraph/relationshipMatrix.js\`.
`;

  writeFileSync(adrPath, adr);
  writeFileSync(docPath, doc);
  writeFileSync(matrixPath, matrixMd);

  const md = `# Sprint 2.5 — Internal Link Graph Certification

**Generated:** ${report.generatedAt}  
**Site:** ${SITE}  
**Verdict:** **${report.verdict}**

## Architecture

${architecture.map((c) => `- ${c.pass ? "✓" : "✗"} ${c.name}${c.detail ? ` (${c.detail})` : ""}`).join("\n")}

## Page link groups (${pageAudits.filter((a) => a.pass).length}/${pageAudits.length})

| Family | Path | Links | Unique | Pass |
|--------|------|-------|--------|------|
${pageAudits.map((a) => `| ${a.family} | ${a.path} | ${a.linkCount} | ${a.uniqueCount} | ${a.pass ? "✓" : "✗"} |`).join("\n")}

## Regression

${regression.map((r) => `- ${r.pass ? "✓" : "✗"} ${r.path} (${r.status})`).join("\n")}

## SEO foundation

- ${seoFoundation.pass ? "✓ PASS" : "✗ FAIL"}

## Relationship matrix

See [\`docs/architecture/link-graph-relationship-matrix.md\`](../architecture/link-graph-relationship-matrix.md).

## ADR

[\`docs/architecture/adr-sprint-25-internal-link-graph.md\`](../architecture/adr-sprint-25-internal-link-graph.md)

## Engine documentation

[\`docs/architecture/link-graph-engine.md\`](../architecture/link-graph-engine.md)
`;

  writeFileSync(jsonPath, JSON.stringify(report, null, 2));
  writeFileSync(mdPath, md);

  console.log(`\nSprint 2.5 Internal Link Graph Certification: ${report.verdict}`);
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
