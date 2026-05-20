/**
 * Operational learning summary — local feedback + usage buffer + OEM/editorial queues.
 */

import { listLocalFeedback, summarizeLocalFeedback } from "../services/feedbackApi.js";
import {
  feedbackOpsPriorityScore,
  getFeedbackCategoryDef,
  normalizeFeedbackCategoryId,
} from "./feedbackTaxonomy.js";
import {
  listUsageLearningEvents,
  summarizeUsageLearningBuffer,
} from "./usageLearningBuffer.js";
import { summarizeOemQueue } from "./oemUpdateQueue.js";
import { summarizeEditorialFlags } from "./editorialContentFlags.js";

/**
 * Enhanced prioritized issues from local buffer (newest first).
 */
export function buildPrioritizedFeedbackRows(limit = 20) {
  const issues = listLocalFeedback();
  const enriched = issues.map((row) => {
    const cat = normalizeFeedbackCategoryId(row.category);
    const severity = String(row.severity || "medium").toLowerCase();
    const score = feedbackOpsPriorityScore(cat, severity);
    const def = getFeedbackCategoryDef(cat);
    return {
      ...row,
      categoryNormalized: cat,
      categoryLabel: def.label,
      severity,
      score,
    };
  });
  return enriched.sort((a, b) => b.score - a.score).slice(0, limit);
}

/**
 * Full dashboard payload (no network).
 */
export function buildUsageLearningDashboardPayload() {
  const feedback = summarizeLocalFeedback();
  const usage = summarizeUsageLearningBuffer(listUsageLearningEvents());
  const oem = summarizeOemQueue();
  const editorial = summarizeEditorialFlags();
  const prioritized = buildPrioritizedFeedbackRows(25);

  return {
    feedback,
    usageLearning: usage,
    oem,
    editorial,
    prioritizedFeedback: prioritized,
    generatedAt: new Date().toISOString(),
  };
}
