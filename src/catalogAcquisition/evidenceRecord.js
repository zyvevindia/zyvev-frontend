/**
 * Evidence record helpers — normalized shape for connectors and persistence.
 */

import { EVIDENCE_TRUST_SCORE } from "./constants.js";
import { ALL_SCALAR_FIELD_KEYS } from "./extractionSchema.js";

/** @deprecated use ALL_SCALAR_FIELD_KEYS — alias for v2 compatibility */
export const EVIDENCE_FIELD_NAMES = ALL_SCALAR_FIELD_KEYS;

/**
 * @param {object} params
 * @returns {object}
 */
export function createEvidenceRecord({
  importId,
  fieldName,
  fieldValue,
  sourceType,
  sourceName = null,
  sourceUrl = null,
  trustScore,
  extractionConfidence = null,
  extractionMethod = null,
  sourceSnippet = null,
  id = null,
  createdAt = null,
}) {
  const value =
    fieldValue === null || fieldValue === undefined ? "" : String(fieldValue);

  return {
    id,
    importId,
    fieldName,
    fieldValue: value,
    sourceType,
    sourceName,
    sourceUrl,
    trustScore: trustScore ?? EVIDENCE_TRUST_SCORE[sourceType] ?? 60,
    extractionConfidence,
    extractionMethod,
    sourceSnippet: sourceSnippet || null,
    createdAt: createdAt || new Date().toISOString(),
  };
}

/**
 * Map flat field map with confidences → evidence records.
 * @param {Record<string, { value: *, confidence?: number }>} fields
 * @param {object} sourceMeta
 */
export function aiFieldsToEvidenceRecords(fields = {}, sourceMeta = {}) {
  const {
    importId,
    sourceType,
    sourceName,
    sourceUrl,
    trustScore,
    extractionMethod = "ai-v3",
  } = sourceMeta;

  const records = [];
  for (const fieldName of ALL_SCALAR_FIELD_KEYS) {
    const entry = fields[fieldName];
    if (!entry || entry.value === null || entry.value === undefined || entry.value === "") {
      continue;
    }
    records.push(
      createEvidenceRecord({
        importId,
        fieldName,
        fieldValue: entry.value,
        sourceType: entry.sourceType || sourceType,
        sourceName,
        sourceUrl,
        trustScore,
        extractionConfidence: entry.confidence ?? 85,
        extractionMethod,
        sourceSnippet: entry.sourceSnippet || null,
      })
    );
  }
  return records;
}

/**
 * Map extraction candidates object → evidence records for one source (heuristic path).
 */
export function candidatesToEvidenceRecords(candidates = {}, sourceMeta = {}) {
  const {
    importId,
    sourceType,
    sourceName,
    sourceUrl,
    trustScore,
    extractionConfidence = 85,
    extractionMethod = "heuristic-v1",
  } = sourceMeta;

  const records = [];
  for (const fieldName of ALL_SCALAR_FIELD_KEYS) {
    const raw = candidates[fieldName];
    if (raw === null || raw === undefined || raw === "") continue;
    records.push(
      createEvidenceRecord({
        importId,
        fieldName,
        fieldValue: raw,
        sourceType,
        sourceName,
        sourceUrl,
        trustScore,
        extractionConfidence,
        extractionMethod,
      })
    );
  }
  return records;
}

export function normalizeEvidenceValue(value) {
  if (value === null || value === undefined) return "";
  const s = String(value).trim().toLowerCase();
  const num = Number(s.replace(/[,₹]/g, ""));
  if (Number.isFinite(num) && s.match(/^[\d,.\s₹]+$/)) {
    return String(num);
  }
  if (s === "true" || s === "yes") return "true";
  if (s === "false" || s === "no") return "false";
  return s;
}

/**
 * Normalize AI/heuristic variant row → draft variant shape.
 */
export function normalizeVariantRow(v = {}) {
  const conf = (val, confidence = 75) => ({
    value: val ?? null,
    confidence: Math.round(Number(confidence) || 75),
  });
  return {
    variantName: v.variantName || v.name || "Variant",
    price: conf(v.price?.value ?? v.price, v.price?.confidence),
    battery: conf(v.battery?.value ?? v.battery, v.battery?.confidence),
    range: conf(v.range?.value ?? v.range, v.range?.confidence),
    acChargingKw: conf(v.acChargingKw?.value ?? v.acChargingKw, v.acChargingKw?.confidence),
    dcChargingKw: conf(v.dcChargingKw?.value ?? v.dcChargingKw, v.dcChargingKw?.confidence),
    charging: conf(
      v.charging?.value ??
        ([v.acChargingKw?.value ?? v.acChargingKw, v.dcChargingKw?.value ?? v.dcChargingKw]
          .filter(Boolean)
          .join(" / ") || null),
      v.charging?.confidence
    ),
    featureHighlights: conf(
      v.featureHighlights?.value ?? v.featureHighlights,
      v.featureHighlights?.confidence
    ),
  };
}
