/**
 * Phase 7A audit — verify rollback dependencies removed from runtime/tooling.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { readJson, PUBLIC_MANIFEST } from "./lib/goldenCatalogPaths.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const REPORT_MD = path.join(
  REPO_ROOT,
  "docs/catalog/catalog-phase7a-pre-retirement.md"
);
const REPORT_JSON = path.join(
  REPO_ROOT,
  "docs/catalog/catalog-phase7a-pre-retirement.json"
);

const RUNTIME_ROOT = path.join(REPO_ROOT, "src");
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
    if (rel.startsWith("src/data/catalog/verified/tata")) continue;
    if (rel === "src/backend/catalog/tier1CatalogDefinitions.js") continue;

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

function scanToolingImports() {
  const scriptsDir = path.join(REPO_ROOT, "scripts");
  const files = walkFiles(scriptsDir);
  const tier1Manual = [];
  const manualDossier = [];

  for (const filePath of files) {
    const rel = path.relative(REPO_ROOT, filePath).replace(/\\/g, "/");
    if (
      rel.includes("catalog-phase") ||
      rel.includes("ingest-") ||
      rel.includes("sync-") ||
      rel.includes("validate-verified") ||
      rel.includes("validate-nexon")
    ) {
      continue;
    }

    const content = fs.readFileSync(filePath, "utf8");
    if (content.includes("tier1CatalogDefinitions")) {
      tier1Manual.push(rel);
    }
    for (const pattern of MANUAL_DOSSIER_PATTERNS) {
      if (content.includes(pattern)) {
        manualDossier.push({ file: rel, pattern });
      }
    }
  }

  return { tier1Manual, manualDossier };
}

function writeReports(report) {
  fs.mkdirSync(path.dirname(REPORT_MD), { recursive: true });

  const md = `# Catalog Phase 7A — Pre-Retirement Audit

Generated: ${report.generatedAt}

## Summary

| Metric | Value |
|--------|-------|
| Vehicles audited | ${report.vehiclesAudited} |
| Runtime manual dossier imports | ${report.runtimeManualDossierImportCount} |
| Runtime tier1CatalogDefinitions imports | ${report.runtimeTier1ManualImportCount} |
| Fallback execution sites | ${report.fallbackCount} |
| Generated verified dossier coverage | ${report.generatedVerifiedCount} |
| Generated tier1 coverage | ${report.generatedTier1Count} |

## Runtime cutover status

${report.runtimeManualDossierImportCount === 0 && report.runtimeTier1ManualImportCount === 0 && report.fallbackCount === 0 ? "Runtime no longer imports manual dossiers or tier1CatalogDefinitions; no fallback execution detected." : "Issues remain — see JSON report."}

## Overlay migration

Overlays now sourced from \`src/data/catalog/generated/overlays/\` (generated dossiers + slug aliases).

## Tooling migration

Migrated to generated tier1: \`backend-compare-validate.mjs\`, \`backend-catalog-ops-smoke.mjs\`, \`loadCatalogForAudit.mjs\`, \`mediaAuditV1.mjs\`, \`backend-seed-tier1.mjs\`.

## Remaining manual references (allowed — files kept on disk)

${report.remainingManualReferences.map((row) => `- \`${row}\``).join("\n") || "None in runtime."}

## Commands

\`\`\`bash
npm run catalog:phase7a-audit
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
  const toolingScan = scanToolingImports();

  const report = {
    phase: "catalog-phase7a-pre-retirement",
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
    toolingTier1ManualImports: toolingScan.tier1Manual,
    toolingManualDossierImports: toolingScan.manualDossier,
    remainingManualReferences: [
      "src/data/catalog/verified/tataNexonEvVerified.js (on disk, not runtime)",
      "src/data/catalog/verified/tataPunchEvVerified.js (on disk, not runtime)",
      "src/data/catalog/verified/tataTiagoEvVerified.js (on disk, not runtime)",
      "src/backend/catalog/tier1CatalogDefinitions.js (on disk, not runtime)",
    ],
    migrations: [
      "applyVerifiedCatalogOverlay.js → generated/overlays",
      "resolveDossierSlug.js → generated/overlays/familySlugs.js",
      "buildVerifiedDossierVariants.js → generated dossiers only",
      "backend-seed-tier1.mjs → generated tier1 only",
    ],
    notes: [
      "Manual files retained for Phase 7B retirement.",
      "Slug alias modules remain active (not manual dossier data files).",
    ],
  };

  writeReports(report);

  console.log(`Phase 7A audit: runtime dossier imports=${report.runtimeManualDossierImportCount}`);
  console.log(`Runtime tier1 manual imports=${report.runtimeTier1ManualImportCount}`);
  console.log(`Fallback count=${report.fallbackCount}`);
  console.log(`Vehicles=${report.vehiclesAudited}`);
  console.log(`Reports → ${path.relative(REPO_ROOT, REPORT_MD)}`);

  if (
    report.runtimeManualDossierImportCount > 0 ||
    report.runtimeTier1ManualImportCount > 0 ||
    report.fallbackCount > 0
  ) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
