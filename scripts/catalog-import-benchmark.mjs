/**
 * Catalog acquisition v4 benchmark — evaluate extraction quality vs golden dataset.
 *
 * Usage:
 *   npm run catalog-import:build-golden
 *   npm run catalog-import:benchmark
 *   npm run catalog-import:benchmark -- --vehicle tata-nexon-ev
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { runEvidencePipeline } from "../src/catalogAcquisition/evidencePipelineCore.js";
import { EVIDENCE_SOURCE_TYPE } from "../src/catalogAcquisition/constants.js";
import { runFullBenchmarkReport, aggregateBenchmarkResults } from "../src/catalogAcquisition/benchmark/benchmarkReport.js";
import { loadAllGoldenDossiers, loadGoldenDossier } from "../src/catalogAcquisition/benchmark/goldenLoaderNode.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPORT_DIR = path.resolve(__dirname, "../docs/catalog/benchmark-reports");

import { BENCHMARK_SAMPLE_HTML } from "../src/catalogAcquisition/benchmark/benchmarkFixtures.js";

function parseArgs(argv) {
  const vehicleIdx = argv.indexOf("--vehicle");
  return {
    vehicleId: vehicleIdx >= 0 ? argv[vehicleIdx + 1] : null,
    skipPipeline: argv.includes("--skip-pipeline"),
  };
}

async function runPipelineForGolden(goldenId) {
  const html = BENCHMARK_SAMPLE_HTML[goldenId];
  if (!html) {
    throw new Error(`No sample HTML for ${goldenId}`);
  }

  const pipeline = await runEvidencePipeline({
    importId: `benchmark-${goldenId}`,
    sources: [
      {
        type: EVIDENCE_SOURCE_TYPE.OEM_WEBSITE,
        name: "Benchmark OEM",
        url: `https://benchmark.evsavari.local/${goldenId}`,
        content: html,
      },
    ],
  });

  if (!pipeline.ok) {
    throw new Error(pipeline.errors?.join("; ") || "Pipeline failed");
  }

  return {
    id: `benchmark-${goldenId}`,
    extractedVehicle: pipeline.extractedVehicle,
    reviewedVehicle: pipeline.reviewedVehicle,
    evidenceSummary: pipeline.mergedFields,
    evidenceRecords: pipeline.evidenceRecords,
    confidenceScore: pipeline.confidenceScore,
  };
}

function pct(n) {
  return n == null ? "—" : `${Math.round(n * 1000) / 10}%`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!fs.existsSync(path.join(REPORT_DIR, "..", "golden-dataset", "manifest.json"))) {
    console.error("Golden dataset missing. Run: npm run catalog-import:build-golden");
    process.exit(1);
  }

  const dossiers = args.vehicleId
    ? [{ entry: { id: args.vehicleId }, dossier: loadGoldenDossier(args.vehicleId) }]
    : loadAllGoldenDossiers();

  fs.mkdirSync(REPORT_DIR, { recursive: true });
  const reports = [];

  console.log("\n=== catalog-import:benchmark (v4) ===\n");

  for (const { entry, dossier } of dossiers) {
    console.log(`Evaluating: ${dossier.displayName} (${entry.id})`);

    const importRecord = args.skipPipeline
      ? {
          id: `static-${entry.id}`,
          extractedVehicle: { vehicle: { familySlug: { value: dossier.familySlug } } },
          reviewedVehicle: { vehicle: { familySlug: { value: dossier.familySlug } } },
          evidenceSummary: {},
        }
      : await runPipelineForGolden(entry.id);

    const report = runFullBenchmarkReport({
      importRecord,
      goldenDossier: dossier,
      evidenceRecords: importRecord.evidenceRecords || [],
    });

    reports.push(report);

    const e = report.evaluation;
    console.log(
      `  Field ${pct(e?.fieldAccuracy)} | Variant ${pct(e?.variantAccuracy)} | Price ${pct(e?.priceAccuracy)} | Feature ${pct(e?.featureAccuracy)}`
    );
    console.log(
      `  Quality gates: ${report.qualityGates.passed ? "PASS" : "FAIL"} (${report.qualityGates.failureCount} failures)`
    );
    if (report.hallucination.criticalCount) {
      console.log(`  Hallucinations: ${report.hallucination.criticalCount} critical`);
    }

    const outFile = path.join(REPORT_DIR, `${entry.id}.json`);
    fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
  }

  const aggregate = aggregateBenchmarkResults(reports);
  fs.writeFileSync(path.join(REPORT_DIR, "aggregate.json"), JSON.stringify(aggregate, null, 2));

  const publicReportDir = path.resolve(__dirname, "../public/catalog/benchmark-reports");
  fs.mkdirSync(publicReportDir, { recursive: true });
  fs.copyFileSync(
    path.join(REPORT_DIR, "aggregate.json"),
    path.join(publicReportDir, "aggregate.json")
  );

  console.log("\n--- Aggregate ---");
  console.log(`Vehicles: ${aggregate.evaluatedCount}/${aggregate.vehicleCount}`);
  console.log(`Avg field accuracy: ${pct(aggregate.averageFieldAccuracy)}`);
  console.log(`Avg variant accuracy: ${pct(aggregate.averageVariantAccuracy)}`);
  console.log(`Avg price accuracy: ${pct(aggregate.averagePriceAccuracy)}`);
  console.log(`Quality gate pass rate: ${pct(aggregate.qualityGatePassRate)}`);
  console.log(`\nReports written to docs/catalog/benchmark-reports/\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
