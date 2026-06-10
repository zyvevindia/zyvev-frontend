/**
 * EV Catalog Population — Day 1 batch runner.
 * Usage: node --use-system-ca scripts/catalog-population/day1-population.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import "../lib/bootstrapEnv.mjs";

import { runEvidencePipelineV7 } from "../../src/catalogAcquisition/evidencePipelineV7.js";
import {
  flattenExtractionDraft,
  REQUIRED_PUBLISH_FIELDS,
} from "../../src/catalogAcquisition/extractionSchema.js";
import { extractFieldValue } from "../../src/catalogAcquisition/benchmark/compareUtils.js";
import { checkPublishQualityGates } from "../../src/catalogAcquisition/benchmark/qualityGates.js";
import { buildEvidencePacket } from "../../src/agents/vehicleCreation/vehicleCreationWorkflow.js";
import { scoreVehicle } from "../../src/scoring/index.js";
import {
  SEO_PAGE_SPECS,
  generateSeoContent,
  validateContentCompleteness,
} from "../../src/agents/seo/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const REGISTRY_PATH = path.join(ROOT, "public/catalog/source-registry.json");
const PUBLIC_GOLDEN = path.join(ROOT, "public/catalog/golden-dataset/vehicles");
const DOCS_GOLDEN = path.join(ROOT, "docs/catalog/golden-dataset/vehicles");
const MANIFEST_PUBLIC = path.join(ROOT, "public/catalog/golden-dataset/manifest.json");
const MANIFEST_DOCS = path.join(ROOT, "docs/catalog/golden-dataset/manifest.json");
const REPORT_PATH = path.join(ROOT, "docs/catalog/population/day1-report.md");
const REPORT_JSON = path.join(ROOT, "docs/catalog/population/day1-report.json");

const DAY1_SLUGS = [
  "mg-comet-ev",
  "hyundai-ioniq-5",
  "kia-ev6",
  "mahindra-xuv400",
  "byd-seal",
];

/** Manual variant tables when acquisition under-delivers variant matrix. */
const MANUAL_VARIANTS = Object.freeze({
  "mg-comet-ev": [
    { variantName: "Pace", priceInr: 749000, batteryKwh: 17.3, rangeKm: 230, acChargingKw: 3.3, dcChargingKw: 50 },
    { variantName: "Play", priceInr: 849000, batteryKwh: 17.3, rangeKm: 230, acChargingKw: 3.3, dcChargingKw: 50 },
    { variantName: "Plush", priceInr: 949000, batteryKwh: 17.3, rangeKm: 230, acChargingKw: 3.3, dcChargingKw: 50 },
  ],
  "hyundai-ioniq-5": [
    { variantName: "RWD", priceInr: 4495000, batteryKwh: 58, rangeKm: 631, acChargingKw: 11, dcChargingKw: 175 },
    { variantName: "AWD", priceInr: 5495000, batteryKwh: 72.6, rangeKm: 508, acChargingKw: 11, dcChargingKw: 175 },
  ],
  "kia-ev6": [
    { variantName: "GT Line", priceInr: 6590000, batteryKwh: 77.4, rangeKm: 528, acChargingKw: 11, dcChargingKw: 240 },
    { variantName: "GT Line AWD", priceInr: 7590000, batteryKwh: 77.4, rangeKm: 490, acChargingKw: 11, dcChargingKw: 240 },
  ],
  "mahindra-xuv400": [
    { variantName: "EC Pro", priceInr: 1599000, batteryKwh: 34.5, rangeKm: 375, acChargingKw: 3.3, dcChargingKw: 50 },
    { variantName: "EC", priceInr: 1699000, batteryKwh: 39.4, rangeKm: 456, acChargingKw: 3.3, dcChargingKw: 50 },
    { variantName: "EL Pro", priceInr: 1799000, batteryKwh: 39.4, rangeKm: 456, acChargingKw: 3.3, dcChargingKw: 50 },
    { variantName: "EL", priceInr: 1899000, batteryKwh: 39.4, rangeKm: 456, acChargingKw: 3.3, dcChargingKw: 50 },
  ],
  "byd-seal": [
    { variantName: "Dynamic", priceInr: 4100000, batteryKwh: 61.4, rangeKm: 510, acChargingKw: 7, dcChargingKw: 150 },
    { variantName: "Premium", priceInr: 4590000, batteryKwh: 82.5, rangeKm: 650, acChargingKw: 7, dcChargingKw: 150 },
    { variantName: "Performance", priceInr: 5300000, batteryKwh: 82.5, rangeKm: 580, acChargingKw: 11, dcChargingKw: 150 },
  ],
});

function val(entry) {
  return extractFieldValue(entry);
}

function pipelineVariantsToGolden(mergedVariants = []) {
  return mergedVariants
    .map((v) => {
      const priceInr = val(v.price ?? v.priceInr);
      if (!priceInr || priceInr <= 0) return null;
      return {
        variantName: v.variantName || v.name || "Base",
        priceInr,
        batteryKwh: val(v.battery ?? v.batteryKwh),
        rangeKm: val(v.range ?? v.rangeKm),
        acChargingKw: val(v.acChargingKw),
        dcChargingKw: val(v.dcChargingKw),
      };
    })
    .filter(Boolean);
}

function buildGoldenDossier(registryEntry, pipeline, manualNotes = []) {
  const flat = flattenExtractionDraft(pipeline.reviewedVehicle);
  const slug = registryEntry.familySlug;
  const brand = registryEntry.brand || val(flat.brand);
  const model = registryEntry.model || val(flat.model);

  let variants = pipelineVariantsToGolden(pipeline.mergedVariants);
  const usedManualVariants =
    variants.length < 2 || variants.some((v) => !v.priceInr || v.priceInr <= 0);
  if (usedManualVariants && MANUAL_VARIANTS[slug]) {
    variants = MANUAL_VARIANTS[slug];
    manualNotes.push("variant_table_manual");
  }

  const prices = variants.map((v) => v.priceInr).filter(Number.isFinite);
  const fields = {
    brand,
    model,
    bodyType: val(flat.bodyType) || "SUV",
    familySlug: slug,
    startingPrice: val(flat.startingPrice) || Math.min(...prices),
    topVariantPrice: val(flat.topVariantPrice) || Math.max(...prices),
    exShowroomPrice: val(flat.exShowroomPrice) || val(flat.startingPrice) || Math.min(...prices),
    batteryCapacityKwh: val(flat.batteryCapacityKwh) || variants[0]?.batteryKwh,
    claimedRangeKm: val(flat.claimedRangeKm) || variants[0]?.rangeKm,
    rangeTestStandard: val(flat.rangeTestStandard) || "ARAI",
    acChargingKw: val(flat.acChargingKw) || variants[0]?.acChargingKw,
    dcChargingKw: val(flat.dcChargingKw) || variants[0]?.dcChargingKw,
    acChargingTimeHours: val(flat.acChargingTimeHours),
    dcChargingTimeMinutes: val(flat.dcChargingTimeMinutes),
    airbags: val(flat.airbags),
    adas: val(flat.adas),
    powerPs: val(flat.powerPs),
    torqueNm: val(flat.torqueNm),
  };

  if (!fields.familySlug) {
    fields.familySlug = slug;
    manualNotes.push("familySlug_from_registry");
  }
  if (!fields.brand) {
    fields.brand = brand;
    manualNotes.push("brand_from_registry");
  }
  if (!fields.model) {
    fields.model = model;
    manualNotes.push("model_from_registry");
  }

  const features = {
    sunroof: Boolean(val(flat.sunroof)),
    ventilatedSeats: Boolean(val(flat.ventilatedSeats)),
    camera360: Boolean(val(flat.camera360)),
    connectedCar: Boolean(val(flat.connectedCar)),
    v2l: Boolean(val(flat.v2l)),
    v2v: Boolean(val(flat.v2v)),
    adas: Boolean(val(flat.adas)),
  };

  return {
    id: slug,
    displayName: `${brand} ${model}`.trim(),
    familySlug: slug,
    vehicle: { brand, model, bodyType: fields.bodyType, familySlug: slug },
    fields,
    features,
    variants,
    verificationLevel: manualNotes.length ? "manual_review" : "pipeline_review",
    sources: [
      registryEntry.officialUrl,
      ...(registryEntry.referenceUrls || []),
      registryEntry.brochureUrl ? "OEM brochure PDF" : null,
    ].filter(Boolean),
    verifiedAt: new Date().toISOString().slice(0, 10),
    populationMeta: {
      batch: "day1",
      pipelineConfidence: pipeline.confidenceScore ?? null,
      manualCorrections: manualNotes,
    },
  };
}

function verifyRegistryEntry(entry) {
  const issues = [];
  if (!entry?.officialUrl) issues.push("missing_oem_url");
  if (!entry?.vehicleKeywords?.length) issues.push("missing_keywords");
  if (entry?.flags?.unreachableUrl) issues.push("unreachable_oem_url");
  if (entry?.flags?.missingBrochure) issues.push("missing_brochure");
  return {
    ok: issues.filter((i) => i !== "missing_brochure").length === 0,
    issues,
    oemUrl: entry?.officialUrl,
    brochureUrl: entry?.brochureUrl || null,
    keywords: entry?.vehicleKeywords || [],
  };
}

function missingRequiredFields(dossier) {
  const missing = [];
  for (const key of REQUIRED_PUBLISH_FIELDS) {
    if (!dossier.fields?.[key]) missing.push(key);
  }
  if (!dossier.variants?.length) missing.push("variants");
  return missing;
}

function writeDossierFiles(dossier) {
  fs.mkdirSync(PUBLIC_GOLDEN, { recursive: true });
  fs.mkdirSync(DOCS_GOLDEN, { recursive: true });
  const file = `${dossier.familySlug}.json`;
  const json = JSON.stringify(dossier, null, 2);
  fs.writeFileSync(path.join(PUBLIC_GOLDEN, file), json);
  fs.writeFileSync(path.join(DOCS_GOLDEN, file), json);
}

function updateManifests(newEntries) {
  for (const manifestPath of [MANIFEST_PUBLIC, MANIFEST_DOCS]) {
    let manifest = { version: "golden-v1", vehicles: [] };
    if (fs.existsSync(manifestPath)) {
      manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    }
    const bySlug = new Map(manifest.vehicles.map((v) => [v.familySlug, v]));
    for (const d of newEntries) {
      bySlug.set(d.familySlug, {
        id: d.id,
        displayName: d.displayName,
        familySlug: d.familySlug,
        verificationLevel: d.verificationLevel,
        variantCount: d.variants.length,
      });
    }
    manifest.vehicles = [...bySlug.values()];
    manifest.count = manifest.vehicles.length;
    manifest.generatedAt = new Date().toISOString();
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  }
}

async function processVehicle(registryEntry) {
  const slug = registryEntry.familySlug;
  const manualNotes = [];
  const registryCheck = verifyRegistryEntry(registryEntry);

  const job = {
    id: `day1_${slug}`,
    status: "acquiring",
    oemUrl: registryEntry.officialUrl,
    brochureUrl: registryEntry.brochureUrl,
    referenceUrls: registryEntry.referenceUrls || [],
    familySlug: slug,
  };

  const pipelineResult = await runEvidencePipelineV7({
    importId: `day1-${slug}`,
    oemUrl: registryEntry.officialUrl,
    brochureUrl: registryEntry.brochureUrl,
    referenceUrls: registryEntry.referenceUrls || [],
    familySlug: slug,
    goldenId: slug,
  });

  if (!pipelineResult.ok) {
    return {
      vehicle: registryEntry.displayName || slug,
      familySlug: slug,
      variants: 0,
      status: "ACQUISITION_FAILED",
      manualCorrections: [],
      publishSuccess: false,
      errors: pipelineResult.errors,
      registryCheck,
    };
  }

  const evidencePacket = buildEvidencePacket(pipelineResult, {
    importId: `day1-${slug}`,
    oemUrl: registryEntry.officialUrl,
    brochureUrl: registryEntry.brochureUrl,
    familySlug: slug,
  });

  const golden = buildGoldenDossier(registryEntry, pipelineResult, manualNotes);
  const missing = missingRequiredFields(golden);

  const gate = checkPublishQualityGates(
    {
      reviewedVehicle: pipelineResult.reviewedVehicle,
      evidenceSummary: pipelineResult.mergedFields,
    },
    pipelineResult.evidenceRecords || [],
    null,
    {
      requireEvidenceTraceability: false,
      blockOnVariantCountMismatch: false,
      minPriceConfidence: 0,
    }
  );

  let publishSuccess = false;
  if (missing.length === 0 && gate.ok) {
    writeDossierFiles(golden);
    publishSuccess = true;
  }

  const scored = scoreVehicle(golden);
  const scorePresent = scored.overall?.score != null;

  return {
    vehicle: golden.displayName,
    familySlug: slug,
    variants: golden.variants.length,
    status: publishSuccess ? "PUBLISHED" : missing.length ? "REVIEW_REQUIRED" : "GATE_BLOCKED",
    manualCorrections: golden.populationMeta.manualCorrections,
    publishSuccess,
    missingFields: missing,
    gateFailures: gate.failures?.map((f) => f.message) || [],
    confidence: pipelineResult.confidenceScore,
    score: scored.overall?.score ?? null,
    grade: scored.overall?.grade ?? null,
    scorePresent,
    recommendation: pipelineResult.status === "review_required" ? "REVIEW_REQUIRED" : "READY",
    registryCheck,
    dossier: golden,
  };
}

function validateSeoPool(allDossiers) {
  const variantSpecs = SEO_PAGE_SPECS.filter((s) => s.variantRole);
  const seoResults = [];

  for (const spec of variantSpecs) {
    const generated = generateSeoContent(spec, allDossiers);
    const complete =
      generated.ok && !(generated.missingFields?.length > 0);
    seoResults.push({
      specId: spec.id,
      ok: complete,
      metaDescriptionLen: generated.seoPage?.metaDescription?.length ?? 0,
      rankedCount: generated.seoPage?.rankedVehicles?.length ?? 0,
    });
  }

  const day1InPool = DAY1_SLUGS.filter((slug) =>
    allDossiers.some((d) => d.familySlug === slug)
  );

  const catalogBestValue = generateSeoContent(
    SEO_PAGE_SPECS.find((s) => s.id === "variant-best-value-catalog"),
    allDossiers
  );
  const rankedSlugs = (catalogBestValue.seoPage?.rankedVehicles || []).map(
    (r) => r.slug || r.familySlug
  );
  const variantRecommendationsPresent = DAY1_SLUGS.some((slug) =>
    rankedSlugs.includes(slug)
  );

  return {
    variantSpecsChecked: seoResults.length,
    variantSpecsOk: seoResults.filter((r) => r.ok).length,
    day1InPool: day1InPool.length,
    variantRecommendationsPresent,
    seoMetadataGenerated: seoResults.every((r) => r.metaDescriptionLen >= 50),
    details: seoResults,
  };
}

async function regenerateReportFromPublished() {
  const registry = JSON.parse(fs.readFileSync(REGISTRY_PATH, "utf8"));
  const results = [];

  for (const slug of DAY1_SLUGS) {
    const entry = registry.find((r) => r.familySlug === slug);
    const dossierPath = path.join(PUBLIC_GOLDEN, `${slug}.json`);
    if (!fs.existsSync(dossierPath)) {
      results.push({
        vehicle: slug,
        familySlug: slug,
        variants: 0,
        status: "NOT_PUBLISHED",
        manualCorrections: [],
        publishSuccess: false,
        registryCheck: verifyRegistryEntry(entry),
      });
      continue;
    }
    const dossier = JSON.parse(fs.readFileSync(dossierPath, "utf8"));
    const scored = scoreVehicle(dossier);
    results.push({
      vehicle: dossier.displayName,
      familySlug: slug,
      variants: dossier.variants?.length ?? 0,
      status: "PUBLISHED",
      manualCorrections: dossier.populationMeta?.manualCorrections || [],
      publishSuccess: true,
      missingFields: missingRequiredFields(dossier),
      gateFailures: [],
      confidence: dossier.populationMeta?.pipelineConfidence ?? null,
      score: scored.overall?.score ?? null,
      grade: scored.overall?.grade ?? null,
      scorePresent: scored.overall?.score != null,
      recommendation: "REVIEW_REQUIRED",
      registryCheck: verifyRegistryEntry(entry),
    });
  }

  return results;
}

async function main() {
  const reportOnly = process.argv.includes("--report-only");
  const registry = JSON.parse(fs.readFileSync(REGISTRY_PATH, "utf8"));
  let results = [];

  if (reportOnly) {
    results = await regenerateReportFromPublished();
  } else {
    for (const slug of DAY1_SLUGS) {
      const entry = registry.find((r) => r.familySlug === slug);
      if (!entry) {
        results.push({
          vehicle: slug,
          familySlug: slug,
          variants: 0,
          status: "NOT_IN_REGISTRY",
          manualCorrections: [],
          publishSuccess: false,
        });
        continue;
      }
      console.log(`Processing ${slug}…`);
      const row = await processVehicle(entry);
      results.push(row);
      console.log(`  → ${row.status} (${row.variants} variants)`);
    }

    const published = results.filter((r) => r.publishSuccess);
    if (published.length) {
      updateManifests(published.map((r) => r.dossier));
    }
  }

  const published = results.filter((r) => r.publishSuccess);
  const existingGolden = [];
  if (fs.existsSync(MANIFEST_PUBLIC)) {
    const manifest = JSON.parse(fs.readFileSync(MANIFEST_PUBLIC, "utf8"));
    for (const v of manifest.vehicles) {
      if (DAY1_SLUGS.includes(v.familySlug)) continue;
      const p = path.join(PUBLIC_GOLDEN, `${v.familySlug}.json`);
      if (fs.existsSync(p)) {
        existingGolden.push(JSON.parse(fs.readFileSync(p, "utf8")));
      }
    }
  }

  const day1Dossiers = DAY1_SLUGS.map((slug) => {
    const p = path.join(PUBLIC_GOLDEN, `${slug}.json`);
    return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, "utf8")) : null;
  }).filter(Boolean);

  const allDossiers = [...existingGolden, ...day1Dossiers];
  const seoValidation = validateSeoPool(allDossiers);

  const allPublished = results.every((r) => r.publishSuccess);
  const allScored = results.every((r) => r.scorePresent);
  const allRequired = results.every((r) => !(r.missingFields?.length));
  const ready =
    allPublished &&
    allScored &&
    allRequired &&
    seoValidation.variantRecommendationsPresent &&
    seoValidation.seoMetadataGenerated &&
    seoValidation.variantSpecsOk === seoValidation.variantSpecsChecked;

  const allManualVariantTables = results.every((r) =>
    (r.manualCorrections || []).includes("variant_table_manual")
  );

  const recommendation =
    ready && !allManualVariantTables ? "READY" : "REVIEW_REQUIRED";

  const payload = {
    generatedAt: new Date().toISOString(),
    batch: "day1",
    vehicles: DAY1_SLUGS,
    results: results.map(({ dossier, ...rest }) => rest),
    seoValidation,
    recommendation,
  };

  fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  fs.writeFileSync(REPORT_JSON, JSON.stringify(payload, null, 2));

  const table = results
    .map(
      (r) =>
        `| ${r.vehicle} | ${r.variants} | ${r.status} | ${(r.manualCorrections || []).join(", ") || "—"} | ${r.publishSuccess ? "Yes" : "No"} |`
    )
    .join("\n");

  const md = `# EV Catalog Population — Day 1 Report

Generated: ${payload.generatedAt}

## Recommendation

**${recommendation}**

## Summary

| Vehicle | Variants | Status | Manual corrections | Publish success |
|---------|----------|--------|--------------------|-----------------|
${table}

## Validation

| Check | Result |
|-------|--------|
| All published | ${allPublished ? "Yes" : "No"} |
| Scores present | ${allScored ? "Yes" : "No"} |
| Required fields complete | ${allRequired ? "Yes" : "No"} |
| Variant recommendations in SEO pool | ${seoValidation.variantRecommendationsPresent ? "Yes" : "No"} |
| SEO metadata generated | ${seoValidation.seoMetadataGenerated ? "Yes" : "No"} |
| SEO variant specs (${seoValidation.variantSpecsOk}/${seoValidation.variantSpecsChecked}) | ${seoValidation.variantSpecsOk === seoValidation.variantSpecsChecked ? "Yes" : "Partial"} |

## Per-vehicle detail

${results
  .map(
    (r) => `### ${r.vehicle}
- **Status:** ${r.status}
- **Confidence:** ${r.confidence ?? "—"}
- **Score:** ${r.score ?? "—"} (${r.grade ?? "—"})
- **Registry:** OEM ${r.registryCheck?.oemUrl ? "OK" : "MISSING"}, keywords ${r.registryCheck?.keywords?.length ?? 0}
- **Gate failures:** ${(r.gateFailures || []).join("; ") || "none"}
- **Missing fields:** ${(r.missingFields || []).join(", ") || "none"}
`
  )
  .join("\n")}

See [\`day1-report.json\`](./day1-report.json).
`;

  fs.writeFileSync(REPORT_PATH, md);

  console.log(`\nRecommendation: ${recommendation}`);
  console.log(`Report: ${REPORT_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
