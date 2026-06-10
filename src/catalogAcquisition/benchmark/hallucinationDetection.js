/**
 * Hallucination detection — fields with values but no evidence traceability.
 */

import { flattenExtractionDraft, ALL_SCALAR_FIELD_KEYS } from "../extractionSchema.js";
import { extractFieldValue } from "./compareUtils.js";

function hasEvidenceSources(mergedField) {
  if (!mergedField) return false;
  return (mergedField.sources || []).length > 0;
}

function evidenceRecordCoversField(fieldName, evidenceRecords = []) {
  return evidenceRecords.some(
    (r) =>
      r.fieldName === fieldName &&
      r.fieldValue !== null &&
      r.fieldValue !== undefined &&
      String(r.fieldValue).trim() !== ""
  );
}

export function detectHallucinations({
  extractedDraft = {},
  mergedFields = {},
  evidenceRecords = [],
} = {}) {
  const flat = flattenExtractionDraft(extractedDraft);
  const flagged = [];

  for (const fieldKey of ALL_SCALAR_FIELD_KEYS) {
    const value = extractFieldValue(flat[fieldKey]);
    const isEmpty = value === null || value === undefined || value === "";
    if (isEmpty) continue;

    const merged = mergedFields[fieldKey];
    const hasMergedEvidence = hasEvidenceSources(merged);
    const hasRecord = evidenceRecordCoversField(fieldKey, evidenceRecords);

    if (!hasMergedEvidence && !hasRecord) {
      flagged.push({
        fieldKey,
        value,
        reason: "no_evidence_source",
        severity: "critical",
      });
      continue;
    }

    if (merged?.status === "missing" && !isEmpty) {
      flagged.push({
        fieldKey,
        value,
        reason: "value_without_merged_evidence",
        severity: "critical",
      });
    }
  }

  const variants = extractedDraft.variants || [];
  variants.forEach((v, idx) => {
    if (v.rejected) return;
    const name = extractFieldValue(v.variantName);
    if (!name) return;
    const hasVariantEvidence = evidenceRecords.some((r) => r.fieldName === "variants");
    if (!hasVariantEvidence && (extractFieldValue(v.price) || extractFieldValue(v.battery))) {
      flagged.push({
        fieldKey: `variants[${idx}]`,
        value: name,
        reason: "variant_without_evidence_bundle",
        severity: "warning",
      });
    }
  });

  return {
    generatedAt: new Date().toISOString(),
    count: flagged.length,
    criticalCount: flagged.filter((f) => f.severity === "critical").length,
    warningCount: flagged.filter((f) => f.severity === "warning").length,
    fields: flagged,
    publishBlocked: flagged.some((f) => f.severity === "critical"),
  };
}
