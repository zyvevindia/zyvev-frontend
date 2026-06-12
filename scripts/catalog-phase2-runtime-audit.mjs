/**
 * Phase 2 runtime resolver audit — static + bundled resolution simulation.
 * Writes docs/catalog/catalog-phase2-runtime.{md,json}
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  PUBLIC_GOLDEN,
  PUBLIC_MANIFEST,
  PUBLIC_VEHICLES,
  readJson,
} from "./lib/goldenCatalogPaths.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const REPORT_MD = path.join(REPO_ROOT, "docs/catalog/catalog-phase2-runtime.md");
const REPORT_JSON = path.join(REPO_ROOT, "docs/catalog/catalog-phase2-runtime.json");

const VERIFIED_DOSSIER_FAMILIES = new Set([
  "tata-nexon-ev",
  "tata-punch-ev",
  "tata-tiago-ev",
]);

const HIDDEN_PRECEDENCE_RULES = [
  {
    id: "verified-dossier-override",
    location: "src/data/catalog/verified/buildVerifiedDossierVariants.js",
    description:
      "hasVerifiedDossier() + buildVerifiedDossierMarketplaceVariants() for Nexon, Punch, Tiago.",
    phase2Status:
      "Bypassed when isGoldenDatasetFamily() is true (all three are in golden manifest).",
    removed: false,
  },
  {
    id: "detail-api-first-non-golden",
    location: "src/utils/vehicleDetailResolver.js → fetchVehicleFamilyBySlug",
    description:
      "Non-golden families: API /cars pool first, then golden async fallback, then single-slug fetch.",
    phase2Status: "Unchanged for families outside golden manifest.",
    removed: false,
  },
  {
    id: "fetch-vehicle-by-slug-api",
    location: "src/utils/vehicleDetailResolver.js → fetchVehicleBySlug",
    description:
      "Slug resolution tries /cars/slug then /api/catalog/variants/slug before Mongo id lookup.",
    phase2Status:
      "Still used for non-family flows; CarDetails uses fetchVehicleFamilyBySlug instead.",
    removed: false,
  },
  {
    id: "compare-guide-api-first",
    location: "src/utils/compareGuideCatalog.js → fetchCatalogPool",
    description:
      "Compare SEO + rival prefill: fetchVehicleBySlug per slug, then /cars?limit=120 pool. No golden manifest authority.",
    phase2Status:
      "Known divergence from detail/listing — compare cards may use API when golden differs.",
    removed: false,
  },
  {
    id: "merge-listing-verified-fallback",
    location: "src/utils/vehicleDetailResolver.js → fetchListingCatalogVariants",
    description:
      "hasVerifiedDossier branch remains after golden check for hypothetical non-manifest verified families.",
    phase2Status: "Dead path for current 25-vehicle fleet (all verified families are in manifest).",
    removed: false,
  },
  {
    id: "golden-loader-node-docs-path",
    location: "src/catalogAcquisition/benchmark/goldenLoaderNode.js",
    description: "SEO/agent scripts read docs/catalog/golden-dataset (mirrored from public).",
    phase2Status: "Build-time bundle uses public/; Node agents use docs/ mirror.",
    removed: false,
  },
  {
    id: "build-golden-from-verified",
    location: "scripts/build-golden-dataset.mjs",
    description:
      "Legacy script writes verified dossiers into docs golden JSON (inverted flow).",
    phase2Status:
      "Superseded by catalog:generate-manifest + public canonical editing.",
    removed: false,
  },
  {
    id: "tier1-supabase-seed",
    location: "src/backend/catalog/tier1CatalogDefinitions.js",
    description: "Supabase seed defines 11 tier-1 families separately from golden manifest.",
    phase2Status: "Backend persistence only; not used for marketplace variant resolution.",
    removed: false,
  },
  {
    id: "slug-alias-exceptions",
    location: "src/utils/vehicleRoutes.js, src/data/catalog/verified/punchSlugAliases.js",
    description: "Legacy slug aliases for Nexon/Punch/Tiago variant URLs.",
    phase2Status: "Still applied in fetchVehicleFamilyBySlug via resolveDossierSlug.",
    removed: false,
  },
];

function loadManifest() {
  return readJson(PUBLIC_MANIFEST);
}

function loadGoldenVariantCount(familySlug) {
  const filePath = path.join(PUBLIC_VEHICLES, `${familySlug}.json`);
  if (!fs.existsSync(filePath)) return 0;
  const dossier = readJson(filePath);
  return Array.isArray(dossier.variants) ? dossier.variants.length : 0;
}

function simulateDetailSource(familySlug) {
  const inManifest = loadManifest().vehicles.some(
    (e) => (e.familySlug || e.id) === familySlug
  );

  if (inManifest) {
    return {
      primarySource: "golden-dataset",
      goldenWon: true,
      verifiedParticipated: VERIFIED_DOSSIER_FAMILIES.has(familySlug),
      apiFallback: false,
      runtimeSources: VERIFIED_DOSSIER_FAMILIES.has(familySlug)
        ? ["golden-dataset", "verified-dossier-bypassed"]
        : ["golden-dataset"],
    };
  }

  if (VERIFIED_DOSSIER_FAMILIES.has(familySlug)) {
    return {
      primarySource: "verified-dossier",
      goldenWon: false,
      verifiedParticipated: true,
      apiFallback: false,
      runtimeSources: ["verified-dossier"],
    };
  }

  return {
    primarySource: "api-then-golden-fallback",
    goldenWon: false,
    verifiedParticipated: false,
    apiFallback: true,
    runtimeSources: ["api", "golden-fallback", "single-slug-fetch"],
  };
}

function simulateListingSource(familySlug) {
  const detail = simulateDetailSource(familySlug);
  return {
    ...detail,
    path: "fetchListingCatalogVariants",
  };
}

function simulateCompareSource(familySlug) {
  const inManifest = loadManifest().vehicles.some(
    (e) => (e.familySlug || e.id) === familySlug
  );

  return {
    primarySource: "api-compare-guide",
    goldenWon: false,
    verifiedParticipated: false,
    apiFallback: true,
    runtimeSources: ["fetchVehicleBySlug", "api-cars-pool", "seo-ranked-stub"],
    note: inManifest
      ? "Diverges from detail/listing — compareGuideCatalog does not use golden authority yet."
      : null,
  };
}

function fleetConsistency(vehicles) {
  const mismatches = [];

  for (const vehicle of vehicles) {
    const detail = vehicle.sources.detail.primarySource;
    const listing = vehicle.sources.listing.primarySource;
    const compare = vehicle.sources.compare.primarySource;

    if (detail !== listing) {
      mismatches.push({
        familySlug: vehicle.familySlug,
        type: "detail-vs-listing",
        detail,
        listing,
      });
    }

    if (detail === "golden-dataset" && compare === "api-compare-guide") {
      mismatches.push({
        familySlug: vehicle.familySlug,
        type: "detail-vs-compare",
        detail,
        compare,
        message:
          "CarDetails/listing use golden; compare guide path still API-first.",
      });
    }
  }

  return mismatches;
}

function buildReport() {
  const manifest = loadManifest();
  const vehicles = (manifest.vehicles || []).map((entry) => {
    const familySlug = entry.familySlug || entry.id;
    const goldenVariantCount = loadGoldenVariantCount(familySlug);

    return {
      familySlug,
      displayName: entry.displayName,
      verificationLevel: entry.verificationLevel,
      manifestVariantCount: entry.variantCount,
      goldenVariantCount,
      inGoldenManifest: true,
      sources: {
        detail: simulateDetailSource(familySlug),
        listing: simulateListingSource(familySlug),
        compare: simulateCompareSource(familySlug),
      },
    };
  });

  const goldenCount = vehicles.filter(
    (v) => v.sources.detail.goldenWon
  ).length;
  const apiFallbackCount = vehicles.filter(
    (v) => v.sources.detail.apiFallback
  ).length;
  const verifiedParticipating = vehicles.filter(
    (v) => v.sources.detail.verifiedParticipated
  ).length;

  const mismatches = fleetConsistency(vehicles);

  return {
    generatedAt: new Date().toISOString(),
    phase: 2,
    resolverPrecedence: {
      before: [
        "1. hasVerifiedDossier (Nexon, Punch, Tiago)",
        "2. isGoldenDatasetFamily → bundled golden",
        "3. API /cars siblings",
        "4. golden async fallback",
        "5. single-slug API fetch",
      ],
      after: [
        "1. isGoldenDatasetFamily → golden ALWAYS wins (25 manifest families)",
        "2. hasVerifiedDossier (only if ∉ golden manifest)",
        "3. API /cars siblings",
        "4. golden async fallback",
        "5. single-slug API fetch",
      ],
    },
    runtimeFlow: {
      carDetails: "CarDetails → fetchVehicleFamilyBySlug → authority chain",
      listingPage:
        "ListingPage/Home/IntelligenceDiscovery → fetchListingCatalogVariants → per-family merge",
      comparePage:
        "ComparePage → compareCarsStorage OR useCompareGuideCars → compareGuideCatalog (API)",
      discoverySeo:
        "DiscoverySeoPage → useCompareGuideCars → compareGuideCatalog (API)",
      seoPages: "Static seo-data JSON — not routed through vehicleDetailResolver",
    },
    summary: {
      vehicleCount: vehicles.length,
      goldenAuthorityCount: goldenCount,
      apiFallbackCount,
      verifiedDossierBypassedCount: verifiedParticipating,
      fleetMismatches: mismatches.length,
    },
    hiddenPrecedenceRules: HIDDEN_PRECEDENCE_RULES,
    fleetMismatches: mismatches,
    vehicles,
  };
}

function writeMarkdown(report) {
  const lines = [
    "# Catalog Phase 2 — Runtime Resolver Audit",
    "",
    `Generated: ${report.generatedAt}`,
    "",
    "## Resolver precedence",
    "",
    "### Before Phase 2",
    "",
    ...report.resolverPrecedence.before.map((line) => `- ${line}`),
    "",
    "### After Phase 2",
    "",
    ...report.resolverPrecedence.after.map((line) => `- ${line}`),
    "",
    "## Runtime flow",
    "",
    "```mermaid",
    "flowchart TD",
    "  CD[CarDetails] --> FVF[fetchVehicleFamilyBySlug]",
    "  LP[ListingPage / Home / Discovery] --> FLC[fetchListingCatalogVariants]",
    "  CP[ComparePage / SEO compare guides] --> CGC[compareGuideCatalog API path]",
    "  FVF --> G{isGoldenDatasetFamily?}",
    "  FLC --> G",
    "  G -->|yes 25 families| GOLD[public golden JSON bundle]",
    "  G -->|no| VD[hasVerifiedDossier]",
    "  VD -->|yes| VER[verified JS dossier]",
    "  VD -->|no| API[Mongo /cars API + golden fallback]",
    "  CGC --> API2[fetchVehicleBySlug + /cars pool]",
    "```",
    "",
    "## Summary",
    "",
    `- Vehicles in golden manifest: **${report.summary.vehicleCount}**`,
    `- Detail/listing golden authority: **${report.summary.goldenAuthorityCount}**`,
    `- API fallback (non-manifest only): **${report.summary.apiFallbackCount}**`,
    `- Verified dossier bypassed (still in manifest): **${report.summary.verifiedDossierBypassedCount}**`,
    `- Fleet source mismatches: **${report.summary.fleetMismatches}**`,
    "",
    "## Per-vehicle resolution",
    "",
    "| Family | Detail source | Listing | Compare | Golden won | Verified bypassed |",
    "|--------|---------------|---------|---------|------------|-------------------|",
  ];

  for (const v of report.vehicles) {
    lines.push(
      `| \`${v.familySlug}\` | ${v.sources.detail.primarySource} | ${v.sources.listing.primarySource} | ${v.sources.compare.primarySource} | ${v.sources.detail.goldenWon ? "yes" : "no"} | ${v.sources.detail.verifiedParticipated ? "yes" : "no"} |`
    );
  }

  lines.push("", "## Hidden precedence rules (documented, not removed)", "");

  for (const rule of report.hiddenPrecedenceRules) {
    lines.push(`### ${rule.id}`, "");
    lines.push(`- **Location:** \`${rule.location}\``);
    lines.push(`- **Description:** ${rule.description}`);
    lines.push(`- **Phase 2:** ${rule.phase2Status}`);
    lines.push("");
  }

  if (report.fleetMismatches.length > 0) {
    lines.push("## Fleet mismatches", "");
    for (const m of report.fleetMismatches) {
      lines.push(
        `- \`${m.familySlug}\` (${m.type}): ${m.message || `${m.detail} vs ${m.compare || m.listing}`}`
      );
    }
  }

  fs.writeFileSync(REPORT_MD, `${lines.join("\n")}\n`, "utf8");
}

function main() {
  const report = buildReport();
  fs.mkdirSync(path.dirname(REPORT_JSON), { recursive: true });
  fs.writeFileSync(REPORT_JSON, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  writeMarkdown(report);

  console.log(`Wrote ${REPORT_MD}`);
  console.log(`Wrote ${REPORT_JSON}`);
  console.log(
    `Golden authority: ${report.summary.goldenAuthorityCount}/${report.summary.vehicleCount}`
  );
  console.log(`Fleet mismatches: ${report.summary.fleetMismatches}`);

  if (report.fleetMismatches > 0) {
    console.warn(
      "Note: compare-guide API path diverges from detail/listing (documented, SEO/compare out of scope)."
    );
  }
}

main();
