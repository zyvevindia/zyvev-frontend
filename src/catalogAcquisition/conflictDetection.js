/**
 * Conflict detection for merged evidence fields.
 */

import { EVIDENCE_FIELD_STATUS } from "./constants.js";
import {
  groupRecordsByValue,
  groupTrustWeight,
  filterRecordsForMerge,
} from "./multiSourceConfidence.js";
import { normalizeEvidenceValue } from "./evidenceRecord.js";

/**
 * @param {object[]} records evidence records for a single field
 * @returns {{ hasConflict: boolean, groups: { value: string, displayValue: string, records: object[], trustWeight: number }[] }}
 */
export function detectFieldConflict(records = []) {
  const eligible = filterRecordsForMerge(records);
  const groups = groupRecordsByValue(eligible);
  const grouped = [...groups.entries()].map(([normalized, group]) => ({
    normalized,
    displayValue: group[0]?.fieldValue ?? normalized,
    records: group,
    trustWeight: groupTrustWeight(group),
  }));

  grouped.sort((a, b) => b.trustWeight - a.trustWeight);

  const hasConflict =
    grouped.length > 1 &&
    grouped.some(
      (g, i) =>
        i > 0 &&
        g.normalized !== grouped[0].normalized &&
        g.trustWeight >= grouped[0].trustWeight * 0.25
    );

  return { hasConflict, groups: grouped };
}

/**
 * @param {Record<string, object>} mergedFields keyed by fieldName
 * @returns {string[]} field names with conflict status
 */
export function listConflictFieldKeys(mergedFields = {}) {
  return Object.entries(mergedFields)
    .filter(([, m]) => m?.status === EVIDENCE_FIELD_STATUS.CONFLICT)
    .map(([k]) => k);
}

/**
 * @param {Record<string, object>} mergedFields
 * @returns {boolean}
 */
export function requiresManualReview(mergedFields = {}) {
  return Object.values(mergedFields).some((m) => m?.manualReview);
}
