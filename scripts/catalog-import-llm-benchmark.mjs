/**
 * LLM provider benchmark — OpenAI vs Anthropic vs Heuristic on golden dataset.
 *
 * Usage:
 *   npm run catalog-import:llm-benchmark
 *   npm run catalog-import:llm-benchmark -- --vehicle tata-nexon-ev
 *   npm run catalog-import:llm-benchmark -- --providers openai,anthropic,heuristic
 *
 * Requires OPENAI_API_KEY and/or ANTHROPIC_API_KEY for LLM providers.
 */

import "./lib/bootstrapEnv.mjs";

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { resolveAiExtractionConfig } from "../src/catalogAcquisition/ai/config.js";

import { loadAllGoldenDossiers, loadGoldenDossier } from "../src/catalogAcquisition/benchmark/goldenLoaderNode.js";
import {
  runProviderBenchmark,
  aggregateLlmProviderResults,
  buildProviderComparisonReport,
  BENCHMARK_PROVIDER_IDS,
} from "../src/catalogAcquisition/benchmark/llmBenchmark.js";
import { buildCostReport } from "../src/catalogAcquisition/benchmark/costAnalysis.js";
import { recommendProvider } from "../src/catalogAcquisition/benchmark/providerRecommendation.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPORT_DIR = path.resolve(__dirname, "../docs/catalog/benchmark-reports/llm");
const PUBLIC_DIR = path.resolve(__dirname, "../public/catalog/benchmark-reports");

function pct(n) {
  return n == null || !Number.isFinite(n) ? "—" : `${Math.round(n * 1000) / 10}%`;
}

function keyStatus(name) {
  const value = process.env[name] || process.env[`VITE_${name}`];
  if (!value?.trim()) return "Absent";
  const s = value.trim();
  const masked = s.length <= 8 ? "****" : `${s.slice(0, 4)}...${s.slice(-4)}`;
  return `Present (masked: ${masked})`;
}

function printProviderDetection() {
  const openaiKey = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY || process.env.VITE_ANTHROPIC_API_KEY;
  const cfg = resolveAiExtractionConfig(process.env);

  console.log("Provider Detection:");
  console.log(`  OpenAI: ${openaiKey ? keyStatus("OPENAI_API_KEY") : "Absent"}`);
  console.log(`  Anthropic: ${anthropicKey ? keyStatus("ANTHROPIC_API_KEY") : "Absent"}`);
  if (process.env.CATALOG_AI_PROVIDER) {
    console.log(`  CATALOG_AI_PROVIDER: ${process.env.CATALOG_AI_PROVIDER}`);
  }
  if (cfg.model) {
    console.log(`  Selected model (${cfg.provider}): ${cfg.model}`);
  }
  console.log(`  Status: ${cfg.configured ? "Ready" : "Heuristic fallback only"}`);
  console.log("");
}

function parseArgs(argv) {
  const vehicleIdx = argv.indexOf("--vehicle");
  const providersIdx = argv.indexOf("--providers");
  return {
    vehicleId: vehicleIdx >= 0 ? argv[vehicleIdx + 1] : null,
    providers:
      providersIdx >= 0 ?
        argv[providersIdx + 1].split(",").map((s) => s.trim().toLowerCase())
      : [
          BENCHMARK_PROVIDER_IDS.HEURISTIC,
          BENCHMARK_PROVIDER_IDS.OPENAI,
          BENCHMARK_PROVIDER_IDS.ANTHROPIC,
        ],
  };
}

function buildMarkdownReport({ comparison, costReport, recommendation }) {
  const lines = [
    "# LLM Extraction Benchmark Report",
    "",
    `Generated: ${comparison.generatedAt}`,
    "",
    "## Provider Comparison",
    "",
    "| Metric | Heuristic | OpenAI | Anthropic |",
    "|--------|-----------|--------|-----------|",
  ];

  const cmp = comparison.comparison;
  const row = (label, key, invert = false) => {
    const h = cmp[key]?.heuristic;
    const o = cmp[key]?.openai;
    const a = cmp[key]?.anthropic;
    const fmt = (v) => (invert && v != null ? pct(v) : pct(v));
    lines.push(`| ${label} | ${fmt(h)} | ${fmt(o)} | ${fmt(a)} |`);
  };

  row("Field Accuracy", "fieldAccuracy");
  row("Price Accuracy", "priceAccuracy");
  row("Variant Accuracy", "variantAccuracy");
  row("Feature Accuracy", "featureAccuracy");
  row("Coverage", "coverageScore");
  row("Hallucination Rate", "hallucinationRate");
  row("Gate Pass Rate", "gatePassRate");

  lines.push(
    "",
    "## Latency & Review Time",
    "",
    "| Provider | Avg Latency (ms) | Avg Review (min) |",
    "|----------|------------------|------------------|"
  );

  for (const p of comparison.providerAggregates) {
    lines.push(
      `| ${p.providerId} | ${p.avgLatencyMs ?? "—"} | ${p.avgReviewMinutes ?? "—"} |`
    );
  }

  lines.push("", "## Cost Analysis (USD / INR)", "");
  lines.push("| Provider | Per Vehicle | Per 100 Vehicles | Monthly Refresh (25) |");
  lines.push("|----------|-------------|------------------|----------------------|");

  for (const [id, c] of Object.entries(costReport.byProvider || {})) {
    lines.push(
      `| ${id} | $${c.costPerVehicleUsd} / ₹${c.costPerVehicleInr} | $${c.costPer100VehiclesUsd} / ₹${c.costPer100VehiclesInr} | $${c.monthlyRefreshUsd} / ₹${c.monthlyRefreshInr} |`
    );
  }

  lines.push(
    "",
    "## Recommendation",
    "",
    `**Default provider: \`${recommendation.recommended}\`**`,
    recommendation.recommendedModel ? ` (model: ${recommendation.recommendedModel})` : "",
    "",
    recommendation.reason,
    ""
  );

  if (recommendation.scores?.length) {
    lines.push("### Scores", "");
    for (const s of recommendation.scores) {
      lines.push(
        `- **${s.providerId}**: composite ${s.compositeScore} — accuracy ${pct(s.breakdown.accuracy)}, variant ${pct(s.breakdown.variantHandling)}, cost score ${s.breakdown.cost.toFixed(2)}, latency score ${s.breakdown.latency.toFixed(2)}`
      );
    }
  }

  return lines.join("\n");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  const manifestPath = path.resolve(__dirname, "../docs/catalog/golden-dataset/manifest.json");
  if (!fs.existsSync(manifestPath)) {
    console.error("Golden dataset missing. Run: npm run catalog-import:build-golden");
    process.exit(1);
  }

  const dossiers = args.vehicleId
    ? [{ entry: { id: args.vehicleId }, dossier: loadGoldenDossier(args.vehicleId) }]
    : loadAllGoldenDossiers();

  fs.mkdirSync(REPORT_DIR, { recursive: true });
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });

  console.log("\n=== catalog-import:llm-benchmark ===\n");
  printProviderDetection();
  console.log(`Providers: ${args.providers.join(", ")}`);
  console.log(`Vehicles: ${dossiers.length}\n`);

  const providerRuns = {};

  for (const providerId of args.providers) {
    providerRuns[providerId] = [];
    console.log(`--- ${providerId.toUpperCase()} ---`);

    for (const { entry, dossier } of dossiers) {
      process.stdout.write(`  ${dossier.displayName}… `);
      const result = await runProviderBenchmark({
        providerId,
        goldenDossier: dossier,
      });

      providerRuns[providerId].push(result);

      if (result.skipped) {
        console.log(`SKIP (${result.reason})`);
      } else if (!result.ok) {
        console.log(`FAIL (${result.errors?.join("; ")})`);
      } else {
        const m = result.metrics;
        console.log(
          `field ${pct(m.fieldAccuracy)} | variant ${pct(m.variantAccuracy)} | ${result.elapsedMs}ms`
        );
        fs.writeFileSync(
          path.join(REPORT_DIR, `${providerId}-${entry.id}.json`),
          JSON.stringify(result, null, 2)
        );
      }
    }
    console.log("");
  }

  const providerAggregates = args.providers.map((id) => {
    const runs = providerRuns[id];
    const model = runs.find((r) => r.model)?.model;
    return aggregateLlmProviderResults(id, runs, model);
  });

  const ranAggregates = providerAggregates.filter((p) => p.ran);
  const comparison = buildProviderComparisonReport(providerAggregates);
  const costReport = buildCostReport(ranAggregates);
  const recommendation = recommendProvider(ranAggregates, costReport);

  const fullReport = {
    ...comparison,
    costReport,
    recommendation,
  };

  fs.writeFileSync(path.join(REPORT_DIR, "comparison.json"), JSON.stringify(fullReport, null, 2));
  fs.writeFileSync(
    path.join(REPORT_DIR, "comparison.md"),
    buildMarkdownReport({ comparison, costReport, recommendation })
  );

  fs.copyFileSync(
    path.join(REPORT_DIR, "comparison.json"),
    path.join(PUBLIC_DIR, "llm-comparison.json")
  );

  console.log("=== Comparison Summary ===\n");
  console.log("| Metric            | Heuristic | OpenAI | Anthropic |");
  console.log("|-------------------|-----------|--------|-----------|");

  const printRow = (label, key) => {
    const c = comparison.comparison[key] || {};
    console.log(
      `| ${label.padEnd(17)} | ${pct(c.heuristic).padStart(9)} | ${pct(c.openai).padStart(6)} | ${pct(c.anthropic).padStart(9)} |`
    );
  };

  printRow("Field Accuracy", "fieldAccuracy");
  printRow("Price Accuracy", "priceAccuracy");
  printRow("Variant Accuracy", "variantAccuracy");
  printRow("Feature Accuracy", "featureAccuracy");
  printRow("Coverage", "coverageScore");
  printRow("Hallucination Rate", "hallucinationRate");
  printRow("Gate Pass Rate", "gatePassRate");

  console.log("\n--- Cost (per vehicle) ---");
  for (const [id, c] of Object.entries(costReport.byProvider)) {
    console.log(`  ${id}: $${c.costPerVehicleUsd} (₹${c.costPerVehicleInr})`);
  }

  console.log(`\n>>> Recommended default provider: ${recommendation.recommended}`);
  console.log(`    ${recommendation.reason}\n`);

  const openaiAgg = ranAggregates.find((p) => p.providerId === "openai");
  if (openaiAgg?.runs?.length) {
    const failureTotals = { missing_extraction: 0, wrong_extraction: 0, hallucination: 0, mapping_error: 0 };
    for (const run of openaiAgg.runs) {
      const fd = run.report?.failureDiagnostics;
      if (!fd?.counts) continue;
      for (const [k, v] of Object.entries(fd.counts)) {
        failureTotals[k] = (failureTotals[k] || 0) + v;
      }
    }
    console.log("--- OpenAI failure classification (aggregate) ---");
    console.log(`  Missing extraction: ${failureTotals.missing_extraction}`);
    console.log(`  Wrong extraction: ${failureTotals.wrong_extraction}`);
    console.log(`  Hallucination: ${failureTotals.hallucination}`);
    console.log(`  Mapping error: ${failureTotals.mapping_error}`);
    const totalGroundingRejected = openaiAgg.runs.reduce(
      (a, r) => a + (r.grounding?.rejectedCount || 0),
      0
    );
    console.log(`  Grounding rejections: ${totalGroundingRejected}`);
  }

  console.log(`Reports: docs/catalog/benchmark-reports/llm/comparison.json\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
