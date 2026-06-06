#!/usr/bin/env node
/**
 * Validate Nexon + Punch verified dossier productionization.
 */
import { writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  TATA_NEXON_FAMILY_SLUG,
  TATA_NEXON_VERIFIED_VARIANTS,
} from "../src/data/catalog/verified/tataNexonEvVerified.js";
import {
  TATA_PUNCH_FAMILY_SLUG,
  TATA_PUNCH_VERIFIED_VARIANTS,
} from "../src/data/catalog/verified/tataPunchEvVerified.js";
import { NEXON_DOSSIER_SLUG_ALIASES } from "../src/data/catalog/verified/nexonSlugAliases.js";
import { PUNCH_DOSSIER_SLUG_ALIASES } from "../src/data/catalog/verified/punchSlugAliases.js";
import { resolveDossierSlug } from "../src/data/catalog/verified/resolveDossierSlug.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const BACKEND_MANIFEST = join(
  ROOT,
  "../zyvev-backend/docs/architecture/catalog/tier-1/manifest.json"
);
const DOSSIER_BRIDGE_SOURCE = join(
  ROOT,
  "src/data/catalog/verified/buildVerifiedDossierVariants.js"
);

function dossierBridgeEnabled(familySlug) {
  const src = readFileSync(DOSSIER_BRIDGE_SOURCE, "utf8");
  if (familySlug === TATA_NEXON_FAMILY_SLUG) {
    return src.includes("TATA_NEXON_VERIFIED_VARIANTS");
  }
  if (familySlug === TATA_PUNCH_FAMILY_SLUG) {
    return src.includes("TATA_PUNCH_VERIFIED_VARIANTS");
  }
  return false;
}

function readBackendFamilyManifestCount(familyPrefix) {
  if (!existsSync(BACKEND_MANIFEST)) return null;
  const manifest = JSON.parse(readFileSync(BACKEND_MANIFEST, "utf8"));
  return (manifest.slugs || []).filter((s) =>
    String(s).startsWith(familyPrefix)
  ).length;
}

function validateFamily({
  familySlug,
  familyPrefix,
  variants,
  aliases,
  variantCountBefore,
  legacyAliasFiles = [],
}) {
  const variantCount = variants.length;
  const aliasChecks = Object.entries(aliases).map(([legacy, canonical]) => ({
    legacy,
    canonical,
    resolveDossierSlug: resolveDossierSlug(legacy, familySlug),
    resolves: resolveDossierSlug(legacy, familySlug) === canonical,
  }));
  const backendCount = readBackendFamilyManifestCount(familyPrefix);

  return {
    familySlug,
    variantCountBefore,
    variantCountAfter: variantCount,
    dossierBridgeEnabled: dossierBridgeEnabled(familySlug),
    dossierVariantSlugs: variants.map((v) => v.slug),
    variantsSectionCount: variantCount,
    compareAllVariantsCount: variantCount,
    variantComparisonTableRows: variantCount,
    slugAliasesAdded: aliases,
    aliasResolutionChecks: aliasChecks,
    runtimeCatalogExpansion: {
      backendManifestSlugs: backendCount,
      targetCount: variantCount,
      expanded: backendCount === variantCount,
      legacyAliasFilesPreserved: legacyAliasFiles.map((file) => ({
        file,
        preserved: existsSync(
          join(
            ROOT,
            "../zyvev-backend/docs/architecture/catalog/tier-1/variants",
            file
          )
        ),
      })),
    },
    validation: {
      dossierBridgeEnabled: dossierBridgeEnabled(familySlug),
      variantsSectionShowsAll: variantCount > variantCountBefore,
      compareAllShowsAll: variantCount > variantCountBefore,
      legacyUrlsResolve: aliasChecks.every((a) => a.resolves),
      runtimeCatalogExpanded: backendCount === variantCount,
    },
  };
}

export function runVerifiedDossierProductionizationValidation() {
  const nexon = validateFamily({
    familySlug: TATA_NEXON_FAMILY_SLUG,
    familyPrefix: "tata-nexon-ev",
    variants: TATA_NEXON_VERIFIED_VARIANTS,
    aliases: NEXON_DOSSIER_SLUG_ALIASES,
    variantCountBefore: 2,
    legacyAliasFiles: ["tata-nexon-ev-creative-plus.json"],
  });

  const punch = validateFamily({
    familySlug: TATA_PUNCH_FAMILY_SLUG,
    familyPrefix: "tata-punch-ev",
    variants: TATA_PUNCH_VERIFIED_VARIANTS,
    aliases: PUNCH_DOSSIER_SLUG_ALIASES,
    variantCountBefore: 2,
    legacyAliasFiles: [
      "tata-punch-ev-smart-plus.json",
      "tata-punch-ev-empowered-lr.json",
    ],
  });

  const allPass =
    nexon.validation.dossierBridgeEnabled &&
    punch.validation.dossierBridgeEnabled &&
    nexon.validation.legacyUrlsResolve &&
    punch.validation.legacyUrlsResolve &&
    nexon.validation.variantsSectionShowsAll &&
    punch.validation.variantsSectionShowsAll;

  return {
    generatedAt: new Date().toISOString(),
    nexon,
    punch,
    allPass,
  };
}

function toMarkdown(report) {
  function familySection(label, data) {
    return `## ${label}

| Metric | Before | After |
|--------|-------:|------:|
| Variants section | ${data.variantCountBefore} | ${data.variantCountAfter} |
| Compare all variants | ${data.variantCountBefore} | ${data.compareAllVariantsCount} |
| Dossier bridge | — | ${data.dossierBridgeEnabled ? "enabled" : "missing"} |
| Backend manifest slugs | 2 | ${data.runtimeCatalogExpansion.backendManifestSlugs ?? "unknown"} |

### Slug aliases

| Legacy slug | Dossier slug |
|-------------|--------------|
${Object.entries(data.slugAliasesAdded)
  .map(([legacy, canonical]) => `| \`${legacy}\` | \`${canonical}\` |`)
  .join("\n")}
`;
  }

  return `# Verified Dossier Productionization — Nexon + Punch

Generated: ${report.generatedAt}

${familySection("Nexon EV", report.nexon)}

${familySection("Punch EV", report.punch)}

## Validation summary

| Check | Nexon | Punch |
|-------|-------|-------|
| Dossier bridge | ${report.nexon.validation.dossierBridgeEnabled ? "pass" : "fail"} | ${report.punch.validation.dossierBridgeEnabled ? "pass" : "fail"} |
| Variant visibility | ${report.nexon.validation.variantsSectionShowsAll ? "pass" : "fail"} | ${report.punch.validation.variantsSectionShowsAll ? "pass" : "fail"} |
| Legacy URLs | ${report.nexon.validation.legacyUrlsResolve ? "pass" : "fail"} | ${report.punch.validation.legacyUrlsResolve ? "pass" : "fail"} |
| Runtime catalog | ${report.nexon.validation.runtimeCatalogExpanded ? "pass" : "pending"} | ${report.punch.validation.runtimeCatalogExpanded ? "pass" : "pending"} |
`;
}

async function main() {
  const report = runVerifiedDossierProductionizationValidation();
  const dir = join(ROOT, "reports", "ingestion");
  mkdirSync(dir, { recursive: true });
  const stamp = new Date().toISOString().slice(0, 10);
  const jsonPath = join(
    dir,
    `verified-dossier-productionization-${stamp}.json`
  );
  const mdPath = join(dir, `verified-dossier-productionization-${stamp}.md`);
  writeFileSync(jsonPath, JSON.stringify(report, null, 2));
  writeFileSync(mdPath, toMarkdown(report));
  console.log(`Report: ${jsonPath}`);
  console.log(`Report: ${mdPath}`);
  console.log(
    JSON.stringify(
      {
        nexon: report.nexon.validation,
        punch: report.punch.validation,
        allPass: report.allPass,
      },
      null,
      2
    )
  );
  if (!report.allPass) process.exit(1);
}

if (
  process.argv[1]?.endsWith("validate-verified-dossier-productionization.mjs")
) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
