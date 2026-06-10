/**
 * v7.1 final sprint delta — compare stored v7 baseline vs v7.1 pipeline.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import "./lib/bootstrapEnv.mjs";

import { runEvidencePipelineV7 } from "../src/catalogAcquisition/evidencePipelineV7.js";
import { loadGoldenDossier } from "../src/catalogAcquisition/benchmark/goldenLoaderNode.js";
import { runFullBenchmarkReport } from "../src/catalogAcquisition/benchmark/benchmarkReport.js";
import { flattenExtractionDraft, ALL_SCALAR_FIELD_KEYS } from "../src/catalogAcquisition/extractionSchema.js";
import { extractFieldValue } from "../src/catalogAcquisition/benchmark/compareUtils.js";
import { analyzeGateFailures } from "../src/catalogAcquisition/v6/gateFailureAnalysis.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const REGISTRY_PATH = path.join(ROOT, "public/catalog/source-registry.json");
const V7_BASELINE = path.join(ROOT, "docs/catalog/production-validation/v7-delta/v7-delta-results.json");
const OUT_DIR = path.join(ROOT, "docs/catalog/production-validation/v7.1-delta");
const OUT_JSON = path.join(OUT_DIR, "v7.1-delta-results.json");
const OUT_MD = path.join(OUT_DIR, "v7.1-delta-report.md");

const PRIORITY_IDS = ["tata-nexon-ev", "mg-windsor-ev", "hyundai-creta-electric"];

const VEHICLE_IDS = [
  "tata-curvv-ev",
  "tata-nexon-ev",
  "tata-punch-ev",
  "mahindra-be-6",
  "mahindra-xev-9e",
  "mg-windsor-ev",
  "mg-zs-ev",
  "hyundai-creta-electric",
  "byd-atto-3",
];

const V71_TARGETS = {
  coveragePct: 90,
  qualityGatePassRate: 75,
  manualCorrectionsMax: 10,
  publishReadinessScore: 70,
  priceAccuracyPct: 70,
  variantGapReductionPct: 50,
};

const DEFAULT_PDF_DIRS = [
  path.join(ROOT, "docs/catalog/validation-sources"),
  path.join(ROOT, "data-acquisition/incoming"),
];

function goldenExpectedFieldCount(golden) {
  const fields = { ...(golden.fields || {}), ...(golden.features || {}) };
  return Object.entries(fields).filter(([, v]) => v !== null && v !== undefined && v !== "").length;
}

function countExtractedFields(extractedDraft) {
  const flat = flattenExtractionDraft(extractedDraft);
  return ALL_SCALAR_FIELD_KEYS.filter((k) => {
    const v = extractFieldValue(flat[k]);
    return v !== null && v !== undefined && v !== "";
  }).length;
}

function computePublishReadinessScore(report, pipeline) {
  const eval_ = report.evaluation || {};
  const gates = report.qualityGates || {};
  const fieldAcc = (eval_.fieldAccuracy ?? 0) * 100;
  const variantAcc = (eval_.variantAccuracy ?? 0) * 100;
  const priceAcc = (eval_.priceAccuracy ?? 0) * 100;
  const featureAcc = (eval_.featureAccuracy ?? 0) * 100;
  const evidenceAvg = pipeline.confidenceScore ?? 0;
  const gateScore = gates.passed ? 100 : Math.max(0, 100 - (gates.failureCount || 0) * 15);
  return Math.min(
    100,
    Math.max(
      0,
      Math.round(fieldAcc * 0.25 + variantAcc * 0.2 + priceAcc * 0.2 + featureAcc * 0.15 + evidenceAvg * 0.1 + gateScore * 0.1)
    )
  );
}

function estimateManualCorrections(report, pipeline) {
  const eval_ = report.evaluation || {};
  const fieldWrong = (eval_.field?.total || 0) - (eval_.field?.correct || 0);
  const featureWrong = (eval_.feature?.total || 0) - (eval_.feature?.correct || 0);
  const priceWrong = (eval_.price?.total || 0) - (eval_.price?.correct || 0);
  const variantMissing = (eval_.variant?.goldenCount || 0) - (eval_.variant?.matchedCount || 0);
  const attention = pipeline.diagnostics?.attentionCount || 0;
  const conflicts = pipeline.diagnostics?.conflictCount || 0;
  const hallucinationCritical = report.hallucination?.criticalCount || 0;
  return fieldWrong + featureWrong + priceWrong + variantMissing + attention + conflicts + hallucinationCritical;
}

function variantCountGap(report) {
  const ev = report?.evaluation?.variant;
  if (!ev?.goldenCount) return null;
  return Math.max(0, ev.goldenCount - (ev.matchedCount || 0));
}

function findLocalPdf(vehicleId) {
  const names = [`${vehicleId}.pdf`, `${vehicleId.replace(/-/g, "_")}.pdf`];
  for (const dir of DEFAULT_PDF_DIRS) {
    if (!fs.existsSync(dir)) continue;
    for (const name of names) {
      const p = path.join(dir, name);
      if (fs.existsSync(p)) return fs.readFileSync(p);
    }
  }
  return null;
}

async function fetchPdfBuffer(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 45_000);
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "EVSavari-CatalogAcquisition/3.0", Accept: "application/pdf,*/*" },
      signal: controller.signal,
      redirect: "follow",
    });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 1024 || !buf.slice(0, 5).toString().startsWith("%PDF")) return null;
    return buf;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function resolvePdf(registryEntry) {
  const local = findLocalPdf(registryEntry.id);
  if (local) return { buffer: local, url: null };
  if (registryEntry.brochureUrl) {
    const buf = await fetchPdfBuffer(registryEntry.brochureUrl);
    if (buf) return { buffer: buf, url: registryEntry.brochureUrl };
  }
  return { buffer: null, url: null };
}

async function runV71(registryEntry, pdf) {
  const params = {
    importId: `v71-delta-${registryEntry.id}`,
    oemUrl: registryEntry.officialUrl,
    referenceUrls: registryEntry.referenceUrls || [],
    pdfBuffer: pdf.buffer,
    pdfName: pdf.buffer ? `${registryEntry.id}.pdf` : null,
    pdfUrl: pdf.url,
    familySlug: registryEntry.familySlug,
    goldenId: registryEntry.id,
  };

  const pipeline = await runEvidencePipelineV7(params);
  if (!pipeline.ok) return { ok: false, errors: pipeline.errors };

  let report = null;
  let gateAnalysis = null;
  try {
    const golden = loadGoldenDossier(registryEntry.id);
    const importRecord = {
      id: params.importId,
      extractedVehicle: pipeline.extractedVehicle,
      reviewedVehicle: pipeline.reviewedVehicle,
      evidenceSummary: pipeline.mergedFields,
    };
    report = runFullBenchmarkReport({
      importRecord,
      goldenDossier: golden,
      evidenceRecords: pipeline.evidenceRecords,
    });
    gateAnalysis = pipeline.v7?.gateFailureAnalysis || analyzeGateFailures({
      qualityGates: report.qualityGates,
      evaluation: report.evaluation,
      importRecord,
      goldenDossier: golden,
    });
  } catch {
    /* optional golden */
  }

  const golden = report ? loadGoldenDossier(registryEntry.id) : null;
  const expectedFields = golden ? goldenExpectedFieldCount(golden) : null;
  const extractedFields = countExtractedFields(pipeline.extractedVehicle);
  const coveragePct = expectedFields ? Math.round((extractedFields / expectedFields) * 1000) / 10 : null;

  return {
    ok: true,
    evidenceRecordCount: pipeline.diagnostics.evidenceRecordCount,
    variantCount: pipeline.diagnostics.variantCount,
    variantGap: variantCountGap(report),
    metrics: report
      ? {
          coveragePct,
          variantCoveragePct: report.evaluation?.variantAccuracy != null
            ? Math.round(report.evaluation.variantAccuracy * 1000) / 10
            : null,
          priceAccuracyPct: report.evaluation?.priceAccuracy != null
            ? Math.round(report.evaluation.priceAccuracy * 1000) / 10
            : null,
          featureCoveragePct: report.evaluation?.featureAccuracy != null
            ? Math.round(report.evaluation.featureAccuracy * 1000) / 10
            : null,
          publishReadinessScore: computePublishReadinessScore(report, pipeline),
        }
      : null,
    qualityGatesPassed: report?.qualityGates?.passed ?? false,
    manualCorrections: report ? estimateManualCorrections(report, pipeline) : null,
    gateFailureAnalysis: gateAnalysis,
  };
}

function aggregate(rows) {
  const ok = rows.filter((r) => r.after?.ok && r.after?.metrics);
  const avg = (key) => {
    const vals = ok.map((r) => r.after.metrics[key]).filter(Number.isFinite);
    return vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : null;
  };
  return {
    count: rows.length,
    benchmarked: ok.length,
    avgCoveragePct: avg("coveragePct"),
    avgPriceAccuracyPct: avg("priceAccuracyPct"),
    avgPublishReadinessScore: avg("publishReadinessScore"),
    qualityGatePassRate: ok.length
      ? Math.round((ok.filter((r) => r.after.qualityGatesPassed).length / ok.length) * 1000) / 10
      : 0,
    avgManualCorrections: ok.length
      ? Math.round((ok.reduce((s, r) => s + (r.after.manualCorrections || 0), 0) / ok.length) * 10) / 10
      : null,
    avgVariantGap: ok.length
      ? Math.round((ok.reduce((s, r) => s + (r.after.variantGap || 0), 0) / ok.length) * 10) / 10
      : null,
  };
}

function buildMarkdown(results, beforeAgg, afterAgg, priority) {
  const lines = [
    "# Catalog Acquisition v7.1 — Final Sprint Delta",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "## Success criteria vs v7.1",
    "",
    "| Target | Goal | v7.1 Actual | Met |",
    "|--------|------|-------------|-----|",
    `| Coverage | >${V71_TARGETS.coveragePct}% | ${afterAgg.avgCoveragePct ?? "—"}% | ${(afterAgg.avgCoveragePct ?? 0) >= V71_TARGETS.coveragePct ? "✓" : "✗"} |`,
    `| Gate pass | >${V71_TARGETS.qualityGatePassRate}% | ${afterAgg.qualityGatePassRate}% | ${afterAgg.qualityGatePassRate >= V71_TARGETS.qualityGatePassRate ? "✓" : "✗"} |`,
    `| Manual corrections | <${V71_TARGETS.manualCorrectionsMax} | ${afterAgg.avgManualCorrections ?? "—"} | ${(afterAgg.avgManualCorrections ?? 999) < V71_TARGETS.manualCorrectionsMax ? "✓" : "✗"} |`,
    `| Publish readiness | >${V71_TARGETS.publishReadinessScore} | ${afterAgg.avgPublishReadinessScore ?? "—"} | ${(afterAgg.avgPublishReadinessScore ?? 0) >= V71_TARGETS.publishReadinessScore ? "✓" : "✗"} |`,
    `| Price accuracy | >${V71_TARGETS.priceAccuracyPct}% | ${afterAgg.avgPriceAccuracyPct ?? "—"}% | ${(afterAgg.avgPriceAccuracyPct ?? 0) >= V71_TARGETS.priceAccuracyPct ? "✓" : "✗"} |`,
    "",
    "## v7 baseline vs v7.1",
    "",
    "| Metric | v7 | v7.1 | Δ |",
    "|--------|----|------|---|",
    `| Gate pass rate | ${beforeAgg.qualityGatePassRate}% | ${afterAgg.qualityGatePassRate}% | ${afterAgg.qualityGatePassRate - beforeAgg.qualityGatePassRate}% |`,
    `| Avg manual corrections | ${beforeAgg.avgManualCorrections ?? "—"} | ${afterAgg.avgManualCorrections ?? "—"} | ${(afterAgg.avgManualCorrections ?? 0) - (beforeAgg.avgManualCorrections ?? 0)} |`,
    `| Avg coverage | ${beforeAgg.avgCoveragePct ?? "—"}% | ${afterAgg.avgCoveragePct ?? "—"}% | ${(afterAgg.avgCoveragePct ?? 0) - (beforeAgg.avgCoveragePct ?? 0)}% |`,
    `| Avg price accuracy | ${beforeAgg.avgPriceAccuracyPct ?? "—"}% | ${afterAgg.avgPriceAccuracyPct ?? "—"}% | ${(afterAgg.avgPriceAccuracyPct ?? 0) - (beforeAgg.avgPriceAccuracyPct ?? 0)}% |`,
    `| Avg variant gap | ${beforeAgg.avgVariantGap ?? "—"} | ${afterAgg.avgVariantGap ?? "—"} | ${(afterAgg.avgVariantGap ?? 0) - (beforeAgg.avgVariantGap ?? 0)} |`,
    "",
    "## Priority vehicles (variant count recovery)",
    "",
    "| Vehicle | v7 variants | v7.1 variants | v7 gap | v7.1 gap | v7 gates | v7.1 gates |",
    "|---------|-------------|---------------|--------|----------|----------|------------|",
  ];

  for (const id of PRIORITY_IDS) {
    const row = results.find((r) => r.id === id);
    if (!row) continue;
    lines.push(
      `| ${id} | ${row.before?.variantCount ?? "—"} | ${row.after?.variantCount ?? "—"} | ${row.before?.variantGap ?? "—"} | ${row.after?.variantGap ?? "—"} | ${row.before?.qualityGatesPassed ? "PASS" : "FAIL"} | ${row.after?.qualityGatesPassed ? "PASS" : "FAIL"} |`
    );
  }

  lines.push("", "## Per-vehicle summary", "");
  for (const r of results) {
    lines.push(
      `- **${r.id}**: gates ${r.after?.qualityGatesPassed ? "PASS" : "FAIL"}, variants ${r.after?.variantCount ?? "—"}, gap ${r.after?.variantGap ?? "—"}, manual ${r.after?.manualCorrections ?? "—"}`
    );
  }

  lines.push("", "## Freeze recommendation", "");
  if (
    afterAgg.qualityGatePassRate >= V71_TARGETS.qualityGatePassRate &&
    (afterAgg.avgManualCorrections ?? 999) < V71_TARGETS.manualCorrectionsMax
  ) {
    lines.push("✓ **Ready to freeze** catalog acquisition and proceed to Vehicle Creation Agent.");
  } else {
    lines.push("✗ **Targets not fully met** — freeze for bug fixes only; VCA should own residual human review fields.");
  }

  return lines.join("\n");
}

async function main() {
  const onlyId = process.argv.find((a) => a.startsWith("--vehicle="))?.split("=")[1];
  const registry = JSON.parse(fs.readFileSync(REGISTRY_PATH, "utf8"));
  const byId = Object.fromEntries(registry.map((e) => [e.id, e]));
  const ids = onlyId ? [onlyId] : VEHICLE_IDS;
  const entries = ids.map((id) => byId[id]).filter(Boolean);

  const baseline = fs.existsSync(V7_BASELINE)
    ? JSON.parse(fs.readFileSync(V7_BASELINE, "utf8"))
    : { results: [] };
  const baselineById = Object.fromEntries((baseline.results || []).map((r) => [r.id, r.v7]));

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const results = [];
  for (const entry of entries) {
    console.log(`\n=== ${entry.id} ===`);
    const pdf = await resolvePdf(entry);
    const before = baselineById[entry.id];
    console.log("  v7.1…");
    const after = await runV71(entry, pdf);
    console.log(
      `    variants=${after.variantCount ?? "n/a"} gap=${after.variantGap ?? "n/a"} price=${after.metrics?.priceAccuracyPct ?? "n/a"}% gates=${after.qualityGatesPassed ? "PASS" : "FAIL"}`
    );
    results.push({
      id: entry.id,
      before: before?.ok
        ? {
            variantCount: before.variantCount,
            variantGap: variantCountGap(before.v7Meta?.benchmarkReport),
            qualityGatesPassed: before.qualityGatesPassed,
            manualCorrections: before.manualCorrections,
            metrics: before.metrics,
          }
        : null,
      after,
    });
  }

  const beforeRows = results.filter((r) => r.before?.metrics).map((r) => ({ after: { ...r.before, ok: true, metrics: r.before.metrics } }));
  const beforeAgg = aggregate(beforeRows.length ? beforeRows : results.map((r) => ({ after: { ok: false } })));
  const afterAgg = aggregate(results);

  const payload = { generatedAt: new Date().toISOString(), targets: V71_TARGETS, before: beforeAgg, after: afterAgg, results };
  fs.writeFileSync(OUT_JSON, JSON.stringify(payload, null, 2));
  fs.writeFileSync(OUT_MD, buildMarkdown(results, beforeAgg, afterAgg));

  console.log("\n=== Delta ===");
  console.log(JSON.stringify({ before: beforeAgg, after: afterAgg }, null, 2));
  console.log(`\nWrote ${OUT_MD}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
