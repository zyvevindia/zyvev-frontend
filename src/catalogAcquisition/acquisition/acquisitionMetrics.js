/**
 * v5 acquisition quality metrics — evidence volume and composite score.
 */

import { ACQUISITION_EVIDENCE_TARGETS } from "../constants.js";

/**
 * @param {object} input
 * @param {number} input.evidenceRecordCount
 * @param {number} [input.rawHtmlSize]
 * @param {number} [input.renderedTextSize]
 * @param {boolean} [input.urlValid]
 * @param {boolean} [input.pdfFound]
 * @param {boolean} [input.oemAcquired]
 */
export function buildAcquisitionMetrics(input = {}) {
  const evidenceRecordCount = Number(input.evidenceRecordCount) || 0;
  const rawHtmlSize = Number(input.rawHtmlSize) || 0;
  const renderedTextSize = Number(input.renderedTextSize) || 0;
  const urlValid = Boolean(input.urlValid);
  const pdfFound = Boolean(input.pdfFound);
  const oemAcquired = Boolean(input.oemAcquired);

  const evidenceTarget = ACQUISITION_EVIDENCE_TARGETS.TARGET;
  const failureThreshold = ACQUISITION_EVIDENCE_TARGETS.FAILURE_THRESHOLD;

  const evidenceRatio = Math.min(1, evidenceRecordCount / evidenceTarget);
  const textRatio = Math.min(1, renderedTextSize / 10_000);

  let acquisitionScore = Math.round(
    evidenceRatio * 50 +
      (urlValid ? 20 : 0) +
      (pdfFound ? 15 : 0) +
      (oemAcquired ? 10 : 0) +
      textRatio * 5
  );
  acquisitionScore = Math.min(100, Math.max(0, acquisitionScore));

  const acquisitionFailure =
    evidenceRecordCount < failureThreshold ||
    !urlValid ||
    !oemAcquired;

  return {
    rawHtmlSize,
    renderedTextSize,
    evidenceRecordCount,
    evidenceTarget,
    failureThreshold,
    meetsTarget: evidenceRecordCount >= evidenceTarget,
    acquisitionFailure,
    acquisitionFailureReasons: [
      evidenceRecordCount < failureThreshold
        ? `Evidence count ${evidenceRecordCount} < ${failureThreshold}`
        : null,
      !urlValid ? "OEM URL validation failed" : null,
      !oemAcquired ? "Official OEM page not acquired" : null,
    ].filter(Boolean),
    urlValid,
    pdfFound,
    oemAcquired,
    acquisitionScore,
  };
}

/**
 * Compare evidence counts from raw vs rendered content (measurement only).
 */
export function buildContentComparisonMetrics(raw = {}, rendered = {}, pdf = {}) {
  return {
    raw: {
      htmlSize: raw.htmlSize ?? 0,
      visibleTextSize: raw.visibleTextSize ?? 0,
      evidenceRecordCount: raw.evidenceRecordCount ?? 0,
    },
    rendered: {
      htmlSize: rendered.htmlSize ?? 0,
      visibleTextSize: rendered.visibleTextSize ?? 0,
      evidenceRecordCount: rendered.evidenceRecordCount ?? 0,
    },
    pdf: {
      byteSize: pdf.byteSize ?? 0,
      evidenceRecordCount: pdf.evidenceRecordCount ?? 0,
    },
  };
}
