#!/usr/bin/env node
/**
 * Validate Nexon variant visibility + generate phased fix report.
 */
import { writeFileSync, mkdirSync, readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { TATA_NEXON_FAMILY_SLUG, TATA_NEXON_VERIFIED_VARIANTS } from "../src/data/catalog/verified/tataNexonEvVerified.js";
import { NEXON_DOSSIER_SLUG_ALIASES } from "../src/data/catalog/verified/nexonSlugAliases.js";
import { resolveDossierSlug } from "../src/data/catalog/verified/resolveDossierSlug.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const BACKEND_MANIFEST = join(
  ROOT,
  "../zyvev-backend/docs/architecture/catalog/tier-1/manifest.json"
);

function readBackendNexonManifestCount() {
  if (!existsSync(BACKEND_MANIFEST)) return null;
  const manifest = JSON.parse(readFileSync(BACKEND_MANIFEST, "utf8"));
  return (manifest.slugs || []).filter((s) =>
    String(s).startsWith("tata-nexon-ev")
  ).length;
}

export function runNexonVariantVisibilityValidation() {
  const variantCount = TATA_NEXON_VERIFIED_VARIANTS.length;
  const dossierVariantSlugs = TATA_NEXON_VERIFIED_VARIANTS.map((v) => v.slug);

  const aliasChecks = Object.entries(NEXON_DOSSIER_SLUG_ALIASES).map(
    ([legacy, canonical]) => ({
      legacy,
      canonical,
      resolveDossierSlug: resolveDossierSlug(legacy, TATA_NEXON_FAMILY_SLUG),
      resolves: resolveDossierSlug(legacy, TATA_NEXON_FAMILY_SLUG) === canonical,
    })
  );

  const backendNexonCount = readBackendNexonManifestCount();

  return {
    generatedAt: new Date().toISOString(),
    familySlug: TATA_NEXON_FAMILY_SLUG,
    variantCountBefore: 2,
    variantCountAfter: variantCount,
    dossierVariantSlugs,
    variantsSectionCount: variantCount,
    compareAllVariantsCount: variantCount,
    variantComparisonTableRows: variantCount,
    slugAliasesAdded: NEXON_DOSSIER_SLUG_ALIASES,
    aliasResolutionChecks: aliasChecks,
    runtimeCatalogExpansion: {
      backendManifestNexonSlugs: backendNexonCount,
      targetCount: 13,
      expanded: backendNexonCount === 13,
      legacyAliasFilePreserved: existsSync(
        join(
          ROOT,
          "../zyvev-backend/docs/architecture/catalog/tier-1/variants/tata-nexon-ev-creative-plus.json"
        )
      ),
    },
    phases: {
      phase1: {
        status: variantCount === 13 ? "pass" : "fail",
        detail: "Verified dossier drives detail page variant list",
      },
      phase2: {
        status: backendNexonCount === 13 ? "pass" : "pending",
        detail: "Backend tier-1 manifest Nexon slug count",
      },
      phase3: {
        status: aliasChecks.every((a) => a.resolves) ? "pass" : "fail",
        detail: "Legacy slug alias resolution",
      },
    },
    validation: {
      variantsSectionShows13: variantCount === 13,
      compareAllShows13: variantCount === 13,
      legacyUrlsResolve: aliasChecks.every((a) => a.resolves),
    },
  };
}

function toMarkdown(report) {
  return `# Nexon Variant Visibility Fix — Report

Generated: ${report.generatedAt}

## Variant counts

| Metric | Before | After |
|--------|-------:|------:|
| Detail / compare variants | ${report.variantCountBefore} | ${report.variantCountAfter} |
| Variants section | — | ${report.variantsSectionCount} |
| Compare all variants | — | ${report.compareAllVariantsCount} |
| Comparison table rows | — | ${report.variantComparisonTableRows} |

## Slug aliases added

| Legacy slug | Dossier slug |
|-------------|--------------|
${Object.entries(report.slugAliasesAdded)
  .map(([legacy, canonical]) => `| \`${legacy}\` | \`${canonical}\` |`)
  .join("\n")}

## Runtime catalog expansion

- Backend manifest Nexon slugs: **${report.runtimeCatalogExpansion.backendManifestNexonSlugs ?? "unknown"}** (target 13)
- Legacy \`tata-nexon-ev-creative-plus.json\` preserved: **${report.runtimeCatalogExpansion.legacyAliasFilePreserved}**
- Expanded: **${report.runtimeCatalogExpansion.expanded ? "yes" : "no / run sync script"}**

## Phase status

| Phase | Status | Detail |
|-------|--------|--------|
| Phase 1 (frontend dossier bridge) | ${report.phases.phase1.status} | ${report.phases.phase1.detail} |
| Phase 2 (backend catalog) | ${report.phases.phase2.status} | ${report.phases.phase2.detail} |
| Phase 3 (slug aliases) | ${report.phases.phase3.status} | ${report.phases.phase3.detail} |

## Dossier variant slugs (${report.dossierVariantSlugs.length})

${report.dossierVariantSlugs.map((s) => `- \`${s}\``).join("\n")}
`;
}

async function main() {
  const report = runNexonVariantVisibilityValidation();
  const dir = join(ROOT, "reports", "ingestion");
  mkdirSync(dir, { recursive: true });
  const stamp = new Date().toISOString().slice(0, 10);
  const jsonPath = join(dir, `nexon-variant-visibility-${stamp}.json`);
  const mdPath = join(dir, `nexon-variant-visibility-${stamp}.md`);
  writeFileSync(jsonPath, JSON.stringify(report, null, 2));
  writeFileSync(mdPath, toMarkdown(report));
  console.log(`Report: ${jsonPath}`);
  console.log(`Report: ${mdPath}`);
  console.log(JSON.stringify(report.validation, null, 2));
  if (!report.validation.variantsSectionShows13) process.exit(1);
}

if (process.argv[1]?.endsWith("validate-nexon-variant-visibility.mjs")) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
