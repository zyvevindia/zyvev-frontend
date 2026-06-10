/**
 * Confidence calibration — measure accuracy by predicted confidence band.
 */

import { flattenExtractionDraft } from "../extractionSchema.js";
import {
  compareField,
  confidenceBandLabel,
  extractFieldConfidence,
  extractFieldValue,
} from "./compareUtils.js";

function goldenScalarFields(golden) {
  const fields = { ...(golden.fields || {}) };
  for (const key of ["sunroof", "ventilatedSeats", "camera360", "connectedCar", "v2l", "v2v", "adas"]) {
    if (golden.features?.[key] !== undefined) fields[key] = golden.features[key];
  }
  return fields;
}

export function runConfidenceCalibration(golden, extractedDraft, mergedFields = {}) {
  const goldenFields = goldenScalarFields(golden);
  const flat = flattenExtractionDraft(extractedDraft);
  const bands = {
    "95-100": { predicted: 0, correct: 0, incorrect: 0, fields: [] },
    "80-94": { predicted: 0, correct: 0, incorrect: 0, fields: [] },
    "below-80": { predicted: 0, correct: 0, incorrect: 0, fields: [] },
  };

  for (const [fieldKey, expected] of Object.entries(goldenFields)) {
    if (expected === null || expected === undefined || expected === "") continue;

    const flatEntry = flat[fieldKey];
    const actual = extractFieldValue(flatEntry);
    if (actual === null || actual === undefined || actual === "") continue;

    const confidence =
      extractFieldConfidence(flatEntry) ||
      extractFieldConfidence(mergedFields[fieldKey]) ||
      0;
    const band = confidenceBandLabel(confidence);
    if (!bands[band]) continue;

    const cmp = compareField(fieldKey, expected, actual);
    if (cmp.status === "skipped") continue;

    bands[band].predicted += 1;
    if (cmp.correct) bands[band].correct += 1;
    else bands[band].incorrect += 1;
    bands[band].fields.push({
      fieldKey,
      confidence,
      correct: cmp.correct,
      expected: cmp.expected,
      actual: cmp.actual,
    });
  }

  const report = {};
  for (const [band, stats] of Object.entries(bands)) {
    report[band] = {
      ...stats,
      precision: stats.predicted ? stats.correct / stats.predicted : null,
      fields: stats.fields.slice(0, 20),
    };
  }

  return {
    generatedAt: new Date().toISOString(),
    goldenId: golden.id,
    bands: report,
    overconfidentBands: Object.entries(report)
      .filter(([, s]) => s.predicted >= 3 && s.precision !== null && s.precision < 0.7)
      .map(([band]) => band),
  };
}
