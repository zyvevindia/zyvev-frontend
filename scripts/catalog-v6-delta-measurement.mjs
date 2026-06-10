/**
 * v6 publish readiness delta — measure before (v3) vs after (v6).
 * Uses source-registry.json URLs. Does not modify acquisition or registry.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import "./lib/bootstrapEnv.mjs";

import { runEvidencePipelineV3 } from "../src/catalogAcquisition/evidencePipelineV3.js";
import { runEvidencePipelineV6 } from "../src/catalogAcquisition/evidencePipelineV6.js";
import { loadGoldenDossier } from "../src/catalogAcquisition/benchmark/goldenLoaderNode.js";
import { runFullBenchmarkReport } from "../src/catalogAcquisition/benchmark/benchmarkReport.js";
import { estimateReviewMinutes } from "../src/catalogAcquisition/benchmark/reviewTimeEstimate.js";
import { flattenExtractionDraft, ALL_SCALAR_FIELD_KEYS } from "../src/catalogAcquisition/extractionSchema.js";
import { extractFieldValue } from "../src/catalogAcquisition/benchmark/compareUtils.js";
import { analyzeGateFailures } from "../src/catalogAcquisition/v6/gateFailureAnalysis.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const REGISTRY_PATH = path.join(ROOT, "public/catalog/source-registry.json");
const OUT_DIR = path.join(ROOT, "docs/catalog/production-validation/v6-delta");
const OUT_JSON = path.join(OUT_DIR, "v6-delta-results.json");
const OUT_MD = path.join(OUT_DIR, "v6-delta-report.md");
const RERUN_BASELINE = path.join(ROOT, "docs/catalog/production-validation/audit-results-rerun.json");

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

const DEFAULT_PDF_DIRS = [
  path.join(ROOT, "docs/catalog/validation-sources"),
  path.join(ROOT, "data-acquisition/incoming"),
];

const V6_TARGETS = {
  coveragePct: 60,
  featureCoveragePct: 50,
  qualityGatePassRate: 50,
  manualCorrectionsMax: 10,
};

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
  return (
    fieldWrong + featureWrong + priceWrong + variantMissing + attention + conflicts + hallucinationCritical
  );
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

async function runPipeline(version, registryEntry, pdf) {
  const params = {
    importId: `v6-delta-${version}-${registryEntry.id}`,
    oemUrl: registryEntry.officialUrl,
    referenceUrls: registryEntry.referenceUrls || [],
    pdfBuffer: pdf.buffer,
    pdfName: pdf.buffer ? `${registryEntry.id}.pdf` : null,
    pdfUrl: pdf.url,
    familySlug: registryEntry.familySlug,
    goldenId: registryEntry.id,
  };

  const pipeline =
    version === "v6" ? await runEvidencePipelineV6(params) : await runEvidencePipelineV3(params);

  if (!pipeline.ok) {
    return { ok: false, errors: pipeline.errors, version };
  }

  let golden = null;
  let report = null;
  let gateAnalysis = null;
  try {
    golden = loadGoldenDossier(registryEntry.id);
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
    gateAnalysis =
      version === "v6" && pipeline.v6?.gateFailureAnalysis
        ? pipeline.v6.gateFailureAnalysis
        : analyzeGateFailures({
            qualityGates: report.qualityGates,
            evaluation: report.evaluation,
            importRecord,
            goldenDossier: golden,
          });
  } catch {
    /* no golden */
  }

  const expectedFields = golden ? goldenExpectedFieldCount(golden) : null;
  const extractedFields = countExtractedFields(pipeline.extractedVehicle);
  const coveragePct = expectedFields ? Math.round((extractedFields / expectedFields) * 1000) / 10 : null;

  return {
    ok: true,
    version,
    evidenceRecordCount: pipeline.diagnostics.evidenceRecordCount,
    variantCount: pipeline.diagnostics.variantCount,
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
    identity: pipeline.v6?.identity || null,
    variantReconcile: pipeline.v6
      ? {
          before: pipeline.v6.variantCountBeforeReconcile,
          after: pipeline.v6.variantCountAfterReconcile,
        }
      : null,
  };
}

function aggregate(rows) {
  const ok = rows.filter((r) => r.ok && r.metrics);
  const avg = (key) => {
    const vals = ok.map((r) => r.metrics[key]).filter(Number.isFinite);
    return vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : null;
  };
  return {
    count: rows.length,
    benchmarked: ok.length,
    avgEvidenceRecords: ok.length
      ? Math.round((ok.reduce((s, r) => s + r.evidenceRecordCount, 0) / ok.length) * 10) / 10
      : null,
    avgCoveragePct: avg("coveragePct"),
    avgFeatureCoveragePct: avg("featureCoveragePct"),
    avgPublishReadinessScore: avg("publishReadinessScore"),
    qualityGatePassRate: ok.length
      ? Math.round((ok.filter((r) => r.qualityGatesPassed).length / ok.length) * 1000) / 10
      : 0,
    avgManualCorrections: ok.length
      ? Math.round((ok.reduce((s, r) => s + (r.manualCorrections || 0), 0) / ok.length) * 10) / 10
      : null,
  };
}

function buildMarkdown(results, beforeAgg, afterAgg) {
  const lines = [
    "# Catalog Acquisition v6 — Publish Readiness Delta",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "## Targets vs v6",
    "",
    "| Target | Goal | v6 Actual | Met |",
    "|--------|------|-----------|-----|",
    `| Field coverage | >${V6_TARGETS.coveragePct}% | ${afterAgg.avgCoveragePct ?? "—"}% | ${(afterAgg.avgCoveragePct ?? 0) >= V6_TARGETS.coveragePct ? "✓" : "✗"} |`,
    `| Feature coverage | >${V6_TARGETS.featureCoveragePct}% | ${afterAgg.avgFeatureCoveragePct ?? "—"}% | ${(afterAgg.avgFeatureCoveragePct ?? 0) >= V6_TARGETS.featureCoveragePct ? "✓" : "✗"} |`,
    `| Quality gate pass | >${V6_TARGETS.qualityGatePassRate}% | ${afterAgg.qualityGatePassRate}% | ${afterAgg.qualityGatePassRate >= V6_TARGETS.qualityGatePassRate ? "✓" : "✗"} |`,
    `| Manual corrections | <${V6_TARGETS.manualCorrectionsMax} | ${afterAgg.avgManualCorrections ?? "—"} | ${(afterAgg.avgManualCorrections ?? 999) < V6_TARGETS.manualCorrectionsMax ? "✓" : "✗"} |`,
    "",
    "## Before (v3) vs After (v6)",
    "",
    "| Metric | v3 | v6 | Δ |",
    "|--------|----|----|---|",
    `| Avg evidence records | ${beforeAgg.avgEvidenceRecords ?? "—"} | ${afterAgg.avgEvidenceRecords ?? "—"} | ${delta(beforeAgg.avgEvidenceRecords, afterAgg.avgEvidenceRecords)} |`,
    `| Avg coverage | ${beforeAgg.avgCoveragePct ?? "—"}% | ${afterAgg.avgCoveragePct ?? "—"}% | ${delta(beforeAgg.avgCoveragePct, afterAgg.avgCoveragePct, "%")} |`,
    `| Avg feature coverage | ${beforeAgg.avgFeatureCoveragePct ?? "—"}% | ${afterAgg.avgFeatureCoveragePct ?? "—"}% | ${delta(beforeAgg.avgFeatureCoveragePct, afterAgg.avgFeatureCoveragePct, "%")} |`,
    `| Avg publish readiness | ${beforeAgg.avgPublishReadinessScore ?? "—"} | ${afterAgg.avgPublishReadinessScore ?? "—"} | ${delta(beforeAgg.avgPublishReadinessScore, afterAgg.avgPublishReadinessScore)} |`,
    `| Gate pass rate | ${beforeAgg.qualityGatePassRate}% | ${afterAgg.qualityGatePassRate}% | ${delta(beforeAgg.qualityGatePassRate, afterAgg.qualityGatePassRate, "%")} |`,
    `| Avg manual corrections | ${beforeAgg.avgManualCorrections ?? "—"} | ${afterAgg.avgManualCorrections ?? "—"} | ${delta(beforeAgg.avgManualCorrections, afterAgg.avgManualCorrections, "", true)} |`,
    "",
    "## Per-vehicle gate blockers (v6 top 10)",
    "",
  ];

  for (const r of results) {
    const analysis = r.v6?.gateFailureAnalysis;
    if (!analysis?.top10?.length) continue;
    lines.push(`### ${r.id}`, "");
    for (const item of analysis.top10.slice(0, 10)) {
      lines.push(`- **${item.fieldKey}** (${item.gate}, impact ${item.impact}): ${item.message}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

function delta(before, after, suffix = "", invert = false) {
  if (!Number.isFinite(before) || !Number.isFinite(after)) return "—";
  const d = Math.round((after - before) * 10) / 10;
  const sign = d > 0 ? "+" : "";
  const label = invert ? (d < 0 ? "✓" : "") : "";
  return `${sign}${d}${suffix}${label}`;
}

async function main() {
  const registry = JSON.parse(fs.readFileSync(REGISTRY_PATH, "utf8"));
  const byId = Object.fromEntries(registry.map((e) => [e.id, e]));
  const entries = VEHICLE_IDS.map((id) => byId[id]).filter(Boolean);

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const results = [];
  for (const entry of entries) {
    console.log(`\n=== ${entry.id} ===`);
    const pdf = await resolvePdf(entry);

    console.log("  v3…");
    const v3 = await runPipeline("v3", entry, pdf);
    console.log(
      `    evidence=${v3.evidenceRecordCount} coverage=${v3.metrics?.coveragePct ?? "n/a"}% gates=${v3.qualityGatesPassed ? "PASS" : "FAIL"}`
    );

    console.log("  v6…");
    const v6 = await runPipeline("v6", entry, pdf);
    console.log(
      `    evidence=${v6.evidenceRecordCount} coverage=${v6.metrics?.coveragePct ?? "n/a"}% features=${v6.metrics?.featureCoveragePct ?? "n/a"}% gates=${v6.qualityGatesPassed ? "PASS" : "FAIL"} identity=${v6.identity?.familySlug ?? "—"}`
    );

    results.push({ id: entry.id, v3, v6 });
  }

  const beforeAgg = aggregate(results.map((r) => r.v3));
  const afterAgg = aggregate(results.map((r) => r.v6));

  const payload = {
    generatedAt: new Date().toISOString(),
    targets: V6_TARGETS,
    before: beforeAgg,
    after: afterAgg,
    results,
  };

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
