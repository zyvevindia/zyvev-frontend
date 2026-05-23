/**
 * Feedback loop clustering for ops learning.
 */

import {
  listLocalFeedback,
  summarizeLocalFeedback,
} from "../services/feedbackApi.js";
import {
  FEEDBACK_CATEGORY_DEFS,
  getFeedbackCategoryDef,
  normalizeFeedbackCategoryId,
  feedbackOpsPriorityScore,
} from "./feedbackTaxonomy.js";

const CLUSTER_LABELS = {
  ux: "UX",
  trust: "Trust",
  catalog: "Catalog",
  compare: "Compare quality",
  media: "Media quality",
  leads: "Lead flow",
  data_quality: "Data quality",
  freshness: "Freshness",
  discovery: "Discovery",
  other: "Other",
};

/**
 * Aggregate local feedback into operational clusters.
 */
export function buildFeedbackLearningReport() {
  const summary = summarizeLocalFeedback();
  const issues = listLocalFeedback();

  const clusters = {};
  for (const def of FEEDBACK_CATEGORY_DEFS) {
    clusters[def.group] = {
      id: def.group,
      label: CLUSTER_LABELS[def.group] || def.group,
      count: 0,
      highSeverity: 0,
      recurring: 0,
      samples: [],
    };
  }

  const routeCounts = {};
  for (const row of issues) {
    const cat = normalizeFeedbackCategoryId(row.category);
    const def = getFeedbackCategoryDef(cat);
    const group = def.group || "other";
    if (!clusters[group]) {
      clusters[group] = {
        id: group,
        label: CLUSTER_LABELS[group] || group,
        count: 0,
        highSeverity: 0,
        recurring: 0,
        samples: [],
      };
    }
    clusters[group].count += 1;
    if (String(row.severity).toLowerCase() === "high") {
      clusters[group].highSeverity += 1;
    }
    const route = row.route || row.page || "";
    if (route) {
      const key = `${group}:${route}`;
      routeCounts[key] = (routeCounts[key] || 0) + 1;
    }
    if (clusters[group].samples.length < 3) {
      clusters[group].samples.push({
        at: row.at,
        category: def.label,
        note: (row.description || row.note || "").slice(0, 120),
        severity: row.severity,
      });
    }
  }

  for (const [key, count] of Object.entries(routeCounts)) {
    if (count >= 2) {
      const group = key.split(":")[0];
      if (clusters[group]) clusters[group].recurring += 1;
    }
  }

  const prioritized = issues
    .map((row) => {
      const cat = normalizeFeedbackCategoryId(row.category);
      const severity = String(row.severity || "medium").toLowerCase();
      return {
        ...row,
        score: feedbackOpsPriorityScore(cat, severity),
        categoryLabel: getFeedbackCategoryDef(cat).label,
        cluster: getFeedbackCategoryDef(cat).group,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 15);

  const usefulness = {
    yes: summary.usefulnessYes ?? 0,
    no: summary.usefulnessNo ?? 0,
    total: summary.usefulnessTotal ?? 0,
  };

  return {
    summary,
    usefulness,
    clusters: Object.values(clusters)
      .filter((c) => c.count > 0)
      .sort((a, b) => b.count - a.count),
    prioritized,
    recurringIssues: prioritized.filter((p) => p.score >= 12),
    generatedAt: new Date().toISOString(),
  };
}
