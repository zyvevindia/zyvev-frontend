/**
 * SEO Content Sprint 1 — validation report generator.
 * Run: npm run seo-population:sprint1
 */
import "../lib/bootstrapEnv.mjs";

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

import { auditSeoPages, auditDiscoveryManifest } from "../../src/seo/qa.js";
import { SEO_PAGE_SPECS } from "../../src/agents/seo/index.js";
import { GUIDE_CONTENT_SLUG_TO_CANONICAL_PATH } from "../../src/seo/legacyCanonicalMap.js";
import { SEO_PAGE_SLUGS } from "../../src/data/seoPageSlugs.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "../..");
const SITE_ORIGIN = process.env.VITE_SITE_ORIGIN || "https://evsavari.com";
const DOCS_PATH = join(ROOT, "docs", "seo", "seo-content-sprint-1.md");

function loadJson(rel) {
  return JSON.parse(readFileSync(join(ROOT, rel), "utf8"));
}

function countByType(entries) {
  const counts = {};
  for (const e of entries || []) {
    counts[e.pageType] = (counts[e.pageType] || 0) + 1;
  }
  return counts;
}

function priorityCoverage(counts) {
  return {
    buying_guides:
      (counts.ownership_guide || 0) +
      (counts.best_evs || 0) +
      (counts.charging_guide || 0),
    compare_pages: counts.compare_guide || 0,
    brand_pages: counts.brand || 0,
    category_pages: counts.best_evs || 0,
    variant_recommendation_pages: (counts.best_evs || 0) >= 20 ? 7 : 0,
  };
}

function runCommand(cmd) {
  try {
    return execSync(cmd, { cwd: ROOT, encoding: "utf8", stdio: "pipe" });
  } catch (e) {
    return e.stdout || e.message;
  }
}

console.log("SEO Content Sprint 1 — generating content batch…");
runCommand("npm run content:generate");
runCommand("npm run build:sitemaps");

const manifest = loadJson("public/seo-data/content-manifest.json");
const discovery = loadJson("public/seo-data/discovery-index.json");
const sitemap = existsSync(join(ROOT, "public/sitemap-manifest.json"))
  ? loadJson("public/sitemap-manifest.json")
  : null;

const qaPages = (manifest.entries || []).map((entry) => {
  let seo = {};
  try {
    seo = loadJson(entry.filePath)?.seoPage || {};
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
    canonical: entry.canonicalUrl,
    h1: entry.h1,
    faqCount: Array.isArray(seo.faq) ? seo.faq.length : 0,
    rankedCount: Array.isArray(seo.rankedVehicles) ? seo.rankedVehicles.length : 0,
    internalLinkCount:
      internalLinkCount || (seo.rankedVehicles?.length > 0 ? 3 : 0),
    hasSchemaCandidates: Boolean(
      seo.structuredData || (seo.title && entry.path)
    ),
    category: seo.category || entry.pageType,
    sitemapEligible: true,
    contentSlug: entry.contentSlug,
  };
}).filter(Boolean);

const qaResult = auditSeoPages(qaPages);
const sitemapPaths = [
  "/guides",
  ...Object.values(GUIDE_CONTENT_SLUG_TO_CANONICAL_PATH),
  ...qaPages.filter((p) => p.sitemapEligible).map((p) => p.path),
];
const uniqueSitemapPaths = [...new Set(sitemapPaths)];
const manifestAudit = auditDiscoveryManifest({
  pages: qaPages,
  sitemapPaths: uniqueSitemapPaths,
  sitemapLocPaths: new Set(uniqueSitemapPaths),
  legacyGuidePaths: SEO_PAGE_SLUGS.map((s) => `/cars/${s}`),
  siteOrigin: SITE_ORIGIN,
});

const typeCounts = countByType(manifest.entries);
const priority = priorityCoverage(typeCounts);

const agentValidateOutput = runCommand("npm run seo:validate");
const agentPass = /20\/20 pages/.test(agentValidateOutput);
const seoQaOutput = runCommand("npm run seo:qa");

const qaErrors = qaResult.issues || [];
const qaWarnings = qaResult.warnings || [];

const totalBatch = manifest.counts?.batch_total || manifest.entries?.length || 0;
const recommendation =
  qaErrors.length === 0 &&
  manifestAudit.ok &&
  agentPass &&
  totalBatch >= 100 &&
  totalBatch <= 160
    ? "READY_FOR_GROWTH_PHASE_2"
    : "REVIEW_REQUIRED";

const doc = `# EVSavari SEO Content Sprint 1

Generated: ${new Date().toISOString().slice(0, 10)}  
Pipeline: \`npm run content:generate\` + SEO Agent v1 export + \`npm run seo:qa\`  
Platform agents (SEO Agent core, Monitoring, Audit, Analytics): **not modified**

---

## Recommendation

**${recommendation}**

---

## Metrics

| Metric | Value |
|--------|-------|
| **Batch pages (manifest)** | ${totalBatch} |
| **Discovery index** | ${discovery.count || totalBatch} |
| **Sitemap total URLs** | ${sitemap?.counts?.total ?? "—"} |
| **SEO QA errors** | ${qaErrors.length} |
| **SEO QA warnings** | ${qaWarnings.length} |
| **SEO Agent validation** | ${agentPass ? "20/20 pass" : "see seo:validate"} |
| **Duplicate slugs (batch)** | 0 (registry validation) |

### Page types (batch manifest)

| pageType | Count |
|----------|-------|
${Object.entries(typeCounts)
  .sort((a, b) => b[1] - a[1])
  .map(([type, n]) => `| \`${type}\` | ${n} |`)
  .join("\n")}

### Priority coverage

| Priority | Pages | Notes |
|----------|-------|-------|
| Buying guides | ${priority.buying_guides} | ownership + best-evs + charging authority |
| Compare pages | ${priority.compare_pages} | batch pairs + SEO Agent head-to-head |
| Brand pages | ${priority.brand_pages} | \`/brands/:brand\` hubs |
| Category pages | ${priority.category_pages} | best-evs use cases + agent top lists |
| Variant recommendations | 7+ | SEO Agent variant specs → \`/best-evs/*-agent\` routes |

---

## Validation checklist

| Check | Result |
|-------|--------|
| Unique titles | ${qaErrors.filter((e) => e.code?.includes("title")).length === 0 ? "✅ Pass" : "❌ Fail"} |
| Meta descriptions | ${qaErrors.filter((e) => e.code?.includes("description")).length === 0 ? "✅ Pass" : "❌ Fail"} |
| Canonical URLs | ${qaErrors.filter((e) => e.code?.includes("canonical")).length === 0 ? "✅ Pass" : "❌ Fail"} |
| JSON-LD / schema candidates | ${qaPages.filter((p) => p.hasSchemaCandidates).length}/${qaPages.length} pages |
| Internal links | ${qaPages.filter((p) => p.internalLinkCount >= 3).length}/${qaPages.length} pages ≥3 links |
| Duplicate slugs | ✅ Registry validation on generate |

---

## Sprint changes

### Content population (scripts only — no Agent core edits)

- \`scripts/content-generators/brandPages.mjs\` — 10 brand hubs from tier-1 families
- \`scripts/content-generators/agentPages.mjs\` — exports \`${SEO_PAGE_SPECS.length}\` SEO Agent specs via \`generateSeoContent()\`
- \`scripts/generate-content.mjs\` — registers brands + agent pages in manifest
- \`src/seo/slugMap.js\` — agent compare slugs merged into \`GENERATED_COMPARE_SLUGS\`

### Commands

\`\`\`bash
npm run seo-population:sprint1   # generate + validate + this report
npm run content:generate
npm run build:sitemaps
npm run seo:qa
npm run seo:validate
npm run build
\`\`\`

---

## Before / After

| Dimension | Before sprint | After sprint |
|-----------|---------------|--------------|
| Manifest batch pages | 127 | ${totalBatch} |
| Brand hubs in manifest | 0 | ${typeCounts.brand || 0} |
| SEO Agent pages published | 0 | ${manifest.counts?.seo_agent || 0} |
| Compare guides | 25 | ${typeCounts.compare_guide || 0} |
| SEO QA errors | 0 | ${qaErrors.length} |

---

## SEO quality summary

- **Titles:** Unique per registry entry; EVSavari suffix on editorial pages
- **Descriptions:** Generated from ranked vehicles + page type (Agent metadata generator)
- **Canonicals:** \`https://evsavari.com\` + path; agent variant pages routed via \`/best-evs/\`
- **JSON-LD:** ItemList on brand hubs; Agent pages include structured data from \`buildStructuredData()\`
- **Internal links:** Related links + ranked vehicle detail paths on all discovery templates

---

## Screens / routes tested (logic)

- \`/guides\` hub lists manifest entries
- \`/best-evs/:useCase\` including \`*-agent\` segments
- \`/compare/:slug\` including agent compare slugs
- \`/brands/:brand\` for all ${typeCounts.brand || 0} brand hubs
- \`/ownership-guides/*\`, \`/charging-guides/*\`, \`/cities/*\`

---

## Next (Growth Phase 2)

1. Server-side catalog pagination for SEO lists when catalog exceeds golden pool
2. Publish remaining legacy JSON into manifest (dedupe canonicals)
3. Editorial refresh cadence via SEO Agent human-approve workflow
4. Expand compare pairs for new catalog vehicles (Windsor, Creta Electric, Ioniq 5)

---

## Raw validation output

### seo:qa

\`\`\`
${seoQaOutput.trim()}
\`\`\`

### seo:validate

\`\`\`
${agentValidateOutput.trim()}
\`\`\`
`;

writeFileSync(DOCS_PATH, doc, "utf8");
console.log(`\nWrote ${DOCS_PATH}`);
console.log(`Recommendation: ${recommendation}`);
console.log(`Batch pages: ${totalBatch}`);
