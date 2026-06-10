/**
 * Analytics Agent v1 — platform recommendation from insights.
 */
import { ANALYTICS_RECOMMENDATION, INSIGHT_LEVEL } from "./analyticsStatus.js";
import { countByLevel } from "./analyticsInsights.js";

export function buildAnalyticsRecommendation(insights = []) {
  const counts = countByLevel(insights);

  if (counts.OPPORTUNITY > 0) {
    return {
      code: ANALYTICS_RECOMMENDATION.STRATEGIC_OPPORTUNITY,
      label: "Strategic opportunity",
      summary: `${counts.OPPORTUNITY} growth or optimization insight(s) — human review recommended before acting.`,
      insightCounts: counts,
    };
  }

  if (counts.WARNING > 0) {
    return {
      code: ANALYTICS_RECOMMENDATION.REVIEW_REQUIRED,
      label: "Review required",
      summary: `${counts.WARNING} warning insight(s) detected — human should review trends. No autonomous actions.`,
      insightCounts: counts,
    };
  }

  if (counts.INFO > 0) {
    return {
      code: ANALYTICS_RECOMMENDATION.NO_ACTION,
      label: "Informational",
      summary: `${counts.INFO} informational insight(s) recorded.`,
      insightCounts: counts,
    };
  }

  return {
    code: ANALYTICS_RECOMMENDATION.NO_ACTION,
    label: "No action required",
    summary: "Platform analytics within normal ranges.",
    insightCounts: counts,
  };
}

export function requiresHumanReview(recommendation) {
  return (
    recommendation?.code === ANALYTICS_RECOMMENDATION.REVIEW_REQUIRED ||
    recommendation?.code === ANALYTICS_RECOMMENDATION.STRATEGIC_OPPORTUNITY
  );
}

export function insightLevelToRecommendation(level) {
  if (level === INSIGHT_LEVEL.OPPORTUNITY) {
    return ANALYTICS_RECOMMENDATION.STRATEGIC_OPPORTUNITY;
  }
  if (level === INSIGHT_LEVEL.WARNING) {
    return ANALYTICS_RECOMMENDATION.REVIEW_REQUIRED;
  }
  return ANALYTICS_RECOMMENDATION.NO_ACTION;
}

export { ANALYTICS_RECOMMENDATION };
