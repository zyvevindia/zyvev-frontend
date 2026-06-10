/**
 * v6 — rank top fields preventing publish readiness.
 */

import { flattenExtractionDraft, REQUIRED_PUBLISH_FIELDS } from "../extractionSchema.js";
import { extractFieldValue, extractFieldConfidence } from "../benchmark/compareUtils.js";
const GATE_IMPACT = Object.freeze({
  required_fields: 100,
  variant_count_mismatch: 85,
  evidence_missing: 80,
  unresolved_conflicts: 75,
  price_confidence: 60,
  field_incorrect: 50,
  feature_missing: 45,
  variant_unmatched: 40,
});

/**
 * @param {object} params
 * @param {object} params.qualityGates
 * @param {object} [params.evaluation]
 * @param {object} [params.importRecord]
 * @param {object} [params.goldenDossier]
 */
export function analyzeGateFailures(params = {}) {
  const { qualityGates = {}, evaluation = null, importRecord = {}, goldenDossier = null } = params;
  const draft = importRecord.reviewedVehicle || importRecord.extractedVehicle || {};
  const flat = flattenExtractionDraft(draft);
  const ranked = [];

  for (const failure of qualityGates.failures || []) {
    ranked.push({
      fieldKey: failure.fieldKey || failure.gate,
      gate: failure.gate,
      message: failure.message,
      impact: GATE_IMPACT[failure.gate] ?? 55,
      category: "quality_gate",
    });
  }

  if (evaluation?.field?.comparisons) {
    for (const c of evaluation.field.comparisons) {
      if (c.correct || c.status === "skipped") continue;
      ranked.push({
        fieldKey: c.fieldKey,
        gate: "field_incorrect",
        message: `Golden mismatch: expected ${JSON.stringify(c.expected)}, got ${JSON.stringify(c.actual)}`,
        impact: GATE_IMPACT.field_incorrect,
        category: "benchmark",
      });
    }
  }

  if (evaluation?.feature?.comparisons) {
    for (const c of evaluation.feature.comparisons) {
      if (c.correct || c.status === "skipped") continue;
      ranked.push({
        fieldKey: c.fieldKey,
        gate: "feature_missing",
        message: `Feature mismatch: expected ${c.expected}, got ${c.actual}`,
        impact: GATE_IMPACT.feature_missing,
        category: "feature",
      });
    }
  }

  if (evaluation?.variant?.matches) {
    for (const m of evaluation.variant.matches) {
      if (m.matched) continue;
      ranked.push({
        fieldKey: `variant:${m.golden?.variantName}`,
        gate: "variant_unmatched",
        message: `Golden variant not matched: ${m.golden?.variantName}`,
        impact: GATE_IMPACT.variant_unmatched,
        category: "variant",
      });
    }
  }

  for (const key of REQUIRED_PUBLISH_FIELDS) {
    const val = extractFieldValue(flat[key]);
    if (val === null || val === undefined || val === "") {
      if (!ranked.some((r) => r.fieldKey === key && r.gate === "required_fields")) {
        ranked.push({
          fieldKey: key,
          gate: "required_fields",
          message: `Required field missing: ${key}`,
          impact: GATE_IMPACT.required_fields,
          category: "identity",
        });
      }
    }
  }

  const priceKeys = ["startingPrice", "topVariantPrice", "exShowroomPrice"];
  for (const key of priceKeys) {
    const val = extractFieldValue(flat[key]);
    if (val == null) continue;
    const conf = extractFieldConfidence(flat[key]);
    if (conf < 80) {
      ranked.push({
        fieldKey: key,
        gate: "price_confidence",
        message: `${key} confidence ${conf}% below 80%`,
        impact: GATE_IMPACT.price_confidence - (80 - conf) / 2,
        category: "pricing",
      });
    }
  }

  ranked.sort((a, b) => b.impact - a.impact);

  const seen = new Set();
  const top10 = [];
  for (const item of ranked) {
    const id = `${item.gate}:${item.fieldKey}`;
    if (seen.has(id)) continue;
    seen.add(id);
    top10.push(item);
    if (top10.length >= 10) break;
  }

  return {
    totalIssues: ranked.length,
    top10,
    all: ranked,
  };
}

export async function buildVehicleGateReport(importRecord, goldenDossier, evidenceRecords = []) {
  const { runFullBenchmarkReport } = await import("../benchmark/benchmarkReport.js");
  const report = runFullBenchmarkReport({ importRecord, goldenDossier, evidenceRecords });
  const analysis = analyzeGateFailures({
    qualityGates: report.qualityGates,
    evaluation: report.evaluation,
    importRecord,
    goldenDossier,
  });
  return { report, gateFailureAnalysis: analysis };
}
