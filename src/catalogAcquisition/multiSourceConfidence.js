/**
 * Multi-source confidence engine — trust, source count, agreement, extraction quality.
 */

import { EVIDENCE_SOURCE_TYPE } from "./constants.js";
import { normalizeEvidenceValue } from "./evidenceRecord.js";

const OEM_TYPES = new Set([
  EVIDENCE_SOURCE_TYPE.OEM_PDF,
  EVIDENCE_SOURCE_TYPE.OEM_WEBSITE,
]);

/**
 * @param {object[]} agreeingRecords
 * @param {object[]} allRecords
 * @param {boolean} hasConflict
 * @returns {number} 0–100
 */
export function computeMultiSourceConfidence(
  agreeingRecords = [],
  allRecords = [],
  hasConflict = false
) {
  if (!agreeingRecords.length) return 0;

  const avgTrust =
    agreeingRecords.reduce((sum, r) => sum + Number(r.trustScore || 0), 0) /
    agreeingRecords.length;

  const agreeCount = agreeingRecords.length;
  const totalCount = allRecords.length || agreeCount;
  const agreementRatio = agreeCount / totalCount;

  const sourceCountBonus = Math.min(12, Math.max(0, agreeCount - 1) * 4);
  const agreementBonus = agreementRatio * 8;

  const extractionScores = agreeingRecords
    .map((r) => Number(r.extractionConfidence))
    .filter((n) => Number.isFinite(n));
  const avgExtraction = extractionScores.length
    ? extractionScores.reduce((a, b) => a + b, 0) / extractionScores.length
    : 80;

  const aiRecords = agreeingRecords.filter((r) =>
    String(r.extractionMethod || "").startsWith("ai-")
  );
  const aiBonus = aiRecords.length ? Math.min(8, aiRecords.length * 3) : 0;

  let score =
    avgTrust * 0.4 +
    avgExtraction * 0.28 +
    sourceCountBonus +
    agreementBonus +
    aiBonus;

  if (agreeCount === 1 && !hasConflict) {
    const singleFloor = Math.min(85, avgTrust + 5);
    score = Math.max(score, singleFloor);
    score = Math.min(score, 85);
  }

  if (agreeCount >= 3 && !hasConflict) {
    score = Math.max(score, 99);
  }

  if (hasConflict) {
    score = Math.min(score, 75);
    if (agreeCount >= 2) score = Math.max(score, 65);
    score = Math.min(score, 70);
    const conflictPenalty = Math.min(10, (totalCount - agreeCount) * 4);
    score = Math.max(0, score - conflictPenalty);
  }

  return Math.round(Math.max(0, Math.min(100, score)));
}

/**
 * Search results must not override OEM when values differ.
 * @param {object[]} records
 * @returns {object[]} filtered for winner selection
 */
export function filterRecordsForMerge(records = []) {
  const oemRecords = records.filter((r) => OEM_TYPES.has(r.sourceType));
  const nonSearch = records.filter(
    (r) => r.sourceType !== EVIDENCE_SOURCE_TYPE.SEARCH_RESULT
  );

  if (oemRecords.length > 0) {
    return nonSearch.length ? nonSearch : oemRecords;
  }
  return records;
}

/**
 * Group records by normalized field value.
 * @param {object[]} records
 * @returns {Map<string, object[]>}
 */
export function groupRecordsByValue(records = []) {
  const groups = new Map();
  for (const record of records) {
    const key = normalizeEvidenceValue(record.fieldValue);
    if (!key) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(record);
  }
  return groups;
}

/**
 * Sum trust scores for a group (used to pick winning value).
 * @param {object[]} group
 */
export function groupTrustWeight(group = []) {
  return group.reduce((sum, r) => sum + Number(r.trustScore || 0), 0);
}
