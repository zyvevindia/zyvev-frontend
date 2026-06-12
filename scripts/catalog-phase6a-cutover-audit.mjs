/**
 * Phase 6A audit — generated runtime cutover vs manual rollback paths.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { readJson, PUBLIC_MANIFEST } from "./lib/goldenCatalogPaths.mjs";
import {
  goldenDossierToVerifiedModule,
  goldenMediaToFamilyMedia,
} from "./lib/goldenToVerifiedDossier.mjs";
import { goldenDossierToTier1Definition } from "./lib/goldenToTier1Definition.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const REPORT_MD = path.join(REPO_ROOT, "docs/catalog/catalog-phase6a-cutover.md");
const REPORT_JSON = path.join(
  REPO_ROOT,
  "docs/catalog/catalog-phase6a-cutover.json"
);

const COMPARED_FIELDS = [
  "variantCount",
  "battery",
  "range",
  "charging",
  "power",
  "torque",
  "media",
  "pricing",
];

const MANUAL_VERIFIED_SLUGS = new Set([
  "tata-nexon-ev",
  "tata-punch-ev",
  "tata-tiago-ev",
]);

const MANUAL_TIER1_ALIGNED = new Set([
  "tata-nexon-ev",
  "tata-punch-ev",
  "tata-tiago-ev",
  "tata-curvv-ev",
]);

const MANUAL_DOSSIER_IMPORTS = {
  "tata-nexon-ev": "../src/data/catalog/verified/tataNexonEvVerified.js",
  "tata-punch-ev": "../src/data/catalog/verified/tataPunchEvVerified.js",
  "tata-tiago-ev": "../src/data/catalog/verified/tataTiagoEvVerified.js",
};

const MANUAL_VARIANT_EXPORTS = {
  "tata-nexon-ev": "TATA_NEXON_VERIFIED_VARIANTS",
  "tata-punch-ev": "TATA_PUNCH_VERIFIED_VARIANTS",
  "tata-tiago-ev": "TATA_TIAGO_VERIFIED_VARIANTS",
};

function mediaPresence(definition = {}) {
  const media = definition.mediaMeta || definition.media || {};
  return {
    hasHero: Boolean(definition.heroImage || media.heroImage),
    hasListing: Boolean(definition.listingThumbnail || media.listingImage),
    hasCompare: Boolean(definition.compareThumbnail || media.compareImage),
  };
}

function variantHasGoldenPower(goldenVariantRow, fields = {}) {
  return (
    goldenVariantRow?.powerPs != null ||
    goldenVariantRow?.powerKw != null ||
    goldenVariantRow?.powerBhp != null ||
    fields?.powerPs != null ||
    fields?.powerKw != null
  );
}

function compareVerifiedVariants(
  generatedVariants,
  manualVariants,
  familySlug,
  goldenRaw = {}
) {
  const mismatches = [];

  if (generatedVariants.length !== manualVariants.length) {
    mismatches.push({
      field: "variantCount",
      familySlug,
      generated: generatedVariants.length,
      manual: manualVariants.length,
    });
  }

  const manualBySlug = new Map(manualVariants.map((variant) => [variant.slug, variant]));
  const goldenBySlug = new Map(
    (goldenRaw.variants || []).map((row) => {
      const variantSlug = row.variantName
        ?.toLowerCase()
        .replace(/\+/g, " plus ")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      return [row.slug || `${familySlug}-${variantSlug}`, row];
    })
  );

  for (const generated of generatedVariants) {
    const manual = manualBySlug.get(generated.slug);
    const goldenVariant = goldenBySlug.get(generated.slug);
    if (!manual) {
      mismatches.push({
        field: "variant.slug",
        familySlug,
        slug: generated.slug,
        issue: "missing in manual runtime",
      });
      continue;
    }

    if (generated.priceInr !== manual.priceInr) {
      mismatches.push({
        field: "pricing",
        familySlug,
        slug: generated.slug,
        generated: generated.priceInr,
        manual: manual.priceInr,
      });
    }

    if (generated.rangeKmClaimed !== manual.rangeKmClaimed) {
      mismatches.push({
        field: "range",
        familySlug,
        slug: generated.slug,
        generated: generated.rangeKmClaimed,
        manual: manual.rangeKmClaimed,
      });
    }

    if (generated.batteryKwh !== manual.batteryKwh) {
      mismatches.push({
        field: "battery",
        familySlug,
        slug: generated.slug,
        generated: generated.batteryKwh,
        manual: manual.batteryKwh,
      });
    }

    if (generated.charging?.acKw !== manual.charging?.acKw) {
      mismatches.push({
        field: "charging",
        familySlug,
        slug: generated.slug,
        generated: generated.charging?.acKw,
        manual: manual.charging?.acKw,
      });
    }

    if (generated.charging?.dcKw !== manual.charging?.dcKw) {
      mismatches.push({
        field: "charging",
        familySlug,
        slug: generated.slug,
        generated: generated.charging?.dcKw,
        manual: manual.charging?.dcKw,
      });
    }

    if (
      goldenVariant &&
      variantHasGoldenPower(goldenVariant, goldenRaw.fields) &&
      generated.powerKw != null &&
      manual.powerKw != null &&
      Math.abs(generated.powerKw - manual.powerKw) > 0.2
    ) {
      mismatches.push({
        field: "power",
        familySlug,
        slug: generated.slug,
        generated: generated.powerKw,
        manual: manual.powerKw,
      });
    }

    if (
      generated.torqueNm != null &&
      manual.torqueNm != null &&
      generated.torqueNm !== manual.torqueNm
    ) {
      mismatches.push({
        field: "torque",
        familySlug,
        slug: generated.slug,
        generated: generated.torqueNm,
        manual: manual.torqueNm,
      });
    }
  }

  return mismatches;
}

function compareGeneratedVerifiedToGolden(generatedDossier, goldenRaw, familySlug) {
  const expected = goldenDossierToVerifiedModule(goldenRaw);
  const mismatches = compareVerifiedVariants(
    generatedDossier.variants || [],
    expected.variants || [],
    familySlug,
    goldenRaw
  );

  const canonicalMedia = mediaPresence({ media: expected.familyMedia });
  const generatedMedia = mediaPresence({ media: generatedDossier.media });
  for (const key of ["hasHero", "hasListing", "hasCompare"]) {
    if (canonicalMedia[key] !== generatedMedia[key]) {
      mismatches.push({
        field: `media.${key}`,
        familySlug,
        subsystem: "verified-golden-fidelity",
        generated: generatedMedia[key],
        golden: canonicalMedia[key],
      });
    }
  }

  return mismatches;
}

function compareGeneratedTier1ToGolden(generatedTier1, goldenRaw, familySlug) {
  const expected = goldenDossierToTier1Definition(goldenRaw);
  const mismatches = [];

  if ((generatedTier1.variants || []).length !== (expected.variants || []).length) {
    mismatches.push({
      field: "variantCount",
      familySlug,
      subsystem: "tier1-golden-fidelity",
      generated: generatedTier1.variants?.length,
      golden: expected.variants?.length,
    });
  }

  const expectedBySlug = new Map(
    (expected.variants || []).map((variant) => [variant.slug, variant])
  );

  for (const variant of generatedTier1.variants || []) {
    const exp = expectedBySlug.get(variant.slug);
    if (!exp) continue;

    for (const field of ["priceInr", "rangeKmClaimed", "batteryKwh"]) {
      if (variant[field] !== exp[field]) {
        mismatches.push({
          field,
          familySlug,
          slug: variant.slug,
          subsystem: "tier1-golden-fidelity",
          generated: variant[field],
          golden: exp[field],
        });
      }
    }
  }

  const canonicalMedia = mediaPresence({
    mediaMeta: goldenMediaToFamilyMedia(goldenRaw.media || {}),
    heroImage: goldenMediaToFamilyMedia(goldenRaw.media || {}).heroImage,
    listingThumbnail: goldenMediaToFamilyMedia(goldenRaw.media || {}).listingImage,
    compareThumbnail: goldenMediaToFamilyMedia(goldenRaw.media || {}).compareImage,
  });
  const generatedMedia = mediaPresence(generatedTier1);
  for (const key of ["hasHero", "hasListing", "hasCompare"]) {
    if (canonicalMedia[key] !== generatedMedia[key]) {
      mismatches.push({
        field: `media.${key}`,
        familySlug,
        subsystem: "tier1-golden-fidelity",
        generated: generatedMedia[key],
        golden: canonicalMedia[key],
      });
    }
  }

  return mismatches;
}

function compareTier1Variants(generated, manual, familySlug) {
  const mismatches = [];
  const generatedBySlug = new Map(
    (generated.variants || []).map((variant) => [variant.slug, variant])
  );

  if ((generated.variants || []).length !== (manual.variants || []).length) {
    mismatches.push({
      field: "variantCount",
      familySlug,
      generated: generated.variants?.length,
      manual: manual.variants?.length,
    });
  }

  for (const manualVariant of manual.variants || []) {
    const generatedVariant = generatedBySlug.get(manualVariant.slug);
    if (!generatedVariant) {
      mismatches.push({
        field: "variant.slug",
        familySlug,
        slug: manualVariant.slug,
        issue: "missing in generated tier1",
      });
      continue;
    }

    if (manualVariant.priceInr !== generatedVariant.priceInr) {
      mismatches.push({
        field: "pricing",
        familySlug,
        slug: manualVariant.slug,
        manual: manualVariant.priceInr,
        generated: generatedVariant.priceInr,
      });
    }

    if (manualVariant.rangeKmClaimed !== generatedVariant.rangeKmClaimed) {
      mismatches.push({
        field: "range",
        familySlug,
        slug: manualVariant.slug,
        manual: manualVariant.rangeKmClaimed,
        generated: generatedVariant.rangeKmClaimed,
      });
    }

    if (manualVariant.batteryKwh !== generatedVariant.batteryKwh) {
      mismatches.push({
        field: "battery",
        familySlug,
        slug: manualVariant.slug,
        manual: manualVariant.batteryKwh,
        generated: generatedVariant.batteryKwh,
      });
    }

    const manualDc =
      manualVariant.compareSpecs?.dcChargingKw ||
      manualVariant.chargingMeta?.dcKw ||
      manual.chargingMeta?.dcKw;
    const generatedDc =
      generatedVariant.compareSpecs?.dcChargingKw ||
      generatedVariant.chargingMeta?.dcKw ||
      generated.chargingMeta?.dcKw;

    if (manualDc != null && generatedDc != null && manualDc !== generatedDc) {
      mismatches.push({
        field: "charging",
        familySlug,
        slug: manualVariant.slug,
        manual: manualDc,
        generated: generatedDc,
      });
    }

    if (
      manualVariant.powerKw != null &&
      generatedVariant.powerKw != null &&
      Math.abs(manualVariant.powerKw - generatedVariant.powerKw) > 0.2
    ) {
      mismatches.push({
        field: "power",
        familySlug,
        slug: manualVariant.slug,
        manual: manualVariant.powerKw,
        generated: generatedVariant.powerKw,
      });
    }

    if (
      manualVariant.torqueNm != null &&
      generatedVariant.torqueNm != null &&
      manualVariant.torqueNm !== generatedVariant.torqueNm
    ) {
      mismatches.push({
        field: "torque",
        familySlug,
        slug: manualVariant.slug,
        manual: manualVariant.torqueNm,
        generated: generatedVariant.torqueNm,
      });
    }
  }

  const genMedia = mediaPresence(generated);
  const manMedia = mediaPresence(manual);
  for (const key of ["hasHero", "hasListing", "hasCompare"]) {
    if (genMedia[key] !== manMedia[key]) {
      mismatches.push({
        field: `media.${key}`,
        familySlug,
        generated: genMedia[key],
        manual: manMedia[key],
      });
    }
  }

  return mismatches;
}

async function loadManualVerifiedVariants(familySlug) {
  const importPath = MANUAL_DOSSIER_IMPORTS[familySlug];
  if (!importPath) return null;
  const absPath = path.resolve(REPO_ROOT, importPath.replace(/^\.\.\//, ""));
  if (!fs.existsSync(absPath)) return null;
  const mod = await import(importPath);
  return mod[MANUAL_VARIANT_EXPORTS[familySlug]] || null;
}

function writeReports(report) {
  fs.mkdirSync(path.dirname(REPORT_MD), { recursive: true });

  const md = `# Catalog Phase 6A — Runtime Cutover

Generated: ${report.generatedAt}

## Summary

| Metric | Value |
|--------|-------|
| Vehicles audited | ${report.vehiclesAudited} |
| Generated verified dossier usage | ${report.generatedVerifiedUsage} |
| Generated tier1 usage | ${report.generatedTier1Usage} |
| Manual fallback count | ${report.manualFallbackCount} |
| Mismatch count | ${report.mismatchCount} |
| Manual runtime drift (documented) | ${report.manualRuntimeDriftCount} |

## Fields compared

${report.fieldsCompared.map((field) => `- \`${field}\``).join("\n")}

## Runtime consumers switched

${report.runtimeConsumers.map((row) => `- **${row.id}**: ${row.change}`).join("\n")}

## Rollback preserved

${report.rollbackPreserved.map((row) => `- \`${row}\``).join("\n")}

## Fleet audit

${report.mismatchCount === 0 ? "Generated runtime matches golden canonical (0 mismatches)." : "Golden fidelity mismatches detected — see JSON report."}

Manual-vs-generated drift is documented separately and does not fail the cutover audit.

## Commands

\`\`\`bash
npm run catalog:phase6a-audit
npm run catalog:generate-verified
npm run catalog:generate-tier1
\`\`\`
`;

  fs.writeFileSync(REPORT_MD, md, "utf8");
  fs.writeFileSync(REPORT_JSON, `${JSON.stringify(report, null, 2)}\n`, "utf8");
}

async function main() {
  const manifest = readJson(PUBLIC_MANIFEST);
  const {
    hasGeneratedVerifiedDossier,
    loadGeneratedVerifiedDossier,
    listGeneratedVerifiedDossierSlugs,
  } = await import("../src/data/catalog/generated/index.js");
  const {
    hasGeneratedTier1Definition,
    loadGeneratedTier1Definition,
    listGeneratedTier1DefinitionSlugs,
  } = await import("../src/backend/catalog/generated/index.js");
  const tier1ManualPath = path.join(
    REPO_ROOT,
    "src/backend/catalog/tier1CatalogDefinitions.js"
  );
  const manualTier1BySlug = new Map();
  if (fs.existsSync(tier1ManualPath)) {
    const { TIER1_CATALOG_DEFINITIONS } = await import(
      "../src/backend/catalog/tier1CatalogDefinitions.js"
    );
    for (const definition of TIER1_CATALOG_DEFINITIONS) {
      manualTier1BySlug.set(definition.slug, definition);
    }
  }

  const vehicleAudits = [];
  const mismatches = [];
  const manualRuntimeDrift = [];
  let generatedVerifiedUsage = 0;
  let generatedTier1Usage = 0;
  let manualFallbackCount = 0;

  for (const entry of manifest.vehicles || []) {
    const familySlug = entry.familySlug || entry.id;
    const audit = {
      familySlug,
      verifiedDossier: {
        hasGenerated: hasGeneratedVerifiedDossier(familySlug),
        runtimeSource: null,
        manualComparable: MANUAL_VERIFIED_SLUGS.has(familySlug),
      },
      tier1: {
        hasGenerated: hasGeneratedTier1Definition(familySlug),
        runtimeSource: null,
        manualComparable: manualTier1BySlug.has(familySlug),
        manualAligned: MANUAL_TIER1_ALIGNED.has(familySlug),
      },
      goldenFidelityMismatches: [],
      manualRuntimeDrift: [],
    };

    if (hasGeneratedVerifiedDossier(familySlug)) {
      audit.verifiedDossier.runtimeSource = "generated";
      generatedVerifiedUsage += 1;
    } else if (MANUAL_VERIFIED_SLUGS.has(familySlug)) {
      audit.verifiedDossier.runtimeSource = "manual-fallback";
      manualFallbackCount += 1;
    }

    if (hasGeneratedTier1Definition(familySlug)) {
      audit.tier1.runtimeSource = "generated";
      generatedTier1Usage += 1;
    } else if (manualTier1BySlug.has(familySlug)) {
      audit.tier1.runtimeSource = "manual-fallback";
      manualFallbackCount += 1;
    }

    const goldenRaw = readJson(
      path.join(
        REPO_ROOT,
        `public/catalog/golden-dataset/vehicles/${familySlug}.json`
      )
    );

    const generatedDossier = loadGeneratedVerifiedDossier(familySlug);
    if (generatedDossier) {
      const goldenFidelity = compareGeneratedVerifiedToGolden(
        generatedDossier,
        goldenRaw,
        familySlug
      );
      audit.goldenFidelityMismatches.push(...goldenFidelity);
      mismatches.push(...goldenFidelity);
    }

    const generatedTier1 = loadGeneratedTier1Definition(familySlug);
    const manualTier1 = manualTier1BySlug.get(familySlug) || null;

    if (generatedTier1) {
      const goldenFidelity = compareGeneratedTier1ToGolden(
        generatedTier1,
        goldenRaw,
        familySlug
      );
      audit.goldenFidelityMismatches.push(...goldenFidelity);
      mismatches.push(...goldenFidelity);
    }

    if (MANUAL_VERIFIED_SLUGS.has(familySlug) && generatedDossier) {
      const manualVariants = await loadManualVerifiedVariants(familySlug);
      if (manualVariants) {
        const drift = compareVerifiedVariants(
          generatedDossier.variants || [],
          manualVariants,
          familySlug,
          goldenRaw
        );
        audit.manualRuntimeDrift.push(...drift);
        manualRuntimeDrift.push(...drift);
      }
    }

    if (generatedTier1 && manualTier1 && MANUAL_TIER1_ALIGNED.has(familySlug)) {
      const drift = compareTier1Variants(generatedTier1, manualTier1, familySlug);
      audit.manualRuntimeDrift.push(...drift);
      manualRuntimeDrift.push(...drift);
    } else if (generatedTier1 && manualTier1 && !MANUAL_TIER1_ALIGNED.has(familySlug)) {
      audit.tier1.manualStale = true;
    }

    vehicleAudits.push(audit);
  }

  const report = {
    phase: "catalog-phase6a-cutover",
    generatedAt: new Date().toISOString(),
    vehiclesAudited: vehicleAudits.length,
    generatedVerifiedUsage,
    generatedTier1Usage,
    generatedRuntimeUsage: generatedVerifiedUsage + generatedTier1Usage,
    manualFallbackCount,
    mismatchCount: mismatches.length,
    manualRuntimeDriftCount: manualRuntimeDrift.length,
    manualRuntimeDrift,
    fieldsCompared: COMPARED_FIELDS,
    runtimeConsumers: [
      {
        id: "buildVerifiedDossierVariants.js",
        change:
          "hasVerifiedDossier / buildVerifiedDossierMarketplaceVariants prefer generated dossiers; manual rollback on missing generated.",
      },
      {
        id: "backend-seed-tier1.mjs",
        change:
          "Seeds from src/backend/catalog/generated/index.js first; tier1CatalogDefinitions.js manual fallback.",
      },
      {
        id: "vehicleDetailResolver.js",
        change:
          "Unchanged import surface — consumes buildVerifiedDossierVariants cutover layer.",
      },
    ],
    rollbackPreserved: [
      "src/data/catalog/verified/*",
      "src/backend/catalog/tier1CatalogDefinitions.js",
    ],
    generatedCoverage: {
      verifiedDossierSlugs: listGeneratedVerifiedDossierSlugs(),
      tier1Slugs: listGeneratedTier1DefinitionSlugs(),
    },
    vehicleAudits,
    mismatches,
    notes: [
      "Golden manifest families continue to use goldenCatalogListing authority in vehicleDetailResolver.",
      "Verified dossier cutover applies to non-manifest legacy branch and listing merge path.",
      "Manual tier1 families outside MANUAL_TIER1_ALIGNED are documented as stale, not mismatch failures.",
    ],
  };

  writeReports(report);

  console.log(`Phase 6A audit: ${report.mismatchCount} mismatch(es)`);
  console.log(`Vehicles audited: ${report.vehiclesAudited}`);
  console.log(
    `Generated runtime usage: verified=${report.generatedVerifiedUsage}, tier1=${report.generatedTier1Usage}`
  );
  console.log(`Manual fallback count: ${report.manualFallbackCount}`);
  console.log(`Reports → ${path.relative(REPO_ROOT, REPORT_MD)}`);

  if (report.mismatchCount > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
