/**
 * Catalog acquisition smoke — v1 + v2 + v3 (no network for core; optional network demo).
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  normalizeExtractedContent,
  buildPublishPayload,
  confidenceBand,
  IMPORT_STATUS,
  EVIDENCE_SOURCE_TYPE,
  createEvidenceRecord,
  mergeEvidenceForField,
  runEvidencePipeline,
} from "../src/catalogAcquisition/index.js";
import { extractSourceToEvidence, mergeVariantExtractions } from "../src/catalogAcquisition/ai/extractToEvidence.js";
import { runEvidencePipelineV3 } from "../src/catalogAcquisition/evidencePipelineV3.js";
import { parsePdfBuffer, pdfParseToExtractionContent } from "../src/catalogAcquisition/acquisition/parsePdf.js";
import { initializeReviewedVehicle } from "../src/catalogAcquisition/normalizeExtracted.js";
import {
  snippetSupportedInContent,
  applyEvidenceGrounding,
  rejectUngroundedFields,
} from "../src/catalogAcquisition/ai/evidenceGrounding.js";
import {
  runFullBenchmarkReport,
  checkPublishQualityGates,
  detectHallucinations,
  buildEvidenceCoverageReport,
} from "../src/catalogAcquisition/benchmark/index.js";
import { loadGoldenDossier } from "../src/catalogAcquisition/benchmark/goldenLoaderNode.js";
import { runProviderBenchmark, BENCHMARK_PROVIDER_IDS } from "../src/catalogAcquisition/benchmark/llmBenchmark.js";

const sampleHtml = `
  <html><body>
  Tata Motors Nexon EV Max — SUV
  Ex-showroom price ₹18,49,000
  Battery 40 kWh · Range 453 km ARAI certified
  AC 7.2 kW · DC fast charge 50 kW
  Power 143 PS · Torque 215 Nm
  6 airbags · ADAS · 5 star NCAP
  Panoramic sunroof · ventilated seats · V2L
  Variant: Creative Plus
  </body></html>
`;

console.log("\n=== catalog-import:smoke ===\n");

// --- v1 ---
const normalized = normalizeExtractedContent(sampleHtml, { sourceType: "oem_url" });
assert.ok(normalized.extractedVehicle.vehicle.brand.value);
assert.ok(normalized.extractedVehicle.battery.batteryCapacityKwh.value);
assert.ok(normalized.confidenceScore > 0);
assert.equal(confidenceBand(96), "green");

const reviewed = initializeReviewedVehicle(normalized.extractedVehicle);
const payload = buildPublishPayload(reviewed);
assert.ok(payload.ok);
assert.ok(payload.vehicle.metadata?.features);
console.log("OK: v1 normalize + expanded publish payload");

// --- v2 merger ---
const batteryRecords = [
  createEvidenceRecord({
    importId: "test",
    fieldName: "batteryCapacityKwh",
    fieldValue: "55",
    sourceType: EVIDENCE_SOURCE_TYPE.OEM_PDF,
    sourceName: "Brochure",
    trustScore: 100,
    extractionMethod: "ai-openai",
    extractionConfidence: 98,
  }),
  createEvidenceRecord({
    importId: "test",
    fieldName: "batteryCapacityKwh",
    fieldValue: "55",
    sourceType: EVIDENCE_SOURCE_TYPE.OEM_WEBSITE,
    sourceName: "OEM",
    trustScore: 95,
    extractionConfidence: 95,
  }),
];
const batteryMerged = mergeEvidenceForField("batteryCapacityKwh", batteryRecords);
assert.equal(batteryMerged.value, "55");
assert.ok(batteryMerged.confidence >= 80);
console.log("OK: v2/v3 evidence merger confidence", batteryMerged.confidence);

// --- v3 AI/heuristic evidence extraction ---
const aiExtract = await extractSourceToEvidence({
  importId: "smoke",
  content: sampleHtml,
  sourceType: EVIDENCE_SOURCE_TYPE.OEM_WEBSITE,
  sourceName: "OEM",
  trustScore: 95,
});
assert.ok(aiExtract.ok);
assert.ok(aiExtract.records.length > 5);
console.log("OK: v3 evidence-aware extraction →", aiExtract.records.length, "records");

// --- v3 variant merge ---
const variants = mergeVariantExtractions([
  [{ variantName: "Creative+", price: { value: 1849000, confidence: 80 }, battery: { value: 40, confidence: 85 } }],
  [{ variantName: "creative+", price: { value: 1849000, confidence: 90 }, range: { value: 453, confidence: 88 } }],
]);
assert.equal(variants.length, 1);
console.log("OK: variant intelligence merge");

// --- v3 pipeline (inline content simulated as acquired) ---
const v3inline = await runEvidencePipeline({
  importId: "smoke-v2",
  sources: [
    { type: EVIDENCE_SOURCE_TYPE.OEM_PDF, content: sampleHtml, name: "PDF" },
    { type: EVIDENCE_SOURCE_TYPE.OEM_WEBSITE, content: sampleHtml, url: "https://example.com" },
  ],
});
assert.ok(v3inline.ok);
assert.ok(v3inline.attentionFields);
console.log("OK: v2 pipeline attention fields:", v3inline.attentionFields.length);

// --- evidence grounding (unit, no LLM) ---
assert.ok(snippetSupportedInContent("55 kWh", "Battery 55 kWh pack · Range 500 km"));
assert.ok(!snippetSupportedInContent("99 kWh invented", "Battery 55 kWh pack"));
const grounded = applyEvidenceGrounding(
  {
    fields: {
      brand: { value: "Tata", confidence: 90, sourceSnippet: "Tata Nexon EV", sourceType: "OEM_WEBSITE" },
      batteryCapacityKwh: {
        value: 99,
        confidence: 90,
        sourceSnippet: "99 kWh invented",
        sourceType: "OEM_WEBSITE",
      },
    },
  },
  "Tata Nexon EV — Battery 40 kWh",
  { sourceType: "OEM_WEBSITE" }
);
assert.ok(grounded.fields.brand);
assert.ok(!grounded.fields.batteryCapacityKwh);
assert.ok(grounded.grounding.rejectedCount >= 1);
console.log("OK: evidence grounding rejects unsupported fields");

// --- PDF parser (minimal valid buffer test skipped if no fixture) ---
const fixturePdf = process.env.CATALOG_TEST_PDF;
if (fixturePdf && fs.existsSync(fixturePdf)) {
  const buf = fs.readFileSync(fixturePdf);
  const parsed = await parsePdfBuffer(buf);
  assert.ok(parsed.ok);
  assert.ok(pdfParseToExtractionContent(parsed).length > 0);
  console.log("OK: PDF parse fixture", fixturePdf);
} else {
  console.log("SKIP: PDF fixture (set CATALOG_TEST_PDF for live PDF test)");
}

// --- optional network v3 (CATALOG_V3_NETWORK=1) ---
if (process.env.CATALOG_V3_NETWORK === "1") {
  const live = await runEvidencePipelineV3({
    importId: "smoke-live",
    oemUrl: "https://www.tatamotors.com/nexon/ev",
    referenceUrls: [],
  });
  assert.ok(live.ok, live.errors?.join("; "));
  console.log("OK: live v3 pipeline", live.diagnostics.elapsedMs, "ms");
}

// --- v4 benchmark framework ---
const goldenManifestPath = path.join("docs", "catalog", "golden-dataset", "manifest.json");
if (fs.existsSync(goldenManifestPath)) {
  const golden = loadGoldenDossier("tata-nexon-ev");
  assert.ok(golden.variants.length >= 4);
  const importRecord = {
    id: "smoke-v4",
    extractedVehicle: v3inline.extractedVehicle,
    reviewedVehicle: v3inline.reviewedVehicle,
    evidenceSummary: v3inline.mergedFields,
  };
  const report = runFullBenchmarkReport({
    importRecord,
    goldenDossier: golden,
    evidenceRecords: v3inline.evidenceRecords || [],
  });
  assert.ok(report.evaluation);
  assert.ok(report.calibration);
  assert.ok(report.evidenceCoverage);
  assert.ok(typeof report.qualityGates.passed === "boolean");
  console.log("OK: v4 benchmark report field accuracy", report.evaluation.fieldAccuracy);

  const hallucination = detectHallucinations({
    extractedDraft: {},
    mergedFields: {},
    evidenceRecords: [],
  });
  assert.equal(hallucination.count, 0);

  const coverage = buildEvidenceCoverageReport(v3inline.mergedFields);
  assert.ok(coverage.fieldCount > 10);

  const gates = checkPublishQualityGates(importRecord, v3inline.evidenceRecords || [], golden);
  assert.ok(typeof gates.failureCount === "number");
  console.log("OK: v4 quality gates checked", gates.failureCount, "failures");
} else {
  console.log("SKIP: v4 golden dataset (run npm run catalog-import:build-golden)");
}

// --- LLM benchmark (heuristic only, no API keys required) ---
const nexonGolden = fs.existsSync(goldenManifestPath) ? loadGoldenDossier("tata-nexon-ev") : null;
if (nexonGolden) {
  const llmRun = await runProviderBenchmark({
    providerId: BENCHMARK_PROVIDER_IDS.HEURISTIC,
    goldenDossier: nexonGolden,
  });
  assert.ok(llmRun.ok);
  assert.ok(llmRun.metrics);
  assert.ok(llmRun.report);
  console.log("OK: LLM benchmark runner (heuristic)", llmRun.metrics.fieldAccuracy);
}

// --- v5 URL validation (offline) ---
import { validateAcquiredUrl } from "../src/catalogAcquisition/acquisition/urlValidation.js";
import { discoverPdfCandidatesFromHtml } from "../src/catalogAcquisition/acquisition/pdfDiscovery.js";
import { buildAcquisitionMetrics } from "../src/catalogAcquisition/acquisition/acquisitionMetrics.js";
import { URL_VALIDATION_STATUS } from "../src/catalogAcquisition/constants.js";

const badRedirectHtml = `<html><head><title>EV Conference – JLR – Tata Motors</title></head><body>Corporate nav EV</body></html>`;
const badValidation = validateAcquiredUrl({
  requestedUrl: "https://www.tatamotors.com/curvv/ev",
  fetchResult: {
    ok: true,
    url: "https://www.tatamotors.com/curvv/ev",
    finalUrl: "https://www.tatamotors.com/events/ev-conference-presentation-jlr/",
    content: badRedirectHtml,
    status: 200,
  },
  brand: "Tata",
  model: "Curvv EV",
  vehicleKeywords: ["curvv"],
});
assert.equal(badValidation.valid, false);
assert.equal(badValidation.status, URL_VALIDATION_STATUS.INVALID_SOURCE);
console.log("OK: v5 URL validation rejects bad redirect");

const brochureHtml = `<a href="/downloads/curvv-brochure.pdf">Download brochure</a>`;
const pdfs = discoverPdfCandidatesFromHtml(brochureHtml, "https://example.com/curvv");
assert.ok(pdfs.length >= 1);
console.log("OK: v5 PDF discovery finds brochure href");

const metrics = buildAcquisitionMetrics({
  evidenceRecordCount: 8,
  rawHtmlSize: 62000,
  renderedTextSize: 5000,
  urlValid: false,
  pdfFound: false,
  oemAcquired: false,
});
assert.equal(metrics.acquisitionFailure, true);
console.log("OK: v5 acquisition metrics flag low evidence");

console.log("\n=== all catalog-import smoke checks passed ===\n");
