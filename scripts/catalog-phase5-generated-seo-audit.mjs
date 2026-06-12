/**
 * Phase 5 audit — generated SEO catalog metadata vs golden + existing editorial SEO refs.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  PUBLIC_MANIFEST,
  PUBLIC_VEHICLES,
  readJson,
  readVehicleDossiers,
} from "./lib/goldenCatalogPaths.mjs";
import {
  goldenDossierToSeoCatalogMeta,
} from "./lib/goldenToSeoCatalogMeta.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const SEO_DATA_ROOT = path.join(REPO_ROOT, "public/seo-data");
const SEO_GENERATED_ROOT = path.join(SEO_DATA_ROOT, "generated");
const CONTENT_GENERATED_DIR = path.join(
  REPO_ROOT,
  "src/content/generated/generated"
);
const REPORT_MD = path.join(
  REPO_ROOT,
  "docs/catalog/catalog-phase5-generated-seo.md"
);
const REPORT_JSON = path.join(
  REPO_ROOT,
  "docs/catalog/catalog-phase5-generated-seo.json"
);

const COMPARED_FIELDS = [
  "familySlug",
  "displayName",
  "brand",
  "priceBand",
  "maxRangeKm",
  "variantCount",
];

const DEPENDENCY_DIAGRAM = `Golden JSON (public/catalog/golden-dataset/vehicles/*.json)
        │
        ├─► scripts/generate-content.mjs ──► public/seo-data/*.json (editorial SEO pages)
        │                                 └─► src/content/generated/manifest.js
        │
        └─► scripts/generate-seo-artifacts.mjs (Phase 5 — parallel)
                  │
                  ├─► public/seo-data/generated/vehicles/{slug}.json
                  ├─► public/seo-data/generated/manifest.json
                  └─► src/content/generated/generated/
                        ├─ catalog-vehicles.json
                        └─ index.js

Runtime consumers (unchanged in Phase 5):
  DiscoverySeoPage ──► useDiscoveryPage ──► discoveryLoader ──► fetchSeoPage
  SeoGuidePage ──► useSeoPage ──► fetchSeoPage ──► /seo-data/{slug}.json
  Compare guides ──► DiscoverySeoPage + GENERATED_COMPARE_SLUGS (manifest.js)
  SeoGuidesHub ──► CONTENT_REGISTRY_ENTRIES (manifest.js)
  SeoRelatedLinks ──► seoPage.relatedLinks (inline in SEO JSON)
  ComparePage ──► GENERATED_COMPARE_SLUGS (manifest.js)`;

function normalizeDisplayName(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function normalizeBrand(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function listJsonFiles(dir, { excludeDirs = [] } = {}) {
  const results = [];
  if (!fs.existsSync(dir)) return results;

  const walk = (current) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const abs = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (excludeDirs.includes(entry.name)) continue;
        walk(abs);
      } else if (entry.name.endsWith(".json")) {
        results.push(abs);
      }
    }
  };

  walk(dir);
  return results.sort();
}

function countGeneratedFiles() {
  let count = 0;
  const paths = [];

  const add = (filePath) => {
    if (fs.existsSync(filePath)) {
      count += 1;
      paths.push(path.relative(REPO_ROOT, filePath).replace(/\\/g, "/"));
    }
  };

  add(path.join(SEO_GENERATED_ROOT, "manifest.json"));
  for (const file of listJsonFiles(path.join(SEO_GENERATED_ROOT, "vehicles"))) {
    add(file);
  }
  add(path.join(CONTENT_GENERATED_DIR, "catalog-vehicles.json"));
  add(path.join(CONTENT_GENERATED_DIR, "index.js"));

  return { count, paths };
}

function compareCatalogMeta(generated, expected, context = {}) {
  const mismatches = [];

  if (generated.familySlug !== expected.familySlug) {
    mismatches.push({
      field: "familySlug",
      generated: generated.familySlug,
      expected: expected.familySlug,
      ...context,
    });
  }

  if (normalizeDisplayName(generated.displayName) !== normalizeDisplayName(expected.displayName)) {
    mismatches.push({
      field: "displayName",
      generated: generated.displayName,
      expected: expected.displayName,
      ...context,
    });
  }

  if (normalizeBrand(generated.brand) !== normalizeBrand(expected.brand)) {
    mismatches.push({
      field: "brand",
      generated: generated.brand,
      expected: expected.brand,
      ...context,
    });
  }

  if (generated.variantCount !== expected.variantCount) {
    mismatches.push({
      field: "variantCount",
      generated: generated.variantCount,
      expected: expected.variantCount,
      ...context,
    });
  }

  if (generated.maxRangeKm !== expected.maxRangeKm) {
    mismatches.push({
      field: "maxRangeKm",
      generated: generated.maxRangeKm,
      expected: expected.maxRangeKm,
      ...context,
    });
  }

  const genMin = generated.priceBand?.minInr;
  const expMin = expected.priceBand?.minInr;
  const genMax = generated.priceBand?.maxInr;
  const expMax = expected.priceBand?.maxInr;

  if (genMin !== expMin || genMax !== expMax) {
    mismatches.push({
      field: "priceBand",
      generated: generated.priceBand,
      expected: expected.priceBand,
      ...context,
    });
  }

  return mismatches;
}

function extractRankedVehicleRefs(seoJson, filePath) {
  const refs = [];
  const relFile = path.relative(REPO_ROOT, filePath).replace(/\\/g, "/");

  const collect = (vehicles, section) => {
    if (!Array.isArray(vehicles)) return;
    for (const row of vehicles) {
      if (!row?.slug) continue;
      refs.push({
        file: relFile,
        section,
        slug: String(row.slug).trim().toLowerCase(),
        displayName: row.displayName || null,
        exShowroom: row.exShowroom ?? row.startingPrice ?? null,
        claimedRangeKm: row.claimedRangeKm ?? row.rangeKm ?? null,
        variantCount: row.variantCount ?? null,
        brand: row.brand ?? null,
      });
    }
  };

  if (seoJson?.seoPage) {
    collect(seoJson.seoPage.rankedVehicles, "seoPage.rankedVehicles");
    collect(seoJson.seoPage.compareVehicles, "seoPage.compareVehicles");
  }

  collect(seoJson?.rankedVehicles, "rankedVehicles");

  return refs;
}

function auditExistingSeoReferences(goldenBySlug) {
  const seoFiles = listJsonFiles(SEO_DATA_ROOT, { excludeDirs: ["generated"] });
  const refsBySlug = new Map();
  const staleFindings = [];

  for (const filePath of seoFiles) {
    let seoJson;
    try {
      seoJson = readJson(filePath);
    } catch {
      continue;
    }

    for (const ref of extractRankedVehicleRefs(seoJson, filePath)) {
      const golden = goldenBySlug.get(ref.slug);
      if (!golden) continue;

      if (!refsBySlug.has(ref.slug)) refsBySlug.set(ref.slug, []);
      refsBySlug.get(ref.slug).push(ref);

      const issues = [];

      if (ref.displayName && normalizeDisplayName(ref.displayName) !== normalizeDisplayName(golden.displayName)) {
        issues.push({
          field: "displayName",
          seoValue: ref.displayName,
          goldenValue: golden.displayName,
        });
      }

      if (ref.brand && normalizeBrand(ref.brand) !== normalizeBrand(golden.brand)) {
        issues.push({
          field: "brand",
          seoValue: ref.brand,
          goldenValue: golden.brand,
        });
      }

      if (ref.exShowroom != null && ref.exShowroom !== golden.startingPriceInr) {
        issues.push({
          field: "priceBand.minInr",
          seoValue: ref.exShowroom,
          goldenValue: golden.startingPriceInr,
        });
      }

      if (ref.claimedRangeKm != null && ref.claimedRangeKm !== golden.maxRangeKm) {
        issues.push({
          field: "maxRangeKm",
          seoValue: ref.claimedRangeKm,
          goldenValue: golden.maxRangeKm,
        });
      }

      if (ref.variantCount != null && ref.variantCount !== golden.variantCount) {
        issues.push({
          field: "variantCount",
          seoValue: ref.variantCount,
          goldenValue: golden.variantCount,
        });
      }

      if (issues.length) {
        staleFindings.push({
          file: ref.file,
          slug: ref.slug,
          section: ref.section,
          issues,
        });
      }
    }
  }

  const staleFiles = [...new Set(staleFindings.map((f) => f.file))].sort();

  return { refsBySlug, staleFindings, staleFiles, seoFilesScanned: seoFiles.length };
}

function writeReports(report) {
  fs.mkdirSync(path.dirname(REPORT_MD), { recursive: true });

  const md = `# Catalog Phase 5 — Generated SEO Artifacts

Generated: ${report.generatedAt}

## Summary

| Metric | Value |
|--------|-------|
| Generated file count | ${report.generatedFileCount} |
| Vehicles audited | ${report.vehiclesAudited} |
| Generator mismatch count | ${report.mismatchCount} |
| Stale SEO files discovered | ${report.staleSeoFilesDiscovered} |
| Editorial SEO files scanned | ${report.seoFilesScanned} |

## Fields compared

${report.fieldsCompared.map((f) => `- \`${f}\``).join("\n")}

## Dependency diagram

\`\`\`
${report.dependencyDiagram}
\`\`\`

## Generator fidelity

${report.mismatchCount === 0 ? "All generated artifacts match golden transforms." : "Mismatches detected — see JSON report."}

## Stale editorial SEO references

${report.staleSeoFilesDiscovered === 0 ? "None — factual fields in editorial SEO pages align with golden where present." : `${report.staleSeoFilesDiscovered} file(s) contain catalog facts that differ from golden (documented, not generator failures).`}

${report.staleFiles.length ? report.staleFiles.map((f) => `- \`${f}\``).join("\n") : ""}

## Generated artifact paths

${report.generatedPaths.map((p) => `- \`${p}\``).join("\n")}

## Commands

\`\`\`bash
npm run catalog:generate-seo
npm run catalog:phase5-audit
\`\`\`
`;

  fs.writeFileSync(REPORT_MD, md, "utf8");
  fs.writeFileSync(REPORT_JSON, `${JSON.stringify(report, null, 2)}\n`, "utf8");
}

function main() {
  const generatedAt = new Date().toISOString();
  const manifest = readJson(PUBLIC_MANIFEST);
  const familySlugs = (manifest.vehicles || [])
    .map((v) => v.familySlug || v.id)
    .filter(Boolean)
    .sort();

  const { count: generatedFileCount, paths: generatedPaths } = countGeneratedFiles();

  const generatorMismatches = [];
  const vehicleAudits = [];
  const goldenBySlug = new Map();

  for (const familySlug of familySlugs) {
    const goldenPath = path.join(PUBLIC_VEHICLES, `${familySlug}.json`);
    const generatedPath = path.join(
      SEO_GENERATED_ROOT,
      "vehicles",
      `${familySlug}.json`
    );

    if (!fs.existsSync(goldenPath)) {
      generatorMismatches.push({
        familySlug,
        field: "goldenFile",
        issue: "missing golden dossier",
      });
      continue;
    }

    if (!fs.existsSync(generatedPath)) {
      generatorMismatches.push({
        familySlug,
        field: "generatedFile",
        issue: "missing generated artifact — run catalog:generate-seo",
      });
      continue;
    }

    const dossier = readJson(goldenPath);
    const expected = goldenDossierToSeoCatalogMeta(dossier);
    const artifact = readJson(generatedPath);
    const generated = artifact.catalogMeta;

    goldenBySlug.set(familySlug, expected);

    const mismatches = compareCatalogMeta(generated, expected, {
      familySlug,
      audit: "generator-fidelity",
    });

    generatorMismatches.push(...mismatches);

    vehicleAudits.push({
      familySlug,
      displayName: expected.displayName,
      brand: expected.brand,
      variantCount: expected.variantCount,
      maxRangeKm: expected.maxRangeKm,
      priceBand: expected.priceBand,
      generatorFidelityOk: mismatches.length === 0,
    });
  }

  const {
    refsBySlug,
    staleFindings,
    staleFiles,
    seoFilesScanned,
  } = auditExistingSeoReferences(goldenBySlug);

  for (const audit of vehicleAudits) {
    audit.seoReferenceCount = (refsBySlug.get(audit.familySlug) || []).length;
  }

  const report = {
    phase: "catalog-phase5-generated-seo",
    generatedAt,
    generatedFileCount,
    generatedPaths,
    vehiclesAudited: familySlugs.length,
    fieldsCompared: COMPARED_FIELDS,
    mismatchCount: generatorMismatches.length,
    generatorMismatches,
    vehicleAudits,
    seoFilesScanned,
    staleSeoFilesDiscovered: staleFiles.length,
    staleFiles,
    staleFindings,
    dependencyDiagram: DEPENDENCY_DIAGRAM,
    notes: [
      "Generated artifacts are parallel only — runtime still uses editorial public/seo-data/*.json and manifest.js.",
      "Stale SEO findings are editorial pages with factual drift vs golden; they are not generator failures.",
    ],
  };

  writeReports(report);

  console.log(`Phase 5 SEO audit: ${report.mismatchCount} generator mismatch(es)`);
  console.log(`Vehicles audited: ${report.vehiclesAudited}`);
  console.log(`Generated files: ${report.generatedFileCount}`);
  console.log(`Stale SEO files: ${report.staleSeoFilesDiscovered}`);
  console.log(`Reports → ${path.relative(REPO_ROOT, REPORT_MD)}`);

  if (report.mismatchCount > 0) {
    process.exitCode = 1;
  }
}

main();
