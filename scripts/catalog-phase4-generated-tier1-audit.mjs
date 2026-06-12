/**
 * Phase 4 audit — generated tier-1 definitions vs golden + manual tier1 (parallel).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { readJson, PUBLIC_MANIFEST } from "./lib/goldenCatalogPaths.mjs";
import { goldenMediaToFamilyMedia } from "./lib/goldenToVerifiedDossier.mjs";
import {
  goldenDossierToTier1Definition,
} from "./lib/goldenToTier1Definition.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const REPORT_MD = path.join(
  REPO_ROOT,
  "docs/catalog/catalog-phase4-generated-tier1.md"
);
const REPORT_JSON = path.join(
  REPO_ROOT,
  "docs/catalog/catalog-phase4-generated-tier1.json"
);

const COMPARED_FIELDS = [
  "variantCount",
  "pricing",
  "range",
  "battery",
  "charging",
  "power",
  "media",
];

/** Manual tier1 families whose inline/verified data aligns with golden canonical. */
const MANUAL_GOLDEN_ALIGNED = new Set([
  "tata-nexon-ev",
  "tata-punch-ev",
  "tata-tiago-ev",
  "tata-curvv-ev",
]);

const HIDDEN_PRECEDENCE = [
  {
    id: "manual-tier1-catalog-definitions",
    location: "src/backend/catalog/tier1CatalogDefinitions.js",
    consumers: ["backend-seed-tier1.mjs", "catalogSeedUtils.js"],
    phase4Status: "Still used by backend:seed-tier1 — generated modules are parallel only.",
  },
  {
    id: "verified-tier1-builders",
    location:
      "tataNexonEvVerified.js / tataPunchEvVerified.js / tataTiagoEvVerified.js",
    description: "buildTata*Tier1Definition() feeds manual tier1 for 3 Tata families.",
    phase4Status: "Unchanged — generated tier1 derived from golden JSON instead.",
  },
  {
    id: "stale-inline-tier1",
    location: "tier1CatalogDefinitions.js inline objects",
    description:
      "7 non-verified tier1 families have subset/stale specs vs golden (e.g. Kona, MG Comet).",
    phase4Status: "Documented as manualTier1Stale — not generator failures.",
  },
];

function mediaPresence(definition = {}) {
  const media = definition.mediaMeta || {};
  return {
    hasHero: Boolean(definition.heroImage || media.heroImage),
    hasListing: Boolean(definition.listingThumbnail || media.listingImage),
    hasCompare: Boolean(definition.compareThumbnail || media.compareImage),
  };
}

function variantHasGoldenPower(goldenVariantRow, fields) {
  return (
    goldenVariantRow?.powerPs != null ||
    goldenVariantRow?.powerKw != null ||
    fields?.powerPs != null ||
    fields?.powerKw != null
  );
}

function compareGoldenTransform(generated, expected) {
  const mismatches = [];

  if ((generated.variants || []).length !== (expected.variants || []).length) {
    mismatches.push({
      field: "variantCount",
      generated: generated.variants?.length,
      expected: expected.variants?.length,
    });
  }

  const expectedBySlug = new Map(
    (expected.variants || []).map((v) => [v.slug, v])
  );

  for (const variant of generated.variants || []) {
    const exp = expectedBySlug.get(variant.slug);
    if (!exp) {
      mismatches.push({
        field: "variant.slug",
        slug: variant.slug,
        issue: "unexpected generated variant",
      });
      continue;
    }

    for (const field of ["priceInr", "rangeKmClaimed", "batteryKwh"]) {
      if (variant[field] !== exp[field]) {
        mismatches.push({
          field,
          slug: variant.slug,
          generated: variant[field],
          expected: exp[field],
        });
      }
    }

    if (variant.chargingMeta?.acKw !== exp.chargingMeta?.acKw) {
      mismatches.push({
        field: "charging.acKw",
        slug: variant.slug,
        generated: variant.chargingMeta?.acKw,
        expected: exp.chargingMeta?.acKw,
      });
    }
    if (variant.chargingMeta?.dcKw !== exp.chargingMeta?.dcKw) {
      mismatches.push({
        field: "charging.dcKw",
        slug: variant.slug,
        generated: variant.chargingMeta?.dcKw,
        expected: exp.chargingMeta?.dcKw,
      });
    }
  }

  const genMedia = mediaPresence(generated);
  const expMedia = mediaPresence(expected);
  for (const key of ["hasHero", "hasListing", "hasCompare"]) {
    if (genMedia[key] !== expMedia[key]) {
      mismatches.push({
        field: `media.${key}`,
        generated: genMedia[key],
        expected: expMedia[key],
      });
    }
  }

  return mismatches;
}

function compareManualToGenerated(manual, generated, goldenRaw) {
  const mismatches = [];
  const generatedBySlug = new Map(
    (generated.variants || []).map((v) => [v.slug, v])
  );
  const goldenBySlug = new Map(
    (goldenRaw.variants || []).map((v) => [
      v.variantName
        .toLowerCase()
        .replace(/\+/g, " plus ")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, ""),
      v,
    ])
  );

  for (const manualVariant of manual.variants || []) {
    const generatedVariant = generatedBySlug.get(manualVariant.slug);
    if (!generatedVariant) {
      mismatches.push({
        field: "variant.slug",
        slug: manualVariant.slug,
        issue: "missing in generated",
      });
      continue;
    }

    const goldenVariant =
      goldenBySlug.get(manualVariant.slug) ||
      (goldenRaw.variants || []).find(
        (v) => v.variantName === manualVariant.name
      );

    if (manualVariant.priceInr !== generatedVariant.priceInr) {
      mismatches.push({
        field: "pricing",
        slug: manualVariant.slug,
        manual: manualVariant.priceInr,
        generated: generatedVariant.priceInr,
      });
    }
    if (manualVariant.rangeKmClaimed !== generatedVariant.rangeKmClaimed) {
      mismatches.push({
        field: "range",
        slug: manualVariant.slug,
        manual: manualVariant.rangeKmClaimed,
        generated: generatedVariant.rangeKmClaimed,
      });
    }
    if (manualVariant.batteryKwh !== generatedVariant.batteryKwh) {
      mismatches.push({
        field: "battery",
        slug: manualVariant.slug,
        manual: manualVariant.batteryKwh,
        generated: generatedVariant.batteryKwh,
      });
    }

    if (
      goldenVariant &&
      variantHasGoldenPower(goldenVariant, goldenRaw.fields)
    ) {
      if (
        manualVariant.powerKw != null &&
        generatedVariant.powerKw != null &&
        Math.abs(manualVariant.powerKw - generatedVariant.powerKw) > 0.2
      ) {
        mismatches.push({
          field: "power.powerKw",
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
          field: "power.torqueNm",
          slug: manualVariant.slug,
          manual: manualVariant.torqueNm,
          generated: generatedVariant.torqueNm,
        });
      }
    }

    const manualDc =
      manualVariant.compareSpecs?.dcChargingKw ||
      manualVariant.chargingMeta?.dcKw ||
      manual.chargingMeta?.dcKw;
    const generatedDc =
      generatedVariant.compareSpecs?.dcChargingKw ||
      generatedVariant.chargingMeta?.dcKw;
    if (manualDc != null && generatedDc != null && manualDc !== generatedDc) {
      mismatches.push({
        field: "charging.dcKw",
        slug: manualVariant.slug,
        manual: manualDc,
        generated: generatedDc,
      });
    }
  }

  const canonicalMedia = mediaPresence({
    mediaMeta: goldenMediaToFamilyMedia(goldenRaw.media || {}),
    heroImage: goldenMediaToFamilyMedia(goldenRaw.media || {}).heroImage,
    listingThumbnail: goldenMediaToFamilyMedia(goldenRaw.media || {})
      .listingImage,
    compareThumbnail: goldenMediaToFamilyMedia(goldenRaw.media || {})
      .compareImage,
  });
  const generatedMedia = mediaPresence(generated);
  for (const key of ["hasHero", "hasListing", "hasCompare"]) {
    if (canonicalMedia[key] !== generatedMedia[key]) {
      mismatches.push({
        field: `media.${key}`,
        goldenCanonical: canonicalMedia[key],
        generated: generatedMedia[key],
      });
    }
  }

  return mismatches;
}

async function buildReport() {
  const tier1ManualPath = path.join(
    REPO_ROOT,
    "src/backend/catalog/tier1CatalogDefinitions.js"
  );
  const manualBySlug = new Map();
  if (fs.existsSync(tier1ManualPath)) {
    const { TIER1_CATALOG_DEFINITIONS } = await import(
      "../src/backend/catalog/tier1CatalogDefinitions.js"
    );
    for (const definition of TIER1_CATALOG_DEFINITIONS) {
      manualBySlug.set(definition.slug, definition);
    }
  }
  const {
    loadGeneratedTier1Definition,
    listGeneratedTier1DefinitionSlugs,
  } = await import("../src/backend/catalog/generated/index.js");

  const manifest = readJson(PUBLIC_MANIFEST);
  const vehicles = [];
  let totalMismatches = 0;
  let manualStaleCount = 0;

  for (const entry of manifest.vehicles || []) {
    const familySlug = entry.familySlug || entry.id;
    const goldenRaw = readJson(
      path.join(
        REPO_ROOT,
        `public/catalog/golden-dataset/vehicles/${familySlug}.json`
      )
    );
    const generated = loadGeneratedTier1Definition(familySlug);
    const expected = goldenDossierToTier1Definition(goldenRaw);
    const manual = manualBySlug.get(familySlug) || null;

    let mismatches = compareGoldenTransform(generated, expected);
    let comparisonStatus = "generated-only";
    let manualTier1Stale = false;

    if (manual) {
      if (MANUAL_GOLDEN_ALIGNED.has(familySlug)) {
        comparisonStatus = "manual-vs-generated-aligned";
        mismatches.push(...compareManualToGenerated(manual, generated, goldenRaw));
      } else {
        comparisonStatus = "manual-tier1-stale-skipped";
        manualTier1Stale = true;
        manualStaleCount += 1;
      }
    }

    totalMismatches += mismatches.length;

    vehicles.push({
      familySlug,
      displayName: entry.displayName,
      hasManualTier1: Boolean(manual),
      hasGeneratedTier1: Boolean(generated),
      manualVariantCount: manual?.variants?.length ?? 0,
      generatedVariantCount: generated?.variants?.length ?? 0,
      comparisonStatus,
      manualTier1Stale,
      mismatchCount: mismatches.length,
      mismatches,
      generatedSource:
        "public/catalog/golden-dataset/vehicles/" + familySlug + ".json",
    });
  }

  return {
    generatedAt: new Date().toISOString(),
    phase: 4,
    dependencyMap: {
      seedScript: "scripts/backend-seed-tier1.mjs",
      manualDefinitions: "src/backend/catalog/tier1CatalogDefinitions.js",
      generatedOutput: "src/backend/catalog/generated/*.js",
      generatedIndex: "src/backend/catalog/generated/index.js",
      seedFlow: [
        "backend-seed-tier1.mjs",
        "→ tier1CatalogDefinitions.js (manual, unchanged)",
        "→ catalogSeedUtils.seedCatalogVehicle",
        "→ Supabase vehicles / variants / media",
      ],
      targetFlow: [
        "public/catalog/golden-dataset/vehicles/*.json",
        "→ catalog:generate-tier1",
        "→ src/backend/catalog/generated/*.js",
        "→ (future) backend:seed-tier1",
      ],
    },
    summary: {
      generatedDefinitionCount: listGeneratedTier1DefinitionSlugs().length,
      vehiclesCompared: vehicles.length,
      manualTier1Families: manualBySlug.size,
      manualGoldenAlignedFamilies: MANUAL_GOLDEN_ALIGNED.size,
      manualTier1StaleFamilies: manualStaleCount,
      mismatchCount: totalMismatches,
      fieldsCompared: COMPARED_FIELDS,
    },
    hiddenPrecedenceRules: HIDDEN_PRECEDENCE,
    vehicles,
  };
}

function writeMarkdown(report) {
  const lines = [
    "# Catalog Phase 4 — Generated Tier-1 Definitions",
    "",
    `Generated: ${report.generatedAt}`,
    "",
    "## Summary",
    "",
    `- Generated definition modules: **${report.summary.generatedDefinitionCount}**`,
    `- Vehicles audited: **${report.summary.vehiclesCompared}**`,
    `- Manual tier-1 families: **${report.summary.manualTier1Families}**`,
    `- Manual/golden aligned comparisons: **${report.summary.manualGoldenAlignedFamilies}**`,
    `- Stale manual tier-1 (skipped): **${report.summary.manualTier1StaleFamilies}**`,
    `- Mismatch count: **${report.summary.mismatchCount}**`,
    "",
    "## Dependency diagram",
    "",
    "```mermaid",
    "flowchart TD",
    "  GOLD[public/catalog/golden-dataset/vehicles/*.json]",
    "  GEN[catalog:generate-tier1]",
    "  GOUT[src/backend/catalog/generated/*.js]",
    "  MAN[tier1CatalogDefinitions.js manual]",
    "  SEED[backend:seed-tier1.mjs]",
    "  SB[(Supabase)]",
    "  GOLD --> GEN --> GOUT",
    "  MAN --> SEED --> SB",
    "  GOUT -.future.-> SEED",
    "```",
    "",
    "## Per-vehicle audit",
    "",
    "| Family | Manual tier1 | Generated variants | Mismatches | Status |",
    "|--------|--------------|-------------------|------------|--------|",
  ];

  for (const v of report.vehicles) {
    lines.push(
      `| \`${v.familySlug}\` | ${v.hasManualTier1 ? "yes" : "—"} | ${v.generatedVariantCount} | ${v.mismatchCount} | ${v.comparisonStatus} |`
    );
  }

  if (report.summary.mismatchCount > 0) {
    lines.push("", "## Mismatch details", "");
    for (const v of report.vehicles) {
      if (v.mismatchCount === 0) continue;
      lines.push(`### \`${v.familySlug}\` (${v.mismatchCount})`, "");
      for (const m of v.mismatches) lines.push(`- ${JSON.stringify(m)}`);
      lines.push("");
    }
  }

  lines.push("", "## Hidden precedence (documented, not removed)", "");
  for (const rule of report.hiddenPrecedenceRules) {
    lines.push(`### ${rule.id}`, "");
    if (rule.location) lines.push(`- **Location:** \`${rule.location}\``);
    if (rule.consumers) {
      lines.push("- **Consumers:**");
      for (const c of rule.consumers) lines.push(`  - ${c}`);
    }
    if (rule.description) lines.push(`- **Description:** ${rule.description}`);
    lines.push(`- **Phase 4:** ${rule.phase4Status}`);
    lines.push("");
  }

  fs.writeFileSync(REPORT_MD, `${lines.join("\n")}\n`, "utf8");
}

async function main() {
  const report = await buildReport();
  fs.mkdirSync(path.dirname(REPORT_JSON), { recursive: true });
  fs.writeFileSync(REPORT_JSON, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  writeMarkdown(report);

  console.log(`Wrote ${REPORT_MD}`);
  console.log(`Wrote ${REPORT_JSON}`);
  console.log(
    `Generated definitions: ${report.summary.generatedDefinitionCount}`
  );
  console.log(`Vehicles compared: ${report.summary.vehiclesCompared}`);
  console.log(`Mismatches: ${report.summary.mismatchCount}`);

  if (report.summary.mismatchCount > 0) {
    process.exit(1);
  }
}

main();
