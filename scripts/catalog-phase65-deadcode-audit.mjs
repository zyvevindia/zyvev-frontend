/**
 * Phase 6.5 — dead code & drift audit for manual catalog assets (no deletions).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { readJson, PUBLIC_MANIFEST } from "./lib/goldenCatalogPaths.mjs";
import { goldenMediaToFamilyMedia } from "./lib/goldenToVerifiedDossier.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const REPORT_MD = path.join(REPO_ROOT, "docs/catalog/catalog-phase65-deadcode.md");
const REPORT_JSON = path.join(
  REPO_ROOT,
  "docs/catalog/catalog-phase65-deadcode.json"
);

const VERIFIED_DIR = "src/data/catalog/verified";
const TIER1_MANUAL = "src/backend/catalog/tier1CatalogDefinitions.js";

const AUDITED_FILES = [
  `${VERIFIED_DIR}/buildVerifiedDossierVariants.js`,
  `${VERIFIED_DIR}/applyVerifiedCatalogOverlay.js`,
  `${VERIFIED_DIR}/resolveDossierSlug.js`,
  `${VERIFIED_DIR}/nexonSlugAliases.js`,
  `${VERIFIED_DIR}/punchSlugAliases.js`,
  `${VERIFIED_DIR}/tiagoSlugAliases.js`,
  `${VERIFIED_DIR}/tataNexonEvVerified.js`,
  `${VERIFIED_DIR}/tataPunchEvVerified.js`,
  `${VERIFIED_DIR}/tataTiagoEvVerified.js`,
  TIER1_MANUAL,
];

const SEARCH_TERMS = [
  "src/data/catalog/verified",
  "catalog/verified/",
  "tier1CatalogDefinitions",
  "buildVerifiedDossierVariants",
  "hasVerifiedDossier",
  "applyVerifiedCatalogOverlay",
  "resolveDossierSlug",
  "tataNexonEvVerified",
  "tataPunchEvVerified",
  "tataTiagoEvVerified",
  "buildTataNexonTier1Definition",
  "buildTataPunchTier1Definition",
  "buildTataTiagoTier1Definition",
  "buildTataNexonVerifiedOverlay",
  "buildTataPunchVerifiedOverlay",
  "buildTataTiagoVerifiedOverlay",
  "TATA_NEXON_VERIFIED_VARIANTS",
  "TATA_PUNCH_VERIFIED_VARIANTS",
  "TATA_TIAGO_VERIFIED_VARIANTS",
  "nexonSlugAliases",
  "punchSlugAliases",
  "tiagoSlugAliases",
  "TIER1_CATALOG_DEFINITIONS",
];

const MANUAL_VERIFIED_SLUGS = new Set([
  "tata-nexon-ev",
  "tata-punch-ev",
  "tata-tiago-ev",
]);

const MANUAL_TIER1_SLUGS = new Set([
  "tata-nexon-ev",
  "tata-punch-ev",
  "tata-tiago-ev",
  "tata-curvv-ev",
  "mg-comet-ev",
  "mg-zs-ev",
  "mahindra-be-6",
  "mahindra-xev-9e",
  "mahindra-xuv400",
  "byd-atto-3",
  "hyundai-kona-electric",
]);

const DRIFT_FIELDS = [
  "variantCount",
  "pricing",
  "range",
  "battery",
  "charging",
  "power",
  "torque",
  "media",
];

const SKIP_DIRS = new Set([
  "node_modules",
  "dist",
  ".git",
  "coverage",
  ".cursor",
]);

const CLASSIFICATIONS = {
  ACTIVE: "ACTIVE",
  ROLLBACK_ONLY: "ROLLBACK_ONLY",
  UNUSED: "UNUSED",
};

function walkRepoFiles(dir = REPO_ROOT, results = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkRepoFiles(abs, results);
      continue;
    }
    if (!/\.(js|mjs|jsx|ts|tsx|md|json)$/.test(entry.name)) continue;
    results.push(abs);
  }
  return results;
}

function scanReferences(files) {
  const references = new Map();

  for (const term of SEARCH_TERMS) {
    references.set(term, []);
  }

  for (const filePath of files) {
    const rel = path.relative(REPO_ROOT, filePath).replace(/\\/g, "/");
    if (rel.startsWith("docs/catalog/catalog-phase65-deadcode")) continue;

    let content;
    try {
      content = fs.readFileSync(filePath, "utf8");
    } catch {
      continue;
    }

    for (const term of SEARCH_TERMS) {
      if (content.includes(term)) {
        references.get(term).push(rel);
      }
    }
  }

  return references;
}

function uniqueSorted(values) {
  return [...new Set(values)].sort();
}

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

function compareVerifiedDrift(generatedVariants, manualVariants, familySlug, goldenRaw) {
  const drift = [];
  const manualBySlug = new Map(manualVariants.map((v) => [v.slug, v]));
  const goldenBySlug = new Map(
    (goldenRaw.variants || []).map((row) => [row.slug || row.variantName, row])
  );

  if (generatedVariants.length !== manualVariants.length) {
    drift.push({
      field: "variantCount",
      familySlug,
      generated: generatedVariants.length,
      manual: manualVariants.length,
    });
  }

  for (const generated of generatedVariants) {
    const manual = manualBySlug.get(generated.slug);
    if (!manual) continue;

    if (generated.priceInr !== manual.priceInr) {
      drift.push({
        field: "pricing",
        familySlug,
        slug: generated.slug,
        generated: generated.priceInr,
        manual: manual.priceInr,
      });
    }
    if (generated.rangeKmClaimed !== manual.rangeKmClaimed) {
      drift.push({
        field: "range",
        familySlug,
        slug: generated.slug,
        generated: generated.rangeKmClaimed,
        manual: manual.rangeKmClaimed,
      });
    }
    if (generated.batteryKwh !== manual.batteryKwh) {
      drift.push({
        field: "battery",
        familySlug,
        slug: generated.slug,
        generated: generated.batteryKwh,
        manual: manual.batteryKwh,
      });
    }
    if (
      generated.charging?.acKw !== manual.charging?.acKw ||
      generated.charging?.dcKw !== manual.charging?.dcKw
    ) {
      drift.push({
        field: "charging",
        familySlug,
        slug: generated.slug,
        generated: {
          acKw: generated.charging?.acKw,
          dcKw: generated.charging?.dcKw,
        },
        manual: {
          acKw: manual.charging?.acKw,
          dcKw: manual.charging?.dcKw,
        },
      });
    }

    const goldenVariant = goldenBySlug.get(generated.slug);
    if (
      goldenVariant &&
      variantHasGoldenPower(goldenVariant, goldenRaw.fields) &&
      generated.powerKw != null &&
      manual.powerKw != null &&
      Math.abs(generated.powerKw - manual.powerKw) > 0.2
    ) {
      drift.push({
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
      drift.push({
        field: "torque",
        familySlug,
        slug: generated.slug,
        generated: generated.torqueNm,
        manual: manual.torqueNm,
      });
    }
  }

  return drift;
}

function compareTier1Drift(generated, manual, familySlug) {
  const drift = [];
  const generatedBySlug = new Map(
    (generated.variants || []).map((v) => [v.slug, v])
  );

  if ((generated.variants || []).length !== (manual.variants || []).length) {
    drift.push({
      field: "variantCount",
      familySlug,
      generated: generated.variants?.length,
      manual: manual.variants?.length,
    });
  }

  for (const manualVariant of manual.variants || []) {
    const generatedVariant = generatedBySlug.get(manualVariant.slug);
    if (!generatedVariant) {
      drift.push({
        field: "variantCount",
        familySlug,
        slug: manualVariant.slug,
        issue: "missing in generated tier1",
      });
      continue;
    }

    if (manualVariant.priceInr !== generatedVariant.priceInr) {
      drift.push({
        field: "pricing",
        familySlug,
        slug: manualVariant.slug,
        generated: generatedVariant.priceInr,
        manual: manualVariant.priceInr,
      });
    }
    if (manualVariant.rangeKmClaimed !== generatedVariant.rangeKmClaimed) {
      drift.push({
        field: "range",
        familySlug,
        slug: manualVariant.slug,
        generated: generatedVariant.rangeKmClaimed,
        manual: manualVariant.rangeKmClaimed,
      });
    }
    if (manualVariant.batteryKwh !== generatedVariant.batteryKwh) {
      drift.push({
        field: "battery",
        familySlug,
        slug: manualVariant.slug,
        generated: generatedVariant.batteryKwh,
        manual: manualVariant.batteryKwh,
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
      drift.push({
        field: "charging",
        familySlug,
        slug: manualVariant.slug,
        generated: generatedDc,
        manual: manualDc,
      });
    }

    if (
      manualVariant.powerKw != null &&
      generatedVariant.powerKw != null &&
      Math.abs(manualVariant.powerKw - generatedVariant.powerKw) > 0.2
    ) {
      drift.push({
        field: "power",
        familySlug,
        slug: manualVariant.slug,
        generated: generatedVariant.powerKw,
        manual: manualVariant.powerKw,
      });
    }
    if (
      manualVariant.torqueNm != null &&
      generatedVariant.torqueNm != null &&
      manualVariant.torqueNm !== generatedVariant.torqueNm
    ) {
      drift.push({
        field: "torque",
        familySlug,
        slug: manualVariant.slug,
        generated: generatedVariant.torqueNm,
        manual: manualVariant.torqueNm,
      });
    }
  }

  const genMedia = mediaPresence(generated);
  const manMedia = mediaPresence(manual);
  for (const key of ["hasHero", "hasListing", "hasCompare"]) {
    if (genMedia[key] !== manMedia[key]) {
      drift.push({
        field: "media",
        familySlug,
        aspect: key,
        generated: genMedia[key],
        manual: manMedia[key],
      });
    }
  }

  return drift;
}

function buildClassifications(referenceIndex) {
  const runtimeRefs = (term) =>
    uniqueSorted(
      (referenceIndex.get(term) || []).filter(
        (file) =>
          file.startsWith("src/") &&
          !file.includes("/catalog/generated/") &&
          !file.includes("catalog-phase")
      )
    );

  const toolingRefs = (term) =>
    uniqueSorted(
      (referenceIndex.get(term) || []).filter((file) => file.startsWith("scripts/"))
    );

  return [
    {
      file: `${VERIFIED_DIR}/buildVerifiedDossierVariants.js`,
      classification: CLASSIFICATIONS.ACTIVE,
      role: "Runtime cutover layer (generated first, manual rollback).",
      runtimeConsumers: runtimeRefs("buildVerifiedDossierVariants"),
    },
    {
      file: `${VERIFIED_DIR}/applyVerifiedCatalogOverlay.js`,
      classification: CLASSIFICATIONS.ACTIVE,
      role: "Tata overlay enrichment in normalizeCar pipeline.",
      runtimeConsumers: runtimeRefs("applyVerifiedCatalogOverlay"),
    },
    {
      file: `${VERIFIED_DIR}/resolveDossierSlug.js`,
      classification: CLASSIFICATIONS.ACTIVE,
      role: "Variant slug alias resolution for routes and detail pages.",
      runtimeConsumers: runtimeRefs("resolveDossierSlug"),
    },
    {
      file: `${VERIFIED_DIR}/nexonSlugAliases.js`,
      classification: CLASSIFICATIONS.ACTIVE,
      role: "Nexon dossier slug aliases.",
      runtimeConsumers: runtimeRefs("nexonSlugAliases"),
    },
    {
      file: `${VERIFIED_DIR}/punchSlugAliases.js`,
      classification: CLASSIFICATIONS.ACTIVE,
      role: "Punch dossier slug aliases.",
      runtimeConsumers: runtimeRefs("punchSlugAliases"),
    },
    {
      file: `${VERIFIED_DIR}/tiagoSlugAliases.js`,
      classification: CLASSIFICATIONS.ACTIVE,
      role: "Tiago dossier slug aliases.",
      runtimeConsumers: runtimeRefs("tiagoSlugAliases"),
    },
    {
      file: `${VERIFIED_DIR}/tataNexonEvVerified.js`,
      classification: CLASSIFICATIONS.ROLLBACK_ONLY,
      subsystems: {
        TATA_NEXON_VERIFIED_VARIANTS: CLASSIFICATIONS.ROLLBACK_ONLY,
        buildTataNexonVerifiedOverlay: CLASSIFICATIONS.ACTIVE,
        buildTataNexonTier1Definition: CLASSIFICATIONS.ROLLBACK_ONLY,
        TATA_NEXON_FAMILY_MEDIA: CLASSIFICATIONS.ROLLBACK_ONLY,
      },
      role: "Manual Nexon dossier; overlays still active at runtime.",
      runtimeConsumers: runtimeRefs("tataNexonEvVerified"),
      toolingConsumers: toolingRefs("tataNexonEvVerified"),
    },
    {
      file: `${VERIFIED_DIR}/tataPunchEvVerified.js`,
      classification: CLASSIFICATIONS.ROLLBACK_ONLY,
      subsystems: {
        TATA_PUNCH_VERIFIED_VARIANTS: CLASSIFICATIONS.ROLLBACK_ONLY,
        buildTataPunchVerifiedOverlay: CLASSIFICATIONS.ACTIVE,
        buildTataPunchTier1Definition: CLASSIFICATIONS.ROLLBACK_ONLY,
        TATA_PUNCH_FAMILY_MEDIA: CLASSIFICATIONS.ROLLBACK_ONLY,
      },
      role: "Manual Punch dossier; overlays still active at runtime.",
      runtimeConsumers: runtimeRefs("tataPunchEvVerified"),
      toolingConsumers: toolingRefs("tataPunchEvVerified"),
    },
    {
      file: `${VERIFIED_DIR}/tataTiagoEvVerified.js`,
      classification: CLASSIFICATIONS.ROLLBACK_ONLY,
      subsystems: {
        TATA_TIAGO_VERIFIED_VARIANTS: CLASSIFICATIONS.ROLLBACK_ONLY,
        buildTataTiagoVerifiedOverlay: CLASSIFICATIONS.ACTIVE,
        buildTataTiagoTier1Definition: CLASSIFICATIONS.ROLLBACK_ONLY,
        TATA_TIAGO_FAMILY_MEDIA: CLASSIFICATIONS.ROLLBACK_ONLY,
      },
      role: "Manual Tiago dossier; overlays still active at runtime.",
      runtimeConsumers: runtimeRefs("tataTiagoEvVerified"),
      toolingConsumers: toolingRefs("tataTiagoEvVerified"),
    },
    {
      file: TIER1_MANUAL,
      classification: CLASSIFICATIONS.ROLLBACK_ONLY,
      role: "Manual tier1 seed definitions (11 families); generated primary since Phase 6A.",
      runtimeConsumers: [],
      toolingConsumers: toolingRefs("tier1CatalogDefinitions"),
    },
  ];
}

function buildDependencyGraph() {
  return `Golden JSON (public/catalog/golden-dataset/)
  ├─► generate-verified-dossiers.mjs ──► src/data/catalog/generated/*
  ├─► generate-tier1-definitions.mjs ──► src/backend/catalog/generated/*
  │
  ├─► [RUNTIME — generated primary since 6A]
  │     buildVerifiedDossierVariants.js ──► generated/index.js (first)
  │                                      └─► tata*EvVerified.js (rollback)
  │     backend-seed-tier1.mjs ──► generated/index.js (first)
  │                            └─► tier1CatalogDefinitions.js (rollback)
  │
  ├─► [RUNTIME — still active manual]
  │     normalizeCar.js ──► applyVerifiedCatalogOverlay.js
  │                      └─► buildTata*VerifiedOverlay (tata*EvVerified.js)
  │     vehicleRoutes.js ──► resolveDossierSlug.js
  │     vehicleDetailResolver.js ──► buildVerifiedDossierVariants.js
  │                               └─► resolveDossierSlug.js
  │
  └─► [TOOLING — manual references]
        scripts/backend-seed-tier1.mjs (fallback import)
        scripts/backend-compare-validate.mjs
        scripts/backend-catalog-ops-smoke.mjs
        scripts/lib/loadCatalogForAudit.mjs
        scripts/lib/mediaAuditV1.mjs
        scripts/sync-*-verified-backend-catalog.mjs
        scripts/validate-verified-dossier-productionization.mjs
        scripts/build-golden-dataset.mjs
        scripts/ingest-*-dossier.mjs`;
}

function buildDeletionPlan(classifications) {
  const safeDeletionCandidates = [];
  const requiresMigration = [];
  const requiresWrappers = [];

  requiresWrappers.push({
    file: `${VERIFIED_DIR}/buildVerifiedDossierVariants.js`,
    reason:
      "Keep as cutover wrapper until manual rollback path is removed in Phase 7.",
  });

  requiresMigration.push({
    target: `${VERIFIED_DIR}/tataNexonEvVerified.js`,
    exports: ["TATA_NEXON_VERIFIED_VARIANTS", "buildTataNexonTier1Definition"],
    migrateTo: "src/data/catalog/generated/*",
    blockers: ["buildTataNexonVerifiedOverlay still ACTIVE in normalizeCar"],
  });
  requiresMigration.push({
    target: `${VERIFIED_DIR}/tataPunchEvVerified.js`,
    exports: ["TATA_PUNCH_VERIFIED_VARIANTS", "buildTataPunchTier1Definition"],
    migrateTo: "src/data/catalog/generated/*",
    blockers: ["buildTataPunchVerifiedOverlay still ACTIVE in normalizeCar"],
  });
  requiresMigration.push({
    target: `${VERIFIED_DIR}/tataTiagoEvVerified.js`,
    exports: ["TATA_TIAGO_VERIFIED_VARIANTS", "buildTataTiagoTier1Definition"],
    migrateTo: "src/data/catalog/generated/*",
    blockers: ["buildTataTiagoVerifiedOverlay still ACTIVE in normalizeCar"],
  });

  requiresMigration.push({
    target: TIER1_MANUAL,
    scope: "inline definitions for 7 stale families + Tata builder imports",
    migrateTo: "src/backend/catalog/generated/*",
    blockers: [
      "backend-compare-validate.mjs uses getTier1Definition()",
      "backend-catalog-ops-smoke.mjs iterates TIER1_CATALOG_DEFINITIONS",
      "loadCatalogForAudit.mjs reads manual definitions",
    ],
  });

  requiresMigration.push({
    target: "scripts/backend-compare-validate.mjs",
    migrateTo: "loadGeneratedTier1Definition from generated/index.js",
  });
  requiresMigration.push({
    target: "scripts/lib/loadCatalogForAudit.mjs",
    migrateTo: "generated tier1 index",
  });
  requiresMigration.push({
    target: "scripts/lib/mediaAuditV1.mjs",
    migrateTo: "golden media or generated dossier media",
  });

  const unusedTooling = [
    "scripts/ingest-nexon-dossier.mjs",
    "scripts/ingest-punch-dossier.mjs",
    "scripts/sync-nexon-verified-backend-catalog.mjs",
    "scripts/sync-punch-verified-backend-catalog.mjs",
    "scripts/sync-tiago-verified-backend-catalog.mjs",
    "scripts/backend-seed-nexon-ev.mjs",
    "scripts/validate-nexon-variant-visibility.mjs",
    "scripts/validate-verified-dossier-productionization.mjs",
  ];

  for (const script of unusedTooling) {
    safeDeletionCandidates.push({
      file: script,
      classification: CLASSIFICATIONS.UNUSED,
      note: "Legacy manual-ingestion/validation tooling; golden + generators are canonical. Safe after confirming no CI dependency.",
    });
  }

  return {
    safeDeletionCandidates,
    requiresMigration,
    requiresWrappers,
    deadFiles: classifications
      .filter((entry) => entry.classification === CLASSIFICATIONS.UNUSED)
      .map((entry) => entry.file),
  };
}

function writeReports(report) {
  fs.mkdirSync(path.dirname(REPORT_MD), { recursive: true });

  const md = `# Catalog Phase 6.5 — Dead Code & Drift Audit

Generated: ${report.generatedAt}

## Summary

| Metric | Value |
|--------|-------|
| Files audited | ${report.filesAudited.length} |
| Active references (runtime) | ${report.activeReferenceCount} |
| Rollback-only assets | ${report.rollbackOnlyCount} |
| Unused tooling candidates | ${report.safeDeletionCandidates.length} |
| Drift measurements | ${report.driftCount} |
| Vehicles with manual comparison | ${report.vehiclesWithDriftComparison} |

## Dependency graph

\`\`\`
${report.dependencyGraph}
\`\`\`

## Classifications

${report.classifications
  .map(
    (entry) =>
      `### \`${entry.file}\` — **${entry.classification}**\n${entry.role}\n${
        entry.runtimeConsumers?.length
          ? `Runtime consumers: ${entry.runtimeConsumers.map((c) => `\`${c}\``).join(", ")}`
          : ""
      }`
  )
  .join("\n\n")}

## Drift statistics (generated vs manual)

| Field | Drift count |
|-------|-------------|
${Object.entries(report.driftByField)
  .map(([field, count]) => `| \`${field}\` | ${count} |`)
  .join("\n")}

Drift is documented only — not a failure.

## Safe deletion candidates

${report.safeDeletionCandidates.length ? report.safeDeletionCandidates.map((row) => `- \`${row.file}\` — ${row.note}`).join("\n") : "None yet — manual assets still referenced."}

## Requires migration before deletion

${report.requiresMigration.map((row) => `- **${row.target}** → ${row.migrateTo}${row.blockers ? ` (blockers: ${row.blockers.join("; ")})` : ""}`).join("\n")}

## Requires wrappers (keep for now)

${report.requiresWrappers.map((row) => `- \`${row.file}\` — ${row.reason}`).join("\n")}

## Commands

\`\`\`bash
npm run catalog:phase65-audit
\`\`\`
`;

  fs.writeFileSync(REPORT_MD, md, "utf8");
  fs.writeFileSync(REPORT_JSON, `${JSON.stringify(report, null, 2)}\n`, "utf8");
}

async function main() {
  const repoFiles = walkRepoFiles();
  const referenceIndex = scanReferences(repoFiles);
  const classifications = buildClassifications(referenceIndex);

  const {
    loadGeneratedVerifiedDossier,
    listGeneratedVerifiedDossierSlugs,
  } = await import("../src/data/catalog/generated/index.js");
  const {
    loadGeneratedTier1Definition,
    listGeneratedTier1DefinitionSlugs,
  } = await import("../src/backend/catalog/generated/index.js");
  const manualTier1BySlug = new Map();
  if (fs.existsSync(path.join(REPO_ROOT, TIER1_MANUAL))) {
    const { TIER1_CATALOG_DEFINITIONS } = await import(
      "../src/backend/catalog/tier1CatalogDefinitions.js"
    );
    for (const definition of TIER1_CATALOG_DEFINITIONS) {
      manualTier1BySlug.set(definition.slug, definition);
    }
  }

  const manualDossierImports = {
    "tata-nexon-ev": "../src/data/catalog/verified/tataNexonEvVerified.js",
    "tata-punch-ev": "../src/data/catalog/verified/tataPunchEvVerified.js",
    "tata-tiago-ev": "../src/data/catalog/verified/tataTiagoEvVerified.js",
  };
  const manualVariantExports = {
    "tata-nexon-ev": "TATA_NEXON_VERIFIED_VARIANTS",
    "tata-punch-ev": "TATA_PUNCH_VERIFIED_VARIANTS",
    "tata-tiago-ev": "TATA_TIAGO_VERIFIED_VARIANTS",
  };

  const manifest = readJson(PUBLIC_MANIFEST);
  const driftEntries = [];
  const vehicleDrift = [];

  for (const entry of manifest.vehicles || []) {
    const familySlug = entry.familySlug || entry.id;
    const goldenRaw = readJson(
      path.join(
        REPO_ROOT,
        `public/catalog/golden-dataset/vehicles/${familySlug}.json`
      )
    );

    const row = { familySlug, drift: [] };

    const generatedDossier = loadGeneratedVerifiedDossier(familySlug);
    const manualDossierPath = manualDossierImports[familySlug]
      ? path.resolve(REPO_ROOT, manualDossierImports[familySlug].replace(/^\.\.\//, ""))
      : null;
    if (
      generatedDossier &&
      MANUAL_VERIFIED_SLUGS.has(familySlug) &&
      manualDossierPath &&
      fs.existsSync(manualDossierPath)
    ) {
      const manualMod = await import(manualDossierImports[familySlug]);
      const manualVariants = manualMod[manualVariantExports[familySlug]] || [];
      const verifiedDrift = compareVerifiedDrift(
        generatedDossier.variants || [],
        manualVariants,
        familySlug,
        goldenRaw
      );

      const generatedMedia = mediaPresence({ media: generatedDossier.media });
      const mediaKey =
        familySlug === "tata-nexon-ev"
          ? "TATA_NEXON_FAMILY_MEDIA"
          : familySlug === "tata-punch-ev"
            ? "TATA_PUNCH_FAMILY_MEDIA"
            : "TATA_TIAGO_FAMILY_MEDIA";
      const manualMedia = mediaPresence({ media: manualMod[mediaKey] });
      for (const key of ["hasHero", "hasListing", "hasCompare"]) {
        if (generatedMedia[key] !== manualMedia[key]) {
          verifiedDrift.push({
            field: "media",
            familySlug,
            aspect: key,
            generated: generatedMedia[key],
            manual: manualMedia[key],
          });
        }
      }

      row.drift.push(...verifiedDrift);
      driftEntries.push(...verifiedDrift);
    }

    const generatedTier1 = loadGeneratedTier1Definition(familySlug);
    const manualTier1 = manualTier1BySlug.get(familySlug);
    if (generatedTier1 && manualTier1) {
      const tier1Drift = compareTier1Drift(generatedTier1, manualTier1, familySlug);
      row.drift.push(...tier1Drift);
      driftEntries.push(...tier1Drift);
    }

    if (row.drift.length) vehicleDrift.push(row);
  }

  const driftByField = Object.fromEntries(
    DRIFT_FIELDS.map((field) => [
      field,
      driftEntries.filter((entry) => entry.field === field).length,
    ])
  );

  const activeRuntimeFiles = uniqueSorted(
    [
      ...(referenceIndex.get("buildVerifiedDossierVariants") || []),
      ...(referenceIndex.get("applyVerifiedCatalogOverlay") || []),
      ...(referenceIndex.get("resolveDossierSlug") || []),
      "src/utils/vehicleDetailResolver.js",
      "src/utils/vehicleRoutes.js",
      "src/utils/normalizeCar.js",
    ].filter((file) => file.startsWith("src/"))
  );

  const deletionPlan = buildDeletionPlan(classifications);

  const report = {
    phase: "catalog-phase65-deadcode",
    generatedAt: new Date().toISOString(),
    filesAudited: AUDITED_FILES,
    dependencyGraph: buildDependencyGraph(),
    referenceIndex: Object.fromEntries(
      [...referenceIndex.entries()].map(([term, files]) => [
        term,
        uniqueSorted(files),
      ])
    ),
    activeReferences: {
      runtime: activeRuntimeFiles,
      tooling: uniqueSorted(referenceIndex.get("tier1CatalogDefinitions") || []).filter(
        (file) => file.startsWith("scripts/")
      ),
      count: activeRuntimeFiles.length,
    },
    classifications,
    rollbackOnlyCount: classifications.filter(
      (entry) => entry.classification === CLASSIFICATIONS.ROLLBACK_ONLY
    ).length,
    activeReferenceCount: activeRuntimeFiles.length,
    driftCount: driftEntries.length,
    driftByField,
    vehicleDrift,
    vehiclesWithDriftComparison: vehicleDrift.length,
    generatedCoverage: {
      verifiedDossierSlugs: listGeneratedVerifiedDossierSlugs(),
      tier1Slugs: listGeneratedTier1DefinitionSlugs(),
      manualTier1Slugs: [...MANUAL_TIER1_SLUGS],
      manualVerifiedSlugs: [...MANUAL_VERIFIED_SLUGS],
    },
    ...deletionPlan,
    notes: [
      "No files deleted in Phase 6.5.",
      "Manual Tata overlay builders remain ACTIVE — blocks dossier file deletion.",
      "tier1CatalogDefinitions.js rollback path unused when all 25 generated slugs present.",
    ],
  };

  writeReports(report);

  console.log(`Phase 6.5 audit complete`);
  console.log(`Files audited: ${report.filesAudited.length}`);
  console.log(`Active runtime references: ${report.activeReferenceCount}`);
  console.log(`Dead files (unused classification): ${report.deadFiles.length}`);
  console.log(`Safe deletion candidates: ${report.safeDeletionCandidates.length}`);
  console.log(`Drift count: ${report.driftCount}`);
  console.log(`Reports → ${path.relative(REPO_ROOT, REPORT_MD)}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
