/**
 * Feedback prioritization engine — high impact, weighted clusters.
 */

import { buildFeedbackLearningReport } from "./feedbackLearningOps.js";
import {
  normalizeFeedbackCategoryId,
  getFeedbackCategoryDef,
} from "./feedbackTaxonomy.js";

const IMPACT_WEIGHTS = {
  trust: 1.4,
  compare: 1.35,
  data_quality: 1.3,
  leads: 1.25,
  media: 1.1,
  ux: 1.15,
  freshness: 1.2,
  catalog: 1.1,
  discovery: 1.0,
  other: 1.0,
};

const HIGH_IMPACT_CATEGORIES = new Set([
  "incorrect_ev_data",
  "compare_confusing",
  "recommendation_mismatch",
  "charging_range_trust",
  "form_lead",
  "broken_image",
]);

/**
 * Extended report with prioritization engine.
 */
export function buildFeedbackPrioritizationReport() {
  const base = buildFeedbackLearningReport();

  const prioritized = base.prioritized.map((row) => {
    const cat = normalizeFeedbackCategoryId(row.category);
    const def = getFeedbackCategoryDef(cat);
    const group = def.group || "other";
    const weight = IMPACT_WEIGHTS[group] ?? 1;
    const impactScore = Math.round(row.score * weight);
    const highImpact =
      HIGH_IMPACT_CATEGORIES.has(cat) ||
      row.severity === "high" ||
      impactScore >= 18;

    const recurringBoost = base.recurringIssues.some((r) => r.id === row.id)
      ? 1.25
      : 1;

    return {
      ...row,
      impactScore: Math.round(impactScore * recurringBoost),
      highImpact,
      weightLabel: group,
      mobileUx: cat === "ux_confusion" || row.route?.includes("compare"),
      trustIssue: group === "trust" || group === "data_quality",
      compareIssue: group === "compare",
    };
  });

  prioritized.sort((a, b) => b.impactScore - a.impactScore);

  const recurringScored = {};
  for (const row of prioritized) {
    const k = row.weightLabel;
    recurringScored[k] = (recurringScored[k] || 0) + 1;
  }

  return {
    ...base,
    prioritized,
    highImpactIssues: prioritized.filter((p) => p.highImpact).slice(0, 12),
    recurringByCluster: recurringScored,
    trustWeightedCount: prioritized.filter((p) => p.trustIssue).length,
    compareWeightedCount: prioritized.filter((p) => p.compareIssue).length,
    mobileWeightedCount: prioritized.filter((p) => p.mobileUx).length,
    generatedAt: new Date().toISOString(),
  };
}
