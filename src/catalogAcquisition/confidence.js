/**
 * Confidence scoring for extracted catalog fields.
 */

import { CONFIDENCE_BAND } from "./constants.js";

export function confidenceBand(score) {
  const n = Number(score);
  if (!Number.isFinite(n)) return CONFIDENCE_BAND.RED;
  if (n >= 95) return CONFIDENCE_BAND.GREEN;
  if (n >= 80) return CONFIDENCE_BAND.YELLOW;
  return CONFIDENCE_BAND.RED;
}

export function confidenceLabel(score) {
  const band = confidenceBand(score);
  if (band === CONFIDENCE_BAND.GREEN) return "High";
  if (band === CONFIDENCE_BAND.YELLOW) return "Review";
  return "Required review";
}

/**
 * @param {unknown} value
 * @param {number} confidence 0–100
 */
export function confField(value, confidence) {
  return {
    value: value ?? null,
    confidence: Math.max(0, Math.min(100, Math.round(Number(confidence) || 0))),
  };
}

/**
 * Aggregate confidence from flat field map `{ key: { value, confidence } }`.
 */
export function aggregateConfidence(fields = {}) {
  const scores = Object.values(fields)
    .filter((f) => f && typeof f === "object" && "confidence" in f)
    .map((f) => Number(f.confidence))
    .filter((n) => Number.isFinite(n));

  if (!scores.length) return 0;
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

/**
 * List fields below confidence threshold for review highlighting.
 */
export function lowConfidenceFieldKeys(fields = {}, threshold = 80) {
  return Object.entries(fields)
    .filter(([, f]) => f && Number(f.confidence) < threshold)
    .map(([k]) => k);
}

export function mergeReviewedFields(extracted = {}, reviewed = {}) {
  const out = { ...extracted };
  for (const [key, entry] of Object.entries(reviewed)) {
    if (!entry || typeof entry !== "object") continue;
    if (entry.rejected) {
      out[key] = confField(null, 0);
      continue;
    }
    if (entry.value !== undefined) {
      out[key] = confField(
        entry.value,
        entry.confidence ?? extracted[key]?.confidence ?? 70
      );
    }
  }
  return out;
}
