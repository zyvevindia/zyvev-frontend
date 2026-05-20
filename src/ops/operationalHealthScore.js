/**
 * Single operational health score (0–100, higher is healthier) — heuristic for internal dashboards.
 */

import { queueSummaryCounts } from "../intelligence/ingestion/reviewQueueStore.js";

/**
 * @param {object} input
 */
export function computeOperationalHealthScore(input = {}) {
  const {
    highSeverityFeedback = 0,
    editorialFlagTotal = 0,
    checklistDone = 0,
    checklistTotal = 6,
    seoHighSeverity = 0,
    compareQueueHotspots = 0,
    staleIngestionPending = 0,
  } = input;

  let score = 100;
  score -= Math.min(28, highSeverityFeedback * 7);
  score -= Math.min(18, editorialFlagTotal * 2);
  score -= Math.min(12, seoHighSeverity * 4);
  score -= Math.min(12, compareQueueHotspots * 2);
  score -= Math.min(20, staleIngestionPending * 10);

  const ratio = checklistTotal ? checklistDone / checklistTotal : 0;
  score += Math.round(ratio * 8);

  return Math.max(0, Math.min(100, Math.round(score)));
}

export function ingestionStalePendingCount() {
  return queueSummaryCounts().stalePending;
}
