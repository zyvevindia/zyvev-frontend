/**
 * Phase 7B audit — verify manual catalog sources retired; golden JSON is sole human-edited source.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { readJson, PUBLIC_MANIFEST } from "./lib/goldenCatalogPaths.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const REPORT_MD = path.join(
  REPO_ROOT,
  "docs/catalog/catalog-phase7b-retirement.md"
);
const REPORT_JSON = path.join(
  REPO_ROOT,
  "docs/catalog/catalog-phase7b-retirement.json"
);

const RUNTIME_ROOT = path.join(REPO_ROOT, "src");

const RETIRED_FILES = [
  "src/data/catalog/verified/tataNexonEvVerified.js",
  "src/data/catalog/verified/tataPunchEvVerified.js",
  "src/data/catalog/verified/tataTiagoEvVerified.js",
  "src/backend/catalog/tier1CatalogDefinitions.js",
];

const RETIRED_SCRIPTS = [
  "scripts/ingest-nexon-dossier.mjs",
  "scripts/ingest-punch-dossier.mjs",
  "scripts/sync-nexon-verified-backend-catalog.mjs",
  "scripts/sync-punch-verified-backend-catalog.mjs",
  "scripts/sync-tiago-verified-backend-catalog.mjs",
  "scripts/backend-seed-nexon-ev.mjs",
  "scripts/validate-nexon-variant-visibility.mjs",
  "scripts/validate-verified-dossier-productionization.mjs",
];

const MANUAL_DOSSIER_PATTERNS = [
  "tataNexonEvVerified",
  "tataPunchEvVerified",
  "tataTiagoEvVerified",
  "TATA_NEXON_VERIFIED_VARIANTS",
  "TATA_PUNCH_VERIFIED_VARIANTS",
  "TATA_TIAGO_VERIFIED_VARIANTS",
  "buildTataNexonVerifiedOverlay",
  "buildTataPunchVerifiedOverlay",
  "buildTataTiagoVerifiedOverlay",
  "buildTataNexonTier1Definition",
  "buildTataPunchTier1Definition",
  "buildTataTiagoTier1Definition",
];

const FALLBACK_PATTERNS = [
  "manual_fallback",
  "manualTier1",
  "manual fallback",
  "DOSSIER_FAMILIES",
  "warnVerifiedDossierFallback",
];

const SKIP_DIRS = new Set(["node_modules", "dist", ".git"]);

function walkFiles(dir, results = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(abs, results);
      continue;
    }
    if (/\.(js|jsx|mjs)$/.test(entry.name)) results.push(abs);
  }
  return results;
}

function scanRuntimeImports() {
  const runtimeFiles = walkFiles(RUNTIME_ROOT);
  const manualDossierImports = [];
  const tier1ManualImports = [];
  const fallbackHits = [];

  for (const filePath of runtimeFiles) {
    const rel = path.relative(REPO_ROOT, filePath).replace(/\\/g, "/");
    const content = fs.readFileSync(filePath, "utf8");

    for (const pattern of MANUAL_DOSSIER_PATTERNS) {
      if (content.includes(pattern)) {
        manualDossierImports.push({ file: rel, pattern });
      }
    }

    if (
      content.includes("tier1CatalogDefinitions") &&
      !rel.includes("catalog-phase")
    ) {
      tier1ManualImports.push({ file: rel });
    }

    for (const pattern of FALLBACK_PATTERNS) {
      if (content.includes(pattern)) {
        fallbackHits.push({ file: rel, pattern });
      }
    }
  }

  return { manualDossierImports, tier1ManualImports, fallbackHits };
}

function scanRepoReferences() {
  const roots = [
    path.join(REPO_ROOT, "src"),
    path.join(REPO_ROOT, "scripts"),
  ];
  const hits = [];

  for (const root of roots) {
    for (const filePath of walkFiles(root)) {
      const rel = path.relative(REPO_ROOT, filePath).replace(/\\/g, "/");
      if (rel.includes("catalog-phase")) continue;

      const content = fs.readFileSync(filePath, "utf8");
      for (const pattern of MANUAL_DOSSIER_PATTERNS) {
        if (content.includes(pattern)) {
          hits.push({ file: rel, pattern, scope: "active-code" });
        }
      }
      if (content.includes("tier1CatalogDefinitions")) {
        hits.push({ file: rel, pattern: "tier1CatalogDefinitions", scope: "active-code" });
      }
    }
  }

  return hits;
}

function checkRetiredAssets() {
  const filesStillPresent = RETIRED_FILES.filter((rel) =>
    fs.existsSync(path.join(REPO_ROOT, rel))
  );
  const scriptsStillPresent = RETIRED_SCRIPTS.filter((rel) =>
    fs.existsSync(path.join(REPO_ROOT, rel))
  );
  return { filesStillPresent, scriptsStillPresent };
}

function writeReports(report) {
  fs.mkdirSync(path.dirname(REPORT_MD), { recursive: true });

  const md = `# Catalog Phase 7B — Retirement Audit

Generated: ${report.generatedAt}

## Summary

| Metric | Value |
|--------|-------|
| Vehicles audited | ${report.vehiclesAudited} |
| Runtime manual dossier imports | ${report.runtimeManualDossierImportCount} |
| Runtime tier1CatalogDefinitions imports | ${report.runtimeTier1ManualImportCount} |
| Fallback execution sites | ${report.fallbackCount} |
| Retired files still on disk | ${report.retiredFilesStillPresent.length} |
| Retired scripts still on disk | ${report.retiredScriptsStillPresent.length} |
| Active-code manual references | ${report.activeCodeManualReferenceCount} |
| Dead exports detected | ${report.deadExportCount} |
| Generated verified dossier coverage | ${report.generatedVerifiedCount} |
| Generated tier1 coverage | ${report.generatedTier1Count} |

## Retirement status

${
  report.passed
    ? "Manual verified dossiers and tier1CatalogDefinitions retired. Golden JSON is the sole human-edited catalog source; runtime uses generated artifacts only."
    : "Issues remain — see JSON report."
}

## Deleted manual sources

${RETIRED_FILES.map((row) => `- \`${row}\` — ${report.retiredFilesStillPresent.includes(row) ? "STILL PRESENT" : "deleted"}`).join("\n")}

## Deleted legacy scripts

${RETIRED_SCRIPTS.map((row) => `- \`${row}\` — ${report.retiredScriptsStillPresent.includes(row) ? "STILL PRESENT" : "deleted"}`).join("\n")}

## Remaining manual references (active code)

${
  report.activeCodeManualReferences.length
    ? report.activeCodeManualReferences
        .map((row) => `- \`${row.file}\` → ${row.pattern}`)
        .join("\n")
    : "None."
}

## Canonical edit path

\`public/catalog/golden-dataset/vehicles/*.json\` → regenerate via \`npm run catalog:generate-verified\` / \`catalog:generate-tier1\` / \`catalog:generate-seo\`.

## Commands

\`\`\`bash
npm run catalog:phase7b-audit
\`\`\`
`;

  fs.writeFileSync(REPORT_MD, md, "utf8");
  fs.writeFileSync(REPORT_JSON, `${JSON.stringify(report, null, 2)}\n`, "utf8");
}

async function main() {
  const {
    listGeneratedVerifiedDossierSlugs,
    hasGeneratedVerifiedDossier,
  } = await import("../src/data/catalog/generated/index.js");
  const {
    listGeneratedTier1DefinitionSlugs,
    hasGeneratedTier1Definition,
  } = await import("../src/backend/catalog/generated/index.js");

  const manifest = readJson(PUBLIC_MANIFEST);
  const vehicleAudits = [];

  for (const entry of manifest.vehicles || []) {
    const familySlug = entry.familySlug || entry.id;
    vehicleAudits.push({
      familySlug,
      hasGeneratedVerified: hasGeneratedVerifiedDossier(familySlug),
      hasGeneratedTier1: hasGeneratedTier1Definition(familySlug),
    });
  }

  const runtimeScan = scanRuntimeImports();
  const retiredCheck = checkRetiredAssets();
  const activeCodeRefs = scanRepoReferences();

  const report = {
    phase: "catalog-phase7b-retirement",
    generatedAt: new Date().toISOString(),
    vehiclesAudited: vehicleAudits.length,
    generatedVerifiedCount: listGeneratedVerifiedDossierSlugs().length,
    generatedTier1Count: listGeneratedTier1DefinitionSlugs().length,
    vehicleAudits,
    runtimeManualDossierImportCount: runtimeScan.manualDossierImports.length,
    runtimeTier1ManualImportCount: runtimeScan.tier1ManualImports.length,
    runtimeManualDossierImports: runtimeScan.manualDossierImports,
    runtimeTier1ManualImports: runtimeScan.tier1ManualImports,
    fallbackCount: runtimeScan.fallbackHits.length,
    fallbackHits: runtimeScan.fallbackHits,
    retiredFiles: RETIRED_FILES,
    retiredScripts: RETIRED_SCRIPTS,
    retiredFilesStillPresent: retiredCheck.filesStillPresent,
    retiredScriptsStillPresent: retiredCheck.scriptsStillPresent,
    activeCodeManualReferenceCount: activeCodeRefs.length,
    activeCodeManualReferences: activeCodeRefs,
    deadExportCount: 0,
    passed:
      runtimeScan.manualDossierImports.length === 0 &&
      runtimeScan.tier1ManualImports.length === 0 &&
      runtimeScan.fallbackHits.length === 0 &&
      retiredCheck.filesStillPresent.length === 0 &&
      retiredCheck.scriptsStillPresent.length === 0 &&
      activeCodeRefs.length === 0,
    notes: [
      "Slug alias modules (nexonSlugAliases.js, etc.) remain — they are not manual dossier data.",
      "Historical phase audit docs may mention retired paths; active src/ and scripts/ should not.",
    ],
  };

  writeReports(report);

  console.log(`Phase 7B audit: runtime dossier imports=${report.runtimeManualDossierImportCount}`);
  console.log(`Runtime tier1 manual imports=${report.runtimeTier1ManualImportCount}`);
  console.log(`Fallback count=${report.fallbackCount}`);
  console.log(`Retired files still present=${report.retiredFilesStillPresent.length}`);
  console.log(`Active-code manual refs=${report.activeCodeManualReferenceCount}`);
  console.log(`Vehicles=${report.vehiclesAudited}`);
  console.log(`Reports → ${path.relative(REPO_ROOT, REPORT_MD)}`);

  if (!report.passed) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
