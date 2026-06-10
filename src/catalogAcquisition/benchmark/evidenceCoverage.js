/**
 * Evidence coverage report — source count, agreement, quality per field.
 */

import { ALL_SCALAR_FIELD_KEYS } from "../extractionSchema.js";
import { EVIDENCE_FIELD_STATUS } from "../constants.js";

function evidenceQualityScore(mergedField) {
  if (!mergedField?.sources?.length) return 0;
  const trustScores = mergedField.sources
    .map((s) => Number(s.trustScore))
    .filter(Number.isFinite);
  const extractConf = mergedField.sources
    .map((s) => Number(s.extractionConfidence))
    .filter(Number.isFinite);
  const avgTrust = trustScores.length
    ? trustScores.reduce((a, b) => a + b, 0) / trustScores.length
    : 50;
  const avgExtract = extractConf.length
    ? extractConf.reduce((a, b) => a + b, 0) / extractConf.length
    : mergedField.confidence || 50;
  let quality = (avgTrust * 0.6 + avgExtract * 0.4) / 100;
  if (mergedField.status === EVIDENCE_FIELD_STATUS.CONFLICT) quality *= 0.5;
  if (mergedField.status === EVIDENCE_FIELD_STATUS.SINGLE_SOURCE) quality *= 0.85;
  return Math.round(quality * 100);
}

export function buildEvidenceCoverageReport(mergedFields = {}) {
  const fields = [];
  const weakAreas = [];

  for (const fieldKey of ALL_SCALAR_FIELD_KEYS) {
    const merged = mergedFields[fieldKey] || {};
    const sourceCount = merged.sources?.length || 0;
    const agreement =
      merged.status === EVIDENCE_FIELD_STATUS.AGREEMENT
        ? "agreement"
        : merged.status === EVIDENCE_FIELD_STATUS.CONFLICT
          ? "conflict"
          : merged.status === EVIDENCE_FIELD_STATUS.SINGLE_SOURCE
            ? "single_source"
            : "missing";
    const quality = evidenceQualityScore(merged);
    const hasValue =
      merged.value !== null && merged.value !== undefined && merged.value !== "";

    const entry = {
      fieldKey,
      sourceCount,
      agreement,
      evidenceQuality: quality,
      confidence: merged.confidence ?? 0,
      hasValue,
      manualReview: Boolean(merged.manualReview),
    };
    fields.push(entry);

    if (hasValue && (sourceCount === 0 || agreement === "conflict" || quality < 50)) {
      weakAreas.push({
        fieldKey,
        reason:
          sourceCount === 0
            ? "no_sources"
            : agreement === "conflict"
              ? "source_conflict"
              : "low_quality",
        ...entry,
      });
    } else if (
      !hasValue &&
      /^(brand|model|familySlug|startingPrice|batteryCapacityKwh|claimedRangeKm)$/.test(fieldKey)
    ) {
      weakAreas.push({
        fieldKey,
        reason: "critical_missing",
        ...entry,
      });
    }
  }

  const populated = fields.filter((f) => f.hasValue);
  const avgQuality = populated.length
    ? Math.round(populated.reduce((a, f) => a + f.evidenceQuality, 0) / populated.length)
    : 0;

  return {
    generatedAt: new Date().toISOString(),
    fieldCount: fields.length,
    populatedCount: populated.length,
    averageEvidenceQuality: avgQuality,
    weakAreaCount: weakAreas.length,
    fields,
    weakAreas: weakAreas.slice(0, 30),
  };
}
