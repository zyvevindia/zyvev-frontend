/**
 * Production validation audit — real OEM URLs + PDFs via v3/v4 pipeline.
 * Measurement only. Does not modify extraction, prompts, or benchmarks.
 *
 * Usage:
 *   node scripts/production-validation-audit.mjs
 *   node scripts/production-validation-audit.mjs --vehicle=tata-nexon-ev
 *   node scripts/production-validation-audit.mjs --pdf-dir=C:\ops\oem-brochures
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import "./lib/bootstrapEnv.mjs";

import { runEvidencePipelineV3 } from "../src/catalogAcquisition/evidencePipelineV3.js";
import { loadGoldenDossier } from "../src/catalogAcquisition/benchmark/goldenLoaderNode.js";
import { runFullBenchmarkReport } from "../src/catalogAcquisition/benchmark/benchmarkReport.js";
import { estimateReviewMinutes } from "../src/catalogAcquisition/benchmark/reviewTimeEstimate.js";
import { flattenExtractionDraft, ALL_SCALAR_FIELD_KEYS } from "../src/catalogAcquisition/extractionSchema.js";
import { extractFieldValue } from "../src/catalogAcquisition/benchmark/compareUtils.js";
import { evaluateExtractionAgainstGolden } from "../src/catalogAcquisition/benchmark/evaluateExtraction.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "docs/catalog/production-validation");
const OUT_JSON = path.join(OUT_DIR, "audit-results.json");
const OUT_MD = path.join(OUT_DIR, "production-validation-audit.md");
const DEFAULT_PDF_DIRS = [
  path.join(ROOT, "docs/catalog/validation-sources"),
  path.join(ROOT, "data-acquisition/incoming"),
];

const VALIDATION_VEHICLES = [
  {
    id: "tata-curvv-ev",
    name: "Tata Curvv EV",
    oemUrl: "https://www.tatamotors.com/curvv/ev",
    referenceUrls: ["https://www.cardekho.com/tata/curvv-ev"],
  },
  {
    id: "tata-nexon-ev",
    name: "Tata Nexon EV",
    oemUrl: "https://www.tatamotors.com/nexon/ev",
    referenceUrls: ["https://www.cardekho.com/tata/nexon-ev"],
  },
  {
    id: "mahindra-be-6",
    name: "Mahindra BE 6",
    oemUrl: "https://www.mahindra.com/be6",
    referenceUrls: ["https://www.cardekho.com/mahindra/be-6"],
  },
  {
    id: "mg-windsor-ev",
    name: "MG Windsor EV",
    oemUrl: "https://www.mgmotor.co.in/vehicles/windsor-ev",
    referenceUrls: ["https://www.cardekho.com/mg/windsor-ev"],
  },
  {
    id: "byd-atto-3",
    name: "BYD Atto 3",
    oemUrl: "https://www.bydauto.co.in/atto-3",
    referenceUrls: ["https://www.cardekho.com/byd/atto-3"],
  },
];

function arg(name) {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split("=").slice(1).join("=") : null;
}

function goldenExpectedFieldCount(golden) {
  const fields = { ...(golden.fields || {}), ...(golden.features || {}) };
  return Object.entries(fields).filter(
    ([, v]) => v !== null && v !== undefined && v !== ""
  ).length;
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
  const coverage = report.evidenceCoverage || {};
  const fieldAcc = (eval_.fieldAccuracy ?? 0) * 100;
  const variantAcc = (eval_.variantAccuracy ?? 0) * 100;
  const priceAcc = (eval_.priceAccuracy ?? 0) * 100;
  const featureAcc = (eval_.featureAccuracy ?? 0) * 100;
  const evidenceAvg = coverage.averageEvidenceQuality ?? pipeline.confidenceScore ?? 0;
  const gateScore = gates.passed ? 100 : Math.max(0, 100 - (gates.failureCount || 0) * 15);
  const score = Math.round(
    fieldAcc * 0.25 +
      variantAcc * 0.2 +
      priceAcc * 0.2 +
      featureAcc * 0.15 +
      evidenceAvg * 0.1 +
      gateScore * 0.1
  );
  return Math.min(100, Math.max(0, score));
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
  return {
    fieldCorrections: fieldWrong,
    featureCorrections: featureWrong,
    priceCorrections: priceWrong,
    variantCorrections: variantMissing,
    attentionFields: attention,
    conflictFields: conflicts,
    hallucinationCritical,
    totalEstimated:
      fieldWrong +
      featureWrong +
      priceWrong +
      variantMissing +
      attention +
      conflicts +
      hallucinationCritical,
  };
}

function findLocalPdf(vehicleId, pdfDirs) {
  const names = [
    `${vehicleId}.pdf`,
    `${vehicleId.replace(/-/g, "_")}.pdf`,
    `${vehicleId.replace(/-/g, "")}.pdf`,
  ];
  for (const dir of pdfDirs) {
    if (!dir || !fs.existsSync(dir)) continue;
    for (const name of names) {
      const p = path.join(dir, name);
      if (fs.existsSync(p)) return p;
    }
  }
  return null;
}

function discoverPdfUrls(html, baseUrl) {
  const urls = new Set();
  const re = /href=["']([^"']+\.pdf[^"']*)["']/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    try {
      const u = new URL(m[1], baseUrl).href;
      if (/brochure|spec|download|e-brochure|ebrochure|factsheet|technical/i.test(u)) {
        urls.add(u);
      }
    } catch {
      /* skip */
    }
  }
  return [...urls];
}

async function fetchPdfBuffer(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30_000);
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "EVSavari-CatalogAcquisition/3.0 (+https://evsavari.com)",
        Accept: "application/pdf,*/*",
      },
      signal: controller.signal,
      redirect: "follow",
    });
    if (!res.ok) return { ok: false, errors: [`HTTP ${res.status}`] };
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 1024 || !buf.slice(0, 5).toString().startsWith("%PDF")) {
      return { ok: false, errors: ["Not a valid PDF"] };
    }
    return { ok: true, buffer: buf, byteLength: buf.length, url };
  } catch (err) {
    return { ok: false, errors: [err?.message || "PDF fetch failed"] };
  } finally {
    clearTimeout(timer);
  }
}

async function resolvePdf(vehicle, oemHtml, pdfDirs) {
  const local = findLocalPdf(vehicle.id, pdfDirs);
  if (local) {
    const buffer = fs.readFileSync(local);
    return { ok: true, source: "local", path: local, buffer, byteLength: buffer.length };
  }

  if (oemHtml) {
    const candidates = discoverPdfUrls(oemHtml, vehicle.oemUrl);
    for (const pdfUrl of candidates.slice(0, 3)) {
      const fetched = await fetchPdfBuffer(pdfUrl);
      if (fetched.ok) {
        return {
          ok: true,
          source: "discovered",
          url: fetched.url,
          buffer: fetched.buffer,
          byteLength: fetched.byteLength,
        };
      }
    }
  }

  return { ok: false, source: "none", errors: ["No local PDF and no discoverable OEM PDF URL"] };
}

async function runVehicleAudit(vehicle, pdfDirs) {
  const golden = loadGoldenDossier(vehicle.id);
  const startedAt = Date.now();
  const importId = `prod-val-${vehicle.id}`;

  let oemHtml = null;
  try {
    const oemFetch = await fetch(vehicle.oemUrl, {
      headers: { "User-Agent": "EVSavari-CatalogAcquisition/3.0" },
    });
    if (oemFetch.ok) oemHtml = await oemFetch.text();
  } catch {
    /* pipeline will retry */
  }

  const pdf = await resolvePdf(vehicle, oemHtml, pdfDirs);

  const pipeline = await runEvidencePipelineV3({
    importId,
    oemUrl: vehicle.oemUrl,
    referenceUrls: vehicle.referenceUrls,
    pdfBuffer: pdf.ok ? pdf.buffer : null,
    pdfName: pdf.ok ? `${vehicle.id}.pdf` : null,
    pdfUrl: pdf.url || pdf.path || null,
  });

  const elapsedMs = Date.now() - startedAt;

  if (!pipeline.ok) {
    return {
      id: vehicle.id,
      name: vehicle.name,
      ok: false,
      oemUrl: vehicle.oemUrl,
      referenceUrls: vehicle.referenceUrls,
      pdf: { ...pdf, buffer: undefined },
      elapsedMs,
      errors: pipeline.errors,
    };
  }

  const importRecord = {
    id: importId,
    extractedVehicle: pipeline.extractedVehicle,
    reviewedVehicle: pipeline.reviewedVehicle,
    evidenceSummary: pipeline.mergedFields,
  };

  const report = runFullBenchmarkReport({
    importRecord,
    goldenDossier: golden,
    evidenceRecords: pipeline.evidenceRecords,
  });

  const expectedFields = goldenExpectedFieldCount(golden);
  const extractedFields = countExtractedFields(pipeline.extractedVehicle);
  const coveragePct = expectedFields
    ? Math.round((extractedFields / expectedFields) * 1000) / 10
    : null;
  const variantCoveragePct = report.evaluation?.variantAccuracy != null
    ? Math.round(report.evaluation.variantAccuracy * 1000) / 10
    : null;
  const reviewTimeEstimate = estimateReviewMinutes(pipeline.diagnostics.attentionCount);
  const manualCorrections = estimateManualCorrections(report, pipeline);
  const publishReadinessScore = computePublishReadinessScore(report, pipeline);

  const underTenMin =
    reviewTimeEstimate.max <= 10 &&
    report.qualityGates?.passed &&
    manualCorrections.totalEstimated <= 12;

  return {
    id: vehicle.id,
    name: vehicle.name,
    ok: true,
    oemUrl: vehicle.oemUrl,
    referenceUrls: vehicle.referenceUrls,
    pdf: {
      ok: pdf.ok,
      source: pdf.source,
      path: pdf.path || null,
      url: pdf.url || null,
      byteLength: pdf.byteLength || null,
      errors: pdf.errors || null,
    },
    elapsedMs,
    acquisition: {
      sourceCount: pipeline.diagnostics.sourceCount,
      evidenceRecordCount: pipeline.diagnostics.evidenceRecordCount,
      variantCount: pipeline.diagnostics.variantCount,
      aiProvider: pipeline.diagnostics.aiProvider,
      aiConfigured: pipeline.diagnostics.aiConfigured,
    },
    metrics: {
      fieldsExtracted: extractedFields,
      fieldsExpected: expectedFields,
      coveragePct,
      variantCoveragePct,
      priceAccuracyPct: report.evaluation?.priceAccuracy != null
        ? Math.round(report.evaluation.priceAccuracy * 1000) / 10
        : null,
      featureCoveragePct: report.evaluation?.featureAccuracy != null
        ? Math.round(report.evaluation.featureAccuracy * 1000) / 10
        : null,
      fieldAccuracyPct: report.evaluation?.fieldAccuracy != null
        ? Math.round(report.evaluation.fieldAccuracy * 1000) / 10
        : null,
      confidenceScore: pipeline.confidenceScore,
      publishReadinessScore,
    },
    review: {
      attentionCount: pipeline.diagnostics.attentionCount,
      conflictCount: pipeline.diagnostics.conflictCount,
      reviewTimeEstimate,
      manualCorrections,
    },
    qualityGates: {
      passed: report.qualityGates?.passed ?? false,
      failureCount: report.qualityGates?.failureCount ?? 0,
      failures: (report.qualityGates?.failures || []).slice(0, 8),
    },
    publishDraftReady: report.qualityGates?.passed ?? false,
    underTenMinutes: underTenMin,
    evaluationSummary: report.evaluation?.summary || null,
  };
}

function aggregateResults(results) {
  const ok = results.filter((r) => r.ok);
  const avg = (key) => {
    const vals = ok.map((r) => r.metrics?.[key]).filter(Number.isFinite);
    return vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : null;
  };
  const reviewMids = ok
    .map((r) => (r.review.reviewTimeEstimate.min + r.review.reviewTimeEstimate.max) / 2)
    .filter(Number.isFinite);
  const avgReviewMin = reviewMids.length
    ? Math.round((reviewMids.reduce((a, b) => a + b, 0) / reviewMids.length) * 10) / 10
    : null;

  const gatePassCount = ok.filter((r) => r.qualityGates.passed).length;
  const underTenCount = ok.filter((r) => r.underTenMinutes).length;
  const pdfOkCount = results.filter((r) => r.pdf?.ok).length;

  let tenMinVerdict = "No";
  if (underTenCount === ok.length && ok.length > 0) tenMinVerdict = "Yes";
  else if (underTenCount > 0 || (avgReviewMin && avgReviewMin <= 10 && gatePassCount > 0)) {
    tenMinVerdict = "Partially";
  }

  return {
    vehicleCount: results.length,
    successCount: ok.length,
    failureCount: results.length - ok.length,
    pdfAcquiredCount: pdfOkCount,
    avgCoveragePct: avg("coveragePct"),
    avgVariantCoveragePct: avg("variantCoveragePct"),
    avgPriceAccuracyPct: avg("priceAccuracyPct"),
    avgFeatureCoveragePct: avg("featureCoveragePct"),
    avgPublishReadinessScore: avg("publishReadinessScore"),
    avgReviewMinutes: avgReviewMin,
    qualityGatePassRate: ok.length ? Math.round((gatePassCount / ok.length) * 1000) / 10 : 0,
    underTenMinutesCount: underTenCount,
    underTenMinutesVerdict: tenMinVerdict,
    totalManualCorrections: ok.reduce((s, r) => s + r.review.manualCorrections.totalEstimated, 0),
  };
}

function buildMarkdown(results, aggregate) {
  let md = `# Production Validation Audit

Generated: ${new Date().toISOString().slice(0, 10)}

Real OEM URLs + PDFs via catalog acquisition v3/v4 pipeline. Measurement only — no code changes.

## Primary question

**Can a human publish a production-quality vehicle in under 10 minutes?**

**Answer: ${aggregate.underTenMinutesVerdict}**

| Evidence | Value |
|----------|-------|
| Vehicles under 10 min + gates pass | ${aggregate.underTenMinutesCount} / ${aggregate.successCount} |
| Avg estimated review time | ${aggregate.avgReviewMinutes ?? "—"} min |
| Quality gate pass rate | ${aggregate.qualityGatePassRate}% |
| Avg publish readiness score | ${aggregate.avgPublishReadinessScore ?? "—"} / 100 |
| OEM PDFs acquired | ${aggregate.pdfAcquiredCount} / ${aggregate.vehicleCount} |

---

## Aggregate metrics

| Metric | Value |
|--------|-------|
| Vehicles tested | ${aggregate.vehicleCount} |
| Pipeline success | ${aggregate.successCount} |
| Avg field coverage vs golden | ${aggregate.avgCoveragePct ?? "—"}% |
| Avg variant coverage | ${aggregate.avgVariantCoveragePct ?? "—"}% |
| Avg price accuracy | ${aggregate.avgPriceAccuracyPct ?? "—"}% |
| Avg feature coverage | ${aggregate.avgFeatureCoveragePct ?? "—"}% |
| Total estimated manual corrections | ${aggregate.totalManualCorrections} |

---

## Per-vehicle reports

`;

  for (const r of results) {
    md += `### ${r.name} (\`${r.id}\`)\n\n`;
    if (!r.ok) {
      md += `**Status:** FAILED\n\nErrors: ${(r.errors || []).join("; ")}\n\n`;
      md += `- OEM URL: ${r.oemUrl}\n- PDF: ${r.pdf?.ok ? "acquired" : "not acquired"}\n\n`;
      continue;
    }

    md += `| Metric | Value |
|--------|-------|
| OEM URL | ${r.oemUrl} |
| PDF | ${r.pdf.ok ? `${r.pdf.source}: ${r.pdf.path || r.pdf.url || "ok"}` : "Not acquired"} |
| Pipeline time | ${(r.elapsedMs / 1000).toFixed(1)}s |
| Sources acquired | ${r.acquisition.sourceCount} |
| Fields extracted / expected | ${r.metrics.fieldsExtracted} / ${r.metrics.fieldsExpected} |
| **Coverage %** | ${r.metrics.coveragePct}% |
| **Variant coverage %** | ${r.metrics.variantCoveragePct ?? "—"}% |
| **Price accuracy %** | ${r.metrics.priceAccuracyPct ?? "—"}% |
| **Feature coverage %** | ${r.metrics.featureCoveragePct ?? "—"}% |
| Review time estimate | ${r.review.reviewTimeEstimate.label} |
| Manual corrections (est.) | ${r.review.manualCorrections.totalEstimated} |
| **Publish readiness score** | ${r.metrics.publishReadinessScore} / 100 |
| Quality gates | ${r.qualityGates.passed ? "PASS" : `FAIL (${r.qualityGates.failureCount})`} |
| Publish draft ready | ${r.publishDraftReady ? "Yes" : "No"} |
| Under 10 min publish | ${r.underTenMinutes ? "Yes" : "No"} |

`;
    if (r.qualityGates.failures?.length) {
      md += `Gate failures: ${r.qualityGates.failures.map((f) => f.message).join("; ")}\n\n`;
    }
  }

  md += `## Methodology

- Pipeline: \`runEvidencePipelineV3\` (acquire → extract → evidence merge → review init)
- Golden comparison: \`runFullBenchmarkReport\` vs \`docs/catalog/golden-dataset/vehicles/\`
- PDF: local \`docs/catalog/validation-sources/{id}.pdf\` or auto-discover from OEM HTML
- Review time: attention-field bands from \`reviewTimeEstimate.js\`
- Manual corrections: incorrect fields + variant gaps + attention + conflicts + hallucinations
- Publish readiness: weighted composite of field/variant/price/feature accuracy, evidence quality, gates
`;
  return md;
}

async function main() {
  const vehicleFilter = arg("vehicle");
  const pdfDirArg = arg("pdf-dir");
  const pdfDirs = [
    pdfDirArg ? path.resolve(pdfDirArg) : null,
    process.env.CATALOG_VALIDATION_PDF_DIR
      ? path.resolve(process.env.CATALOG_VALIDATION_PDF_DIR)
      : null,
    ...DEFAULT_PDF_DIRS,
  ].filter(Boolean);

  const vehicles = vehicleFilter
    ? VALIDATION_VEHICLES.filter((v) => v.id === vehicleFilter)
    : VALIDATION_VEHICLES;

  if (!vehicles.length) {
    console.error(`Unknown vehicle: ${vehicleFilter}`);
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });

  console.log("\n=== Production Validation Audit ===\n");
  console.log(`Vehicles: ${vehicles.map((v) => v.id).join(", ")}`);
  console.log(`PDF dirs: ${pdfDirs.join(", ")}\n`);

  const results = [];
  for (const vehicle of vehicles) {
    console.log(`--- ${vehicle.name} ---`);
    const result = await runVehicleAudit(vehicle, pdfDirs);
    results.push(result);
    if (result.ok) {
      console.log(
        `  OK ${(result.elapsedMs / 1000).toFixed(1)}s · coverage ${result.metrics.coveragePct}% · readiness ${result.metrics.publishReadinessScore} · review ${result.review.reviewTimeEstimate.label} · gates ${result.qualityGates.passed ? "PASS" : "FAIL"}`
      );
    } else {
      console.log(`  FAIL: ${(result.errors || []).join("; ")}`);
    }
  }

  const aggregate = aggregateResults(results);
  fs.writeFileSync(OUT_JSON, JSON.stringify({ generatedAt: new Date().toISOString(), aggregate, results }, null, 2));
  fs.writeFileSync(OUT_MD, buildMarkdown(results, aggregate));

  console.log("\n=== Aggregate ===\n");
  console.log(JSON.stringify(aggregate, null, 2));
  console.log(`\nWrote ${OUT_MD}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
