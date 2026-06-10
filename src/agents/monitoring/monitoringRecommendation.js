/**
 * Monitoring Agent v1 — platform recommendation from alerts.
 */
import { MONITORING_RECOMMENDATION, ALERT_LEVEL } from "./monitoringStatus.js";
import { countByLevel } from "./monitoringAlerts.js";

export function buildMonitoringRecommendation(alerts = []) {
  const counts = countByLevel(alerts);

  if (counts.CRITICAL > 0) {
    return {
      code: MONITORING_RECOMMENDATION.BLOCKED,
      label: "Blocked — critical issues",
      summary: `${counts.CRITICAL} critical alert(s) require human review before platform actions.`,
      alertCounts: counts,
    };
  }

  if (counts.WARNING > 0) {
    return {
      code: MONITORING_RECOMMENDATION.REVIEW_REQUIRED,
      label: "Review required",
      summary: `${counts.WARNING} warning(s) detected — human should review alerts. No autonomous corrections.`,
      alertCounts: counts,
    };
  }

  if (counts.INFO > 0) {
    return {
      code: MONITORING_RECOMMENDATION.REVIEW_REQUIRED,
      label: "Informational review",
      summary: `${counts.INFO} info alert(s) — optional human review.`,
      alertCounts: counts,
    };
  }

  return {
    code: MONITORING_RECOMMENDATION.NO_ACTION,
    label: "No action required",
    summary: "All monitored signals within thresholds.",
    alertCounts: counts,
  };
}

export function requiresHumanReview(recommendation) {
  return (
    recommendation?.code === MONITORING_RECOMMENDATION.REVIEW_REQUIRED ||
    recommendation?.code === MONITORING_RECOMMENDATION.BLOCKED
  );
}

export function alertLevelToRecommendation(level) {
  if (level === ALERT_LEVEL.CRITICAL) return MONITORING_RECOMMENDATION.BLOCKED;
  if (level === ALERT_LEVEL.WARNING) return MONITORING_RECOMMENDATION.REVIEW_REQUIRED;
  return MONITORING_RECOMMENDATION.NO_ACTION;
}

export { MONITORING_RECOMMENDATION };
