/**
 * v7 — weighted conflict resolution: OEM PDF > OEM page > reference.
 */

import { EVIDENCE_FIELD_STATUS, EVIDENCE_SOURCE_TYPE } from "../constants.js";
import { ALL_SCALAR_FIELD_KEYS } from "../extractionSchema.js";
import { groupRecordsByValue } from "../multiSourceConfidence.js";
const SOURCE_TIER_WEIGHT = Object.freeze({
  [EVIDENCE_SOURCE_TYPE.OEM_PDF]: 100,
  [EVIDENCE_SOURCE_TYPE.OEM_WEBSITE]: 85,
  [EVIDENCE_SOURCE_TYPE.TRUSTED_REFERENCE]: 55,
  [EVIDENCE_SOURCE_TYPE.SEARCH_RESULT]: 30,
});

function recordWeight(record = {}) {
  const tier = SOURCE_TIER_WEIGHT[record.sourceType] ?? 40;
  const trust = Number(record.trustScore) || 0;
  const conf = Number(record.extractionConfidence) || 75;
  const methodBonus = String(record.extractionMethod || "").includes("v7") ? 5 : 0;
  return tier * 1.2 + trust * 0.3 + conf * 0.15 + methodBonus;
}

function groupWeightedScore(group = []) {
  return group.reduce((sum, r) => sum + recordWeight(r), 0);
}

export function mergeEvidenceForFieldWeighted(fieldName, records = []) {
  const eligible = records.filter((r) => r?.fieldValue !== null && r?.fieldValue !== undefined && r?.fieldValue !== "");
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

  const groups = groupRecordsByValue(eligible);
  const ranked = [...groups.entries()]
    .map(([normalized, group]) => ({
      normalized,
      displayValue: group[0]?.fieldValue ?? normalized,
      records: group,
      weight: groupWeightedScore(group),
      topTier: Math.max(...group.map((r) => SOURCE_TIER_WEIGHT[r.sourceType] ?? 0)),
    }))
    .sort((a, b) => b.weight - a.weight || b.topTier - a.topTier);

  const winner = ranked[0];
  const runner = ranked[1];
  const hasConflict =
    ranked.length > 1 &&
    winner.normalized !== runner?.normalized &&
    runner.weight >= winner.weight * 0.35;

  let status = EVIDENCE_FIELD_STATUS.AGREEMENT;
  if (hasConflict) status = EVIDENCE_FIELD_STATUS.CONFLICT;
  else if (eligible.length === 1) status = EVIDENCE_FIELD_STATUS.SINGLE_SOURCE;

  const confidence = Math.min(
    99,
    Math.round(55 + winner.weight / 4 + (hasConflict ? -15 : 12))
  );

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
      weight: recordWeight(r),
    })),
    sourceValues: ranked.map((g) => ({
      value: g.displayValue,
      trustWeight: g.weight,
      sources: g.records.map((r) => ({ sourceType: r.sourceType, sourceName: r.sourceName })),
    })),
    resolution: "v7-weighted",
  };
}

export function mergeAllEvidenceWeighted(allRecords = []) {
  const byField = {};
  for (const record of allRecords) {
    if (!record?.fieldName) continue;
    byField[record.fieldName] = byField[record.fieldName] || [];
    byField[record.fieldName].push(record);
  }

  const merged = {};
  for (const fieldName of ALL_SCALAR_FIELD_KEYS) {
    merged[fieldName] = mergeEvidenceForFieldWeighted(fieldName, byField[fieldName] || []);
  }
  return merged;
}

/**
 * Resolve conflicts by re-picking winner with tier weights (clears conflict status).
 */
export function resolveConflictsWeighted(mergedFields = {}) {
  const out = { ...mergedFields };
  for (const [key, entry] of Object.entries(out)) {
    if (entry?.status !== EVIDENCE_FIELD_STATUS.CONFLICT) continue;
    const ranked = (entry.sourceValues || []).slice().sort((a, b) => (b.trustWeight || 0) - (a.trustWeight || 0));
    if (!ranked.length) continue;
    const topSource = (entry.sources || []).slice().sort((a, b) => (b.weight || 0) - (a.weight || 0))[0];
    out[key] = {
      ...entry,
      value: ranked[0].value,
      status: EVIDENCE_FIELD_STATUS.AGREEMENT,
      manualReview: false,
      confidence: Math.min(95, (entry.confidence || 70) + 10),
      resolvedBy: topSource?.sourceType || "v7-weighted",
    };
  }
  return out;
}

