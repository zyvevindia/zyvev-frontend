/**
 * Sitemap audit — verifies content-manifest parity with generated XML.
 * Run: npm run seo:sitemap-audit
 */
import "../lib/bootstrapEnv.mjs";

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "../..");
const DOCS_PATH = join(ROOT, "docs", "seo", "sitemap-audit.md");
const SITE_ORIGIN = process.env.VITE_SITE_ORIGIN || "https://evsavari.com";

function loadJson(rel) {
  return JSON.parse(readFileSync(join(ROOT, rel), "utf8"));
}

function parseXmlLocs(xml) {
  const locs = [];
  const re = /<loc>([^<]+)<\/loc>/g;
  let match;
  while ((match = re.exec(xml)) !== null) {
    locs.push(match[1].replace(SITE_ORIGIN, "").replace(/\/$/, "") || "/");
  }
  return locs;
}

function parseXmlUrls(xml) {
  const urls = [];
  const blocks = xml.split("<url>").slice(1);
  for (const block of blocks) {
    const loc = block.match(/<loc>([^<]+)<\/loc>/)?.[1];
    const priority = block.match(/<priority>([^<]+)<\/priority>/)?.[1];
    const lastmod = block.match(/<lastmod>([^<]+)<\/lastmod>/)?.[1];
    if (!loc) continue;
    const path = loc.replace(SITE_ORIGIN, "").replace(/\/$/, "") || "/";
    urls.push({ path, priority: Number(priority), lastmod });
  }
  return urls;
}

function countDuplicates(paths) {
  const seen = new Map();
  for (const p of paths) {
    seen.set(p, (seen.get(p) || 0) + 1);
  }
  return [...seen.entries()].filter(([, n]) => n > 1);
}

console.log("Sitemap audit — regenerating sitemaps…");
execSync("npm run build:sitemaps", { cwd: ROOT, stdio: "inherit" });

const manifest = loadJson("public/seo-data/content-manifest.json");
const manifestPaths = (manifest.entries || []).map((e) => e.path);
const manifestByPath = new Map(
  (manifest.entries || []).map((e) => [e.path, e])
);

const seoPagesXml = readFileSync(
  join(ROOT, "public/sitemaps/seo-pages.xml"),
  "utf8"
);
const compareXml = readFileSync(
  join(ROOT, "public/sitemaps/compare.xml"),
  "utf8"
);
const sitemapManifest = loadJson("public/sitemap-manifest.json");

const seoPaths = parseXmlLocs(seoPagesXml);
const comparePaths = parseXmlLocs(compareXml);
const seoUrlDetails = parseXmlUrls(seoPagesXml);
const compareUrlDetails = parseXmlUrls(compareXml);

const seoSet = new Set(seoPaths);
const compareSet = new Set(comparePaths);
const allIndexed = new Set([...seoPaths, ...comparePaths]);

const missingFromSeoPages = manifestPaths.filter((p) => !seoSet.has(p));
const compareGuides = manifestPaths.filter(
  (p) => manifestByPath.get(p)?.pageType === "compare_guide"
);
const missingFromCompare = compareGuides.filter((p) => !compareSet.has(p));
const manifestNotIndexed = manifestPaths.filter((p) => !allIndexed.has(p));

const seoDupes = countDuplicates(seoPaths);
const compareDupes = countDuplicates(comparePaths);
const crossDupes = manifestPaths.filter((p) => seoSet.has(p) && compareSet.has(p));

const missingLastmodSeo = seoUrlDetails.filter((u) => !u.lastmod);
const missingLastmodCompare = compareUrlDetails.filter((u) => !u.lastmod);

const priorityChecks = [];
for (const entry of manifest.entries || []) {
  const detail = seoUrlDetails.find((u) => u.path === entry.path);
  if (!detail) continue;
  let expected = 0.8;
  if (entry.pageType === "city_evs" || entry.pageType === "city_charging") {
    expected = 0.76;
  } else if (entry.pageType === "brand") {
    expected = 0.78;
  } else if (entry.pageType === "compare_guide") {
    expected = 0.82;
  } else if (entry.pageType === "best_evs") {
    expected = 0.81;
  }
  if (Math.abs(detail.priority - expected) > 0.001) {
    priorityChecks.push({
      path: entry.path,
      expected,
      actual: detail.priority,
    });
  }
}

const pass =
  missingFromSeoPages.length === 0 &&
  missingFromCompare.length === 0 &&
  manifestNotIndexed.length === 0 &&
  seoDupes.length === 0 &&
  compareDupes.length === 0 &&
  missingLastmodSeo.length === 0 &&
  missingLastmodCompare.length === 0 &&
  priorityChecks.length === 0;

const doc = `# EVSavari Sitemap Audit

Generated: ${new Date().toISOString().slice(0, 10)}  
Command: \`npm run seo:sitemap-audit\`

---

## Summary

| Check | Result |
|-------|--------|
| **Overall** | ${pass ? "✅ PASS" : "⚠️ REVIEW"} |
| Manifest batch pages | ${manifestPaths.length} |
| seo-pages.xml URLs | ${seoPaths.length} |
| compare.xml URLs | ${comparePaths.length} |
| sitemap-manifest.json discovery | ${sitemapManifest.counts?.discovery ?? "—"} |
| Total sitemap URLs | ${sitemapManifest.counts?.total ?? "—"} |

---

## Manifest coverage (157 batch pages)

| Metric | Count |
|--------|-------|
| All manifest paths in seo-pages.xml | ${manifestPaths.length - missingFromSeoPages.length}/${manifestPaths.length} |
| Compare guides in compare.xml | ${compareGuides.length - missingFromCompare.length}/${compareGuides.length} |
| Manifest paths missing from all sitemaps | ${manifestNotIndexed.length} |
| Compare guides in both seo-pages + compare | ${crossDupes.length} (expected) |

${
  missingFromSeoPages.length
    ? `### Missing from seo-pages.xml\n\n${missingFromSeoPages.map((p) => `- \`${p}\``).join("\n")}\n`
    : "All manifest paths appear in **seo-pages.xml**.\n"
}

${
  missingFromCompare.length
    ? `### Missing from compare.xml\n\n${missingFromCompare.map((p) => `- \`${p}\``).join("\n")}\n`
    : "All compare_guide manifest entries appear in **compare.xml**.\n"
}

---

## Duplicate detection

| Sitemap | Duplicate loc count |
|---------|---------------------|
| seo-pages.xml | ${seoDupes.length} |
| compare.xml | ${compareDupes.length} |

${
  seoDupes.length
    ? seoDupes.map(([p, n]) => `- \`${p}\` × ${n}`).join("\n")
    : "No duplicate URLs within seo-pages.xml."
}

---

## Priority validation

| Mismatch count | ${priorityChecks.length} |

| pageType | Expected priority |
|----------|-------------------|
| city_evs / city_charging | 0.76 |
| brand | 0.78 |
| best_evs | 0.81 |
| compare_guide | 0.82 |
| default | 0.80 |

${
  priorityChecks.length
    ? priorityChecks
        .slice(0, 10)
        .map((r) => `- \`${r.path}\`: expected ${r.expected}, got ${r.actual}`)
        .join("\n")
    : "All manifest entries in seo-pages.xml use expected priority values."
}

---

## lastmod coverage

| Sitemap | Missing lastmod |
|---------|-----------------|
| seo-pages.xml | ${missingLastmodSeo.length} |
| compare.xml | ${missingLastmodCompare.length} |

Source: \`content-manifest.json\` \`generatedAt\` + per-path map from batch generate.

---

## Sitemap files

| File | URLs | Purpose |
|------|------|---------|
| \`public/sitemap.xml\` | index | Sitemap index |
| \`public/sitemaps/static.xml\` | ${sitemapManifest.counts?.static ?? "—"} | Hub + legal |
| \`public/sitemaps/cars.xml\` | ${sitemapManifest.counts?.vehicles ?? "—"} | Vehicle families |
| \`public/sitemaps/seo-pages.xml\` | ${seoPaths.length} | Discovery guides |
| \`public/sitemaps/compare.xml\` | ${comparePaths.length} | Compare hub + guides |

---

## Commands

\`\`\`bash
npm run content:generate
npm run build:sitemaps
npm run seo:sitemap-audit
npm run gsc:verify
\`\`\`
`;

writeFileSync(DOCS_PATH, doc, "utf8");
console.log(`\nWrote ${DOCS_PATH}`);
console.log(`Audit: ${pass ? "PASS" : "REVIEW REQUIRED"}`);
process.exit(pass ? 0 : 1);
