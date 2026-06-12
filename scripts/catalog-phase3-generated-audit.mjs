/**
 * Phase 3 audit — compare manual verified dossiers vs generated (parallel run).
 * Writes docs/catalog/catalog-phase3-generated-dossiers.{md,json}
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { readJson, PUBLIC_MANIFEST } from "./lib/goldenCatalogPaths.mjs";
import { goldenMediaToFamilyMedia } from "./lib/goldenToVerifiedDossier.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const REPORT_MD = path.join(
  REPO_ROOT,
  "docs/catalog/catalog-phase3-generated-dossiers.md"
);
const REPORT_JSON = path.join(
  REPO_ROOT,
  "docs/catalog/catalog-phase3-generated-dossiers.json"
);

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

const MANUAL_MEDIA_EXPORTS = {
  "tata-nexon-ev": "TATA_NEXON_FAMILY_MEDIA",
  "tata-punch-ev": "TATA_PUNCH_FAMILY_MEDIA",
  "tata-tiago-ev": "TATA_TIAGO_FAMILY_MEDIA",
};

const COMPARED_FIELDS = [
  "variantCount",
  "pricing",
  "range",
  "battery",
  "charging",
  "power",
  "media",
];

const HIDDEN_PRECEDENCE = [
  {
    id: "manual-verified-dossier-runtime",
    location: "src/data/catalog/verified/buildVerifiedDossierVariants.js",
    consumers: [
      "vehicleDetailResolver.js (legacy branch)",
      "applyVerifiedCatalogOverlay.js",
      "tier1CatalogDefinitions.js",
    ],
    phase3Status: "Still active at runtime — generated dossiers are parallel only.",
  },
  {
    id: "normalize-car-overlay",
    location: "src/utils/normalizeCar.js → applyVerifiedCatalogOverlay",
    description: "Manual overlay applied during normalizeCar for Tata families.",
    phase3Status: "Unchanged — not wired to generated dossiers yet.",
  },
  {
    id: "slug-alias-resolvers",
    location:
      "src/data/catalog/verified/*SlugAliases.js, resolveDossierSlug.js",
    phase3Status: "Manual slug maps remain; generated uses golden slugify rules.",
  },
  {
    id: "golden-runtime-authority",
    location: "vehicleDetailResolver.js + compareGuideCatalog.js",
    phase3Status:
      "Production variant data uses golden JSON directly; verified JS is legacy parallel.",
  },
];

function mediaPresence(media = {}) {
  return {
    hasHero: Boolean(media.heroImage),
    hasListing: Boolean(media.listingImage || media.listingThumbnail),
    hasCompare: Boolean(media.compareImage || media.compareThumbnail),
  };
}

function compareMedia(generatedMedia, goldenMedia) {
  const canonical = goldenMediaToFamilyMedia(goldenMedia || {});
  const canonicalPresence = mediaPresence(canonical);
  const generatedPresence = mediaPresence(generatedMedia);

  const mismatches = [];
  for (const key of ["hasHero", "hasListing", "hasCompare"]) {
    if (canonicalPresence[key] !== generatedPresence[key]) {
      mismatches.push({
        field: `media.${key}`,
        goldenCanonical: canonicalPresence[key],
        generated: generatedPresence[key],
      });
    }
  }
  return mismatches;
}

function manualMediaEnrichmentDelta(manualMedia, goldenMedia) {
  const manual = mediaPresence(manualMedia || {});
  const canonical = mediaPresence(goldenMediaToFamilyMedia(goldenMedia || {}));
  const delta = [];

  for (const key of ["hasHero", "hasListing", "hasCompare"]) {
    if (manual[key] && !canonical[key]) {
      delta.push({ field: `media.${key}`, note: "legacy manual CDN enrichment beyond golden canonical" });
    }
  }

  return delta;
}

function variantHasGoldenPower(goldenVariantRow) {
  return (
    goldenVariantRow?.powerPs != null ||
    goldenVariantRow?.powerKw != null ||
    goldenVariantRow?.powerBhp != null
  );
}

function compareVariants(manualVariants, generatedVariants, goldenVariants = []) {
  const mismatches = [];
  const goldenBySlug = new Map(
    generatedVariants.map((v) => [v.slug, v])
  );
  const goldenRawByName = new Map(
    (goldenVariants || []).map((v) => [v.variantName, v])
  );

  if (manualVariants.length !== generatedVariants.length) {
    mismatches.push({
      field: "variantCount",
      manual: manualVariants.length,
      generated: generatedVariants.length,
    });
  }

  const manualBySlug = new Map(manualVariants.map((v) => [v.slug, v]));

  for (const [slug, manual] of manualBySlug) {
    const generated = goldenBySlug.get(slug);
    if (!generated) {
      mismatches.push({ field: "variant.slug", slug, issue: "missing in generated" });
      continue;
    }

    const goldenRaw =
      goldenRawByName.get(manual.trimLabel || manual.name) || null;

    if (manual.priceInr !== generated.priceInr) {
      mismatches.push({
        field: "pricing",
        slug,
        manual: manual.priceInr,
        generated: generated.priceInr,
      });
    }

    if (manual.rangeKmClaimed !== generated.rangeKmClaimed) {
      mismatches.push({
        field: "range",
        slug,
        manual: manual.rangeKmClaimed,
        generated: generated.rangeKmClaimed,
      });
    }

    if (manual.batteryKwh !== generated.batteryKwh) {
      mismatches.push({
        field: "battery",
        slug,
        manual: manual.batteryKwh,
        generated: generated.batteryKwh,
      });
    }

    const manualAc = manual.charging?.acKw ?? manual.charging?.acKw72;
    const manualDc = manual.charging?.dcKw;
    if (manualAc !== generated.charging?.acKw) {
      mismatches.push({
        field: "charging.acKw",
        slug,
        manual: manualAc,
        generated: generated.charging?.acKw,
      });
    }
    if (manualDc !== generated.charging?.dcKw) {
      mismatches.push({
        field: "charging.dcKw",
        slug,
        manual: manualDc,
        generated: generated.charging?.dcKw,
      });
    }

    if (goldenRaw && variantHasGoldenPower(goldenRaw)) {
      if (
        manual.powerBhp != null &&
        generated.powerBhp != null &&
        manual.powerBhp !== generated.powerBhp
      ) {
        mismatches.push({
          field: "power.powerBhp",
          slug,
          manual: manual.powerBhp,
          generated: generated.powerBhp,
        });
      }
      if (
        manual.powerKw != null &&
        generated.powerKw != null &&
        Math.abs(manual.powerKw - generated.powerKw) > 0.2
      ) {
        mismatches.push({
          field: "power.powerKw",
          slug,
          manual: manual.powerKw,
          generated: generated.powerKw,
        });
      }
    }

    if (manual.torqueNm != null && generated.torqueNm != null) {
      if (manual.torqueNm !== generated.torqueNm) {
        mismatches.push({
          field: "power.torqueNm",
          slug,
          manual: manual.torqueNm,
          generated: generated.torqueNm,
        });
      }
    }
  }

  return mismatches;
}

async function loadManualVariants(familySlug) {
  const importPath = MANUAL_DOSSIER_IMPORTS[familySlug];
  if (!importPath) return { variants: null, media: null };

  const absPath = path.resolve(REPO_ROOT, importPath.replace(/^\.\.\//, ""));
  if (!fs.existsSync(absPath)) return { variants: null, media: null };

  const mod = await import(new URL(importPath, import.meta.url));
  const variantKey = MANUAL_VARIANT_EXPORTS[familySlug];
  const mediaKey = MANUAL_MEDIA_EXPORTS[familySlug];

  return {
    variants: mod[variantKey] || null,
    media: mod[mediaKey] || null,
  };
}

async function buildReport() {
  const { loadGeneratedVerifiedDossier, listGeneratedVerifiedDossierSlugs } =
    await import("../src/data/catalog/generated/index.js");

  const manifest = readJson(PUBLIC_MANIFEST);
  const vehicles = [];
  let totalMismatches = 0;

  for (const entry of manifest.vehicles || []) {
    const familySlug = entry.familySlug || entry.id;
    const generated = loadGeneratedVerifiedDossier(familySlug);
    const goldenRaw = readJson(
      path.join(REPO_ROOT, `public/catalog/golden-dataset/vehicles/${familySlug}.json`)
    );

    const manual = await loadManualVariants(familySlug);
    const hasManual = Boolean(manual.variants);

    let mismatches = [];
    let comparisonStatus = hasManual ? "manual-vs-generated" : "generated-only";

    let mediaEnrichmentDelta = [];

    if (hasManual && generated) {
      mismatches = compareVariants(
        [...manual.variants],
        [...generated.variants],
        goldenRaw.variants || []
      );
      mismatches.push(
        ...compareMedia(generated.media || {}, goldenRaw.media || {})
      );
      mediaEnrichmentDelta = manualMediaEnrichmentDelta(
        manual.media || {},
        goldenRaw.media || {}
      );
    }

    totalMismatches += mismatches.length;

    vehicles.push({
      familySlug,
      displayName: entry.displayName,
      hasManualDossier: hasManual,
      hasGeneratedDossier: Boolean(generated),
      generatedVariantCount: generated?.variants?.length ?? 0,
      manualVariantCount: manual.variants?.length ?? 0,
      comparisonStatus,
      mismatchCount: mismatches.length,
      mismatches,
      mediaEnrichmentDelta,
      generatedSource: "public/catalog/golden-dataset/vehicles/" + familySlug + ".json",
      compareFields: hasManual ? COMPARED_FIELDS : ["generated-from-golden"],
    });
  }

  return {
    generatedAt: new Date().toISOString(),
    phase: 3,
    dependencyMap: {
      manualVerifiedFiles: Object.keys(MANUAL_DOSSIER_IMPORTS),
      generatedOutput: "src/data/catalog/generated/*.js",
      generatedIndex: "src/data/catalog/generated/index.js",
      runtimeConsumers: [
        "buildVerifiedDossierVariants.js → hasVerifiedDossier / buildVerifiedDossierMarketplaceVariants",
        "vehicleDetailResolver.js (legacy verified branch)",
        "applyVerifiedCatalogOverlay.js → normalizeCar",
        "tier1CatalogDefinitions.js → Supabase seed",
        "resolveDossierSlug.js → vehicleRoutes.js",
      ],
      generatedConsumers: [
        "catalog-phase3-generated-audit.mjs (audit only — not wired to runtime yet)",
      ],
    },
    summary: {
      generatedDossierCount: listGeneratedVerifiedDossierSlugs().length,
      vehiclesCompared: vehicles.length,
      manualDossierFamilies: Object.keys(MANUAL_DOSSIER_IMPORTS).length,
      totalMismatchCount: totalMismatches,
      fieldsCompared: COMPARED_FIELDS,
    },
    hiddenPrecedenceRules: HIDDEN_PRECEDENCE,
    vehicles,
  };
}

function writeMarkdown(report) {
  const lines = [
    "# Catalog Phase 3 — Generated Verified Dossiers",
    "",
    `Generated: ${report.generatedAt}`,
    "",
    "## Summary",
    "",
    `- Generated dossier modules: **${report.summary.generatedDossierCount}**`,
    `- Vehicles audited: **${report.summary.vehiclesCompared}**`,
    `- Manual dossier families: **${report.summary.manualDossierFamilies}**`,
    `- Total mismatches: **${report.summary.totalMismatchCount}**`,
    "",
    "## Dependency map",
    "",
    "### Manual verified (runtime, preserved)",
    "",
    ...report.dependencyMap.manualVerifiedFiles.map((f) => `- \`${f}\``),
    "",
    "### Generated output (parallel, not runtime)",
    "",
    `- \`${report.dependencyMap.generatedOutput}\``,
    `- \`${report.dependencyMap.generatedIndex}\``,
    "",
    "### Runtime consumers (unchanged)",
    "",
    ...report.dependencyMap.runtimeConsumers.map((c) => `- ${c}`),
    "",
    "## Per-vehicle comparison",
    "",
    "| Family | Manual | Generated variants | Mismatches | Status |",
    "|--------|--------|-------------------|------------|--------|",
  ];

  for (const v of report.vehicles) {
    lines.push(
      `| \`${v.familySlug}\` | ${v.hasManualDossier ? "yes" : "—"} | ${v.generatedVariantCount} | ${v.mismatchCount} | ${v.comparisonStatus} |`
    );
  }

  if (report.summary.totalMismatchCount > 0) {
    lines.push("", "## Mismatch details", "");
    for (const v of report.vehicles) {
      if (v.mismatchCount === 0) continue;
      lines.push(`### \`${v.familySlug}\` (${v.mismatchCount})`, "");
      for (const m of v.mismatches) {
        lines.push(`- ${JSON.stringify(m)}`);
      }
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
    lines.push(`- **Phase 3:** ${rule.phase3Status}`);
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
  console.log(`Generated dossiers: ${report.summary.generatedDossierCount}`);
  console.log(`Vehicles compared: ${report.summary.vehiclesCompared}`);
  console.log(`Mismatches: ${report.summary.totalMismatchCount}`);

  if (report.summary.totalMismatchCount > 0) {
    process.exit(1);
  }
}

main();
