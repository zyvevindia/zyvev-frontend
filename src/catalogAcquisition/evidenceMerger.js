/**
 * Evidence merger — aggregate multi-source records into single normalized fields.
 */

import { EVIDENCE_FIELD_STATUS } from "./constants.js";
import { detectFieldConflict } from "./conflictDetection.js";
import {
  computeMultiSourceConfidence,
  filterRecordsForMerge,
} from "./multiSourceConfidence.js";
import { ALL_SCALAR_FIELD_KEYS, EXTRACTION_SCHEMA_VERSION } from "./extractionSchema.js";
import { confField } from "./confidence.js";

/** @deprecated alias */
export const EVIDENCE_FIELD_NAMES = ALL_SCALAR_FIELD_KEYS;

export function mergeEvidenceForField(fieldName, records = []) {
  const eligible = filterRecordsForMerge(records);

  if (!eligible.length) {
    return {
      fieldName,
      value: null,
      confidence: 0,
      status: EVIDENCE_FIELD_STATUS.MISSING,
      manualReview: false,
      sources: [],
      sourceValues: [],
    };
  }

  const { hasConflict, groups } = detectFieldConflict(eligible);
  const winner = groups[0];

  const confidence = computeMultiSourceConfidence(
    winner.records,
    eligible,
    hasConflict
  );

  let status = EVIDENCE_FIELD_STATUS.AGREEMENT;
  if (hasConflict) status = EVIDENCE_FIELD_STATUS.CONFLICT;
  else if (eligible.length === 1) status = EVIDENCE_FIELD_STATUS.SINGLE_SOURCE;

  return {
    fieldName,
    value: winner.displayValue,
    confidence,
    status,
    manualReview: hasConflict,
    sources: eligible.map((r) => ({
      sourceType: r.sourceType,
      sourceName: r.sourceName,
      sourceUrl: r.sourceUrl,
      trustScore: r.trustScore,
      fieldValue: r.fieldValue,
      extractionConfidence: r.extractionConfidence,
      extractionMethod: r.extractionMethod,
    })),
    sourceValues: groups.map((g) => ({
      value: g.displayValue,
      trustWeight: g.trustWeight,
      sources: g.records.map((r) => ({
        sourceType: r.sourceType,
        sourceName: r.sourceName,
        sourceUrl: r.sourceUrl,
        trustScore: r.trustScore,
      })),
    })),
  };
}

export function mergeAllEvidence(allRecords = []) {
  const byField = {};
  for (const record of allRecords) {
    if (!record?.fieldName) continue;
    byField[record.fieldName] = byField[record.fieldName] || [];
    byField[record.fieldName].push(record);
  }

  const merged = {};
  for (const fieldName of ALL_SCALAR_FIELD_KEYS) {
    merged[fieldName] = mergeEvidenceForField(
      fieldName,
      byField[fieldName] || []
    );
  }
  return merged;
}

const GROUP_FIELD_MAP = Object.freeze({
  vehicle: ["brand", "model", "bodyType", "familySlug"],
  pricing: ["startingPrice", "topVariantPrice", "exShowroomPrice"],
  battery: ["batteryCapacityKwh", "batteryChemistry"],
  range: ["claimedRangeKm", "rangeTestStandard"],
  charging: [
    "acChargingKw",
    "dcChargingKw",
    "acChargingTimeHours",
    "dcChargingTimeMinutes",
  ],
  performance: ["powerPs", "powerKw", "torqueNm"],
  dimensions: ["lengthMm", "widthMm", "heightMm", "wheelbaseMm"],
  safety: ["airbags", "adas", "adasLevel", "ncapRating"],
  features: ["sunroof", "ventilatedSeats", "camera360", "connectedCar", "v2l", "v2v"],
  warranty: ["vehicleWarrantyYears", "batteryWarrantyYears"],
  mediaMeta: ["colorOptions", "heroImageCandidates"],
});

export function mergedFieldsToExtractionDraft(mergedFields = {}, meta = {}, variants = []) {
  const field = (key) =>
    confField(mergedFields[key]?.value, mergedFields[key]?.confidence ?? 0);

  const draft = {
    format: EXTRACTION_SCHEMA_VERSION,
    vehicle: {},
    pricing: {},
    battery: {},
    range: {},
    charging: {},
    performance: {},
    dimensions: {},
    safety: {},
    features: {},
    warranty: {},
    mediaMeta: {},
    variants: variants || [],
    meta: {
      ...meta,
      evidenceEngine: meta.evidenceEngine || "multi-source-v3",
      mergedAt: new Date().toISOString(),
    },
    evidence: mergedFields,
  };

  for (const [groupId, keys] of Object.entries(GROUP_FIELD_MAP)) {
    draft[groupId] = {};
    for (const key of keys) {
      draft[groupId][key] = field(key);
    }
  }

  return draft;
}

export function aggregateMergedConfidence(mergedFields = {}) {
  const scores = Object.values(mergedFields)
    .map((m) => Number(m?.confidence))
    .filter((n) => Number.isFinite(n) && n > 0);
  if (!scores.length) return 0;
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}
