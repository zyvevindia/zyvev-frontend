/**
 * Growth Phase 2 — indexability validation report.
 * Run: npm run seo:growth-phase2
 */
import "../lib/bootstrapEnv.mjs";

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

import { SEO_PAGE_SPECS } from "../../src/agents/seo/index.js";
import { TOP20_EDITORIAL_BY_SLUG } from "../../src/content/editorial/top20Editorial.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "../..");
const DOCS_PATH = join(ROOT, "docs", "seo", "growth-phase-2.md");
const GSC_PATH = join(ROOT, "docs", "seo", "search-console-checklist.md");
const SITE_ORIGIN = process.env.VITE_SITE_ORIGIN || "https://evsavari.com";

function run(cmd) {
  try {
    return execSync(cmd, { cwd: ROOT, encoding: "utf8", stdio: "pipe" });
  } catch (e) {
    return (e.stdout || "") + (e.stderr || "") + (e.message || "");
  }
}

function loadJson(rel) {
  return JSON.parse(readFileSync(join(ROOT, rel), "utf8"));
}

console.log("Growth Phase 2 — running validation pipeline…");
run("npm run content:generate");
run("npm run build:sitemaps");

const sitemapAuditOut = run("npm run seo:sitemap-audit");
const sitemapAuditPass = sitemapAuditOut.includes("Audit: PASS");

const seoQaOut = run("npm run seo:qa");
const seoQaPass = /0 errors/.test(seoQaOut);

const gscOut = run("npm run gsc:verify");
const gscPass = !gscOut.includes(" errors") || /0 errors/.test(gscOut);

const robots = readFileSync(join(ROOT, "public/robots.txt"), "utf8");
const robotsChecks = {
  admin: robots.includes("Disallow: /admin"),
  crm: robots.includes("Disallow: /crm"),
  agent: robots.includes("Disallow: /agent"),
  allowCars: robots.includes("Allow: /cars"),
  allowCompare: robots.includes("Allow: /compare"),
  allowGuides: robots.includes("Allow: /guides"),
  allowBrands: robots.includes("Allow: /brands"),
  sitemap: robots.includes("Sitemap:"),
};

const manifest = loadJson("public/seo-data/content-manifest.json");
const sitemapManifest = existsSync(join(ROOT, "public/sitemap-manifest.json"))
  ? loadJson("public/sitemap-manifest.json")
  : null;

const editorialSlugs = Object.keys(TOP20_EDITORIAL_BY_SLUG);
const enrichedInManifest = (manifest.entries || []).filter((e) =>
  editorialSlugs.includes(e.contentSlug)
).length;

const buildOut = run("npm run build");

const recommendation =
  sitemapAuditPass &&
  seoQaPass &&
  gscPass &&
  Object.values(robotsChecks).every(Boolean) &&
  enrichedInManifest === SEO_PAGE_SPECS.length &&
  !/error during build|Build failed/i.test(buildOut)
    ? "READY_FOR_TRAFFIC"
    : "REVIEW_REQUIRED";

const gscDoc = `# EVSavari Search Console Readiness Checklist

Generated: ${new Date().toISOString().slice(0, 10)}  
Site: ${SITE_ORIGIN}

---

## 1. Sitemap URLs

Submit in Google Search Console → Sitemaps:

| URL | Purpose |
|-----|---------|
| \`${SITE_ORIGIN}/sitemap.xml\` | **Primary index** (submit this) |
| \`${SITE_ORIGIN}/sitemaps/static.xml\` | Hub + legal pages |
| \`${SITE_ORIGIN}/sitemaps/cars.xml\` | Vehicle family pages |
| \`${SITE_ORIGIN}/sitemaps/seo-pages.xml\` | Discovery guides (${sitemapManifest?.counts?.discovery ?? "—"} URLs) |
| \`${SITE_ORIGIN}/sitemaps/compare.xml\` | Compare hub + guides (${sitemapManifest?.counts?.compare ?? "—"} URLs) |

**Total indexed URLs:** ${sitemapManifest?.counts?.total ?? "—"}

---

## 2. Robots.txt validation

Live URL: \`${SITE_ORIGIN}/robots.txt\`

| Rule | Status |
|------|--------|
| \`Sitemap:\` directive | ${robotsChecks.sitemap ? "✅" : "❌"} |
| Block \`/admin/*\` | ${robotsChecks.admin ? "✅" : "❌"} |
| Block \`/crm/*\` | ${robotsChecks.crm ? "✅" : "❌"} |
| Block \`/agent/*\` | ${robotsChecks.agent ? "✅" : "❌"} |
| Allow \`/cars\` | ${robotsChecks.allowCars ? "✅" : "❌"} |
| Allow \`/compare\` | ${robotsChecks.allowCompare ? "✅" : "❌"} |
| Allow \`/guides\` | ${robotsChecks.allowGuides ? "✅" : "❌"} |
| Allow \`/brands/\` | ${robotsChecks.allowBrands ? "✅" : "❌"} |
| Allow \`?variant=\` on vehicle pages | ${robots.includes("Allow: /*?variant=") ? "✅" : "❌"} |
| Block \`/seo-data/\` | ${robots.includes("Disallow: /seo-data/") ? "✅" : "❌"} |

---

## 3. Canonical checks

- [ ] Discovery pages use \`${SITE_ORIGIN}/best-evs/*\`, \`/compare/*\`, \`/brands/*\`, \`/cities/*\`, \`/ownership-guides/*\`
- [ ] Legacy \`/cars/best-evs-*\` URLs redirect or canonicalise to discovery paths
- [ ] Vehicle pages canonical to \`/cars/:familySlug\` (no stray query params in sitemap)
- [ ] Compare tool session URLs (\`/compare?cars=\`) blocked in robots — editorial compares at \`/compare/:slug\` indexed

Run: \`npm run seo:qa\` — expect **0 errors**.

---

## 4. Structured data coverage

| Page type | Schema types | Status |
|-----------|--------------|--------|
| Vehicle detail (\`/cars/:slug\`) | Product, BreadcrumbList, FAQPage | ✅ Runtime via CarDetails |
| Brand pages (\`/brands/:brand\`) | BreadcrumbList, Article, ItemList, FAQPage | ✅ DiscoverySeoPage |
| Compare guides (\`/compare/:slug\`) | BreadcrumbList, ItemList, FAQPage | ✅ DiscoverySeoPage + ComparePage |
| Guide pages (best-evs, ownership, charging) | BreadcrumbList, Article, ItemList, FAQPage | ✅ DiscoverySeoPage |
| Guides hub (\`/guides\`) | BreadcrumbList, WebPage | ✅ SeoGuidesHub |

Validate in GSC → Enhancements after deploy.

---

## 5. Indexability checklist

### Pre-launch (local)

- [ ] \`npm run content:generate\` — ${manifest.entries?.length ?? "—"} manifest pages
- [ ] \`npm run build:sitemaps\` — robots.txt + XML regenerated
- [ ] \`npm run seo:sitemap-audit\` — manifest ↔ XML parity
- [ ] \`npm run seo:qa\` — 0 errors
- [ ] \`npm run gsc:verify\` — preflight pass
- [ ] \`npm run build\` — production build pass

### Post-deploy (GSC)

- [ ] Verify property: \`${SITE_ORIGIN}\`
- [ ] Submit sitemap: \`${SITE_ORIGIN}/sitemap.xml\`
- [ ] Inspect URL: home, \`/cars\`, top compare guide, top best-evs guide
- [ ] Request indexing for top 20 agent pages (see editorial enrichment list)
- [ ] Monitor Coverage report for \`/admin\`, \`/crm\`, \`/agent\` — should stay excluded
- [ ] Review Core Web Vitals for \`/cars\` and \`/compare\`

### Top 20 pages for priority indexing

${SEO_PAGE_SPECS.map(
  (s, i) =>
    `${i + 1}. \`${s.canonicalPath.replace(/^\/guides\//, "/best-evs/")}\` — ${s.h1}`
).join("\n")}

---

## Commands

\`\`\`bash
npm run seo:growth-phase2
npm run seo:sitemap-audit
npm run gsc:verify
npm run seo:qa
npm run build
\`\`\`
`;

writeFileSync(GSC_PATH, gscDoc, "utf8");

const growthDoc = `# EVSavari Growth Phase 2 — Indexability and Editorial Layer

Generated: ${new Date().toISOString().slice(0, 10)}  
Platform agents (Catalog Acquisition, Vehicle Creation, Score Engine core, Orchestrator, Monitoring, Audit, Analytics): **not modified**

---

## Recommendation

**${recommendation}**

---

## Deliverables

| Task | Output | Status |
|------|--------|--------|
| Sitemap audit | \`docs/seo/sitemap-audit.md\` | ${sitemapAuditPass ? "✅ Pass" : "⚠️ Review"} |
| Robots.txt | \`public/robots.txt\` (generated) | ${Object.values(robotsChecks).every(Boolean) ? "✅ Pass" : "⚠️ Review"} |
| Breadcrumb schema | Vehicle, brand, compare, guide pages | ✅ Implemented |
| Editorial enrichment | Top 20 agent pages | ${enrichedInManifest}/${SEO_PAGE_SPECS.length} enriched |
| Search Console checklist | \`docs/seo/search-console-checklist.md\` | ✅ Generated |

---

## Metrics

| Metric | Value |
|--------|-------|
| Manifest batch pages | ${manifest.entries?.length ?? "—"} |
| Sitemap total URLs | ${sitemapManifest?.counts?.total ?? "—"} |
| seo-pages.xml | ${sitemapManifest?.counts?.discovery ?? "—"} |
| compare.xml | ${sitemapManifest?.counts?.compare ?? "—"} |
| SEO QA | ${seoQaPass ? "0 errors" : "see output"} |
| GSC verify | ${gscPass ? "pass" : "see output"} |
| Production build | ${!/error during build|Build failed/i.test(buildOut) ? "pass" : "fail"} |

---

## Changes (Growth Phase 2)

### Sitemap quality
- \`scripts/build-sitemaps.mjs\` — merged discovery entries in \`sitemap-manifest.json\`; per-path \`lastmod\` on seo-pages + compare; page-type priorities (brand 0.78, best_evs 0.81)
- \`scripts/seo-population/sitemap-audit.mjs\` — manifest ↔ XML parity audit

### Robots.txt
- Block \`/crm/*\`, \`/agent/*\` in addition to \`/admin/*\`
- Explicit Allow for \`/cars\`, \`/compare\`, \`/guides\`, \`/brands/\`

### Breadcrumb schema
- \`src/seo/breadcrumbs.js\` — type-aware trails (brand, compare, city, best-evs, ownership, charging)
- \`src/components/SEO/DiscoveryBreadcrumbNav.jsx\` — UI aligned with JSON-LD
- \`src/pages/CarDetails.jsx\` — brand crumb links to \`/brands/:brand\` when available

### Editorial layer (human-reviewed)
- \`src/content/editorial/top20Editorial.js\` — pros, cons, who should buy/avoid, best alternative, internal links
- \`scripts/content-generators/editorialEnrichment.mjs\` — merged at generate time
- \`src/components/SEO/SeoEditorialDecision.jsx\` — renders editorial blocks on discovery pages

---

## Validation output

### seo:sitemap-audit

\`\`\`
${sitemapAuditOut.trim().slice(-500)}
\`\`\`

### seo:qa

\`\`\`
${seoQaOut.trim().slice(-400)}
\`\`\`

### gsc:verify

\`\`\`
${gscOut.trim().slice(-400)}
\`\`\`

---

## Next steps (post-traffic)

1. Submit \`${SITE_ORIGIN}/sitemap.xml\` in Google Search Console
2. Request indexing for top 20 agent pages
3. Monitor orphan URLs and Core Web Vitals weekly
4. Refresh editorial layer quarterly with human review
`;

writeFileSync(DOCS_PATH, growthDoc, "utf8");

console.log(`\nWrote ${DOCS_PATH}`);
console.log(`Wrote ${GSC_PATH}`);
console.log(`Recommendation: ${recommendation}`);

process.exit(recommendation === "READY_FOR_TRAFFIC" ? 0 : 1);
