/**
 * Analytics Agent v1 — insight construction (read-only, no auto-execute).
 */
import { INSIGHT_LEVEL } from "./analyticsStatus.js";
import { ANALYTICS_CATEGORIES } from "./analyticsRules.js";

let insightCounter = 0;

function newInsightId() {
  insightCounter += 1;
  return `insight_${Date.now()}_${insightCounter}`;
}

export function resetInsightCounter() {
  insightCounter = 0;
}

/**
 * @param {object} params
 * @returns {object}
 */
export function createInsight({
  level = INSIGHT_LEVEL.INFO,
  category,
  code,
  message,
  entityId = null,
  value = null,
  metadata = {},
  recommendation = null,
}) {
  return {
    id: newInsightId(),
    level,
    category,
    code,
    message,
    entityId,
    value,
    metadata,
    recommendation,
    detectedAt: new Date().toISOString(),
    autoExecuted: false,
  };
}

export function sortInsights(insights = []) {
  const order = { OPPORTUNITY: 0, WARNING: 1, INFO: 2 };
  return [...insights].sort(
    (a, b) =>
      (order[a.level] ?? 9) - (order[b.level] ?? 9) ||
      String(a.category).localeCompare(String(b.category))
  );
}

export function groupInsightsByCategory(insights = []) {
  const groups = {};
  for (const insight of insights) {
    const key = insight.category || "other";
    if (!groups[key]) groups[key] = [];
    groups[key].push(insight);
  }
  return groups;
}

export function countByLevel(insights = []) {
  return {
    INFO: insights.filter((i) => i.level === INSIGHT_LEVEL.INFO).length,
    OPPORTUNITY: insights.filter((i) => i.level === INSIGHT_LEVEL.OPPORTUNITY).length,
    WARNING: insights.filter((i) => i.level === INSIGHT_LEVEL.WARNING).length,
    total: insights.length,
  };
}

export { INSIGHT_LEVEL, ANALYTICS_CATEGORIES };
