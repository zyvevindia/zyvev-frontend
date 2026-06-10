/**
 * Production quality gates — block publish when catalog integrity checks fail.
 */

import {
  flattenExtractionDraft,
  REQUIRED_PUBLISH_FIELDS,
} from "../extractionSchema.js";
import { detectHallucinations } from "./hallucinationDetection.js";
import { extractFieldConfidence, extractFieldValue } from "./compareUtils.js";
import { evaluateVariantAccuracy } from "./evaluateExtraction.js";

export const QUALITY_GATE_DEFAULTS = Object.freeze({
  minPriceConfidence: 80,
  requireEvidenceTraceability: true,
  blockOnVariantCountMismatch: true,
  blockOnUnresolvedConflicts: true,
});

function listConflictFieldKeys(mergedFields = {}) {
  return Object.entries(mergedFields)
    .filter(([, m]) => m?.status === "conflict")
    .map(([k]) => k);
}

export function checkPublishQualityGates(
  importRecord = {},
  evidenceRecords = [],
  goldenDossier = null,
  options = {}
) {
  const opts = { ...QUALITY_GATE_DEFAULTS, ...options };
  const reviewed = importRecord.reviewedVehicle;
  const extracted = importRecord.extractedVehicle || {};
  const draft = reviewed || extracted;
  const flat = flattenExtractionDraft(draft);
  const mergedFields = importRecord.evidenceSummary || extracted.evidence || {};

  const failures = [];
  const warnings = [];

  for (const key of REQUIRED_PUBLISH_FIELDS) {
    const val = extractFieldValue(flat[key]);
    if (val === null || val === undefined || val === "") {
      failures.push({
        gate: "required_fields",
        fieldKey: key,
        message: `Required field missing: ${key}`,
      });
    }
  }

  if (opts.blockOnUnresolvedConflicts) {
    for (const key of listConflictFieldKeys(mergedFields)) {
      failures.push({
        gate: "unresolved_conflicts",
        fieldKey: key,
        message: `Unresolved evidence conflict: ${key}`,
      });
    }
  }

  const priceKeys = ["startingPrice", "topVariantPrice", "exShowroomPrice"];
  for (const key of priceKeys) {
    const val = extractFieldValue(flat[key]);
    if (val === null || val === undefined || val === "") continue;
    const conf = extractFieldConfidence(flat[key], extractFieldConfidence(mergedFields[key]));
    if (conf < opts.minPriceConfidence) {
      failures.push({
        gate: "price_confidence",
        fieldKey: key,
        message: `${key} confidence ${conf}% below threshold ${opts.minPriceConfidence}%`,
        confidence: conf,
      });
    }
  }

  if (goldenDossier && opts.blockOnVariantCountMismatch) {
    const variantEval = evaluateVariantAccuracy(goldenDossier, draft);
    if (!variantEval.countMatch) {
      failures.push({
        gate: "variant_count_mismatch",
        message: `Variant count ${variantEval.extractedCount} vs golden ${variantEval.goldenCount}`,
        extractedCount: variantEval.extractedCount,
        goldenCount: variantEval.goldenCount,
      });
    }
  }

  const hallucination = detectHallucinations({
    extractedDraft: draft,
    mergedFields,
    evidenceRecords,
  });

  if (opts.requireEvidenceTraceability && hallucination.publishBlocked) {
    for (const f of hallucination.fields.filter((x) => x.severity === "critical")) {
      failures.push({
        gate: "evidence_missing",
        fieldKey: f.fieldKey,
        message: `No evidence for populated field: ${f.fieldKey}`,
      });
    }
  } else if (hallucination.warningCount) {
    warnings.push({
      gate: "evidence_weak",
      message: `${hallucination.warningCount} field(s) with weak evidence traceability`,
      fields: hallucination.fields.filter((f) => f.severity === "warning").slice(0, 10),
    });
  }

  return {
    ok: failures.length === 0,
    passed: failures.length === 0,
    failureCount: failures.length,
    warningCount: warnings.length,
    failures,
    warnings,
    hallucination,
    checkedAt: new Date().toISOString(),
  };
}
