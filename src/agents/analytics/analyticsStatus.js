/**
 * Analytics Agent v1 — status, insight level, and recommendation enums.
 */

export const ANALYTICS_STATUS = Object.freeze({
  IDLE: "idle",
  RUNNING: "running",
  COMPLETED: "completed",
  FAILED: "failed",
  WAITING_FOR_REVIEW: "waiting_for_review",
  APPROVED: "approved",
  REJECTED: "rejected",
});

export const INSIGHT_LEVEL = Object.freeze({
  INFO: "INFO",
  OPPORTUNITY: "OPPORTUNITY",
  WARNING: "WARNING",
});

export const ANALYTICS_RECOMMENDATION = Object.freeze({
  NO_ACTION: "NO_ACTION",
  REVIEW_REQUIRED: "REVIEW_REQUIRED",
  STRATEGIC_OPPORTUNITY: "STRATEGIC_OPPORTUNITY",
});

export const STATUS_LABELS = Object.freeze({
  [ANALYTICS_STATUS.IDLE]: "Idle",
  [ANALYTICS_STATUS.RUNNING]: "Running",
  [ANALYTICS_STATUS.COMPLETED]: "Completed",
  [ANALYTICS_STATUS.FAILED]: "Failed",
  [ANALYTICS_STATUS.WAITING_FOR_REVIEW]: "Waiting for review",
  [ANALYTICS_STATUS.APPROVED]: "Approved",
  [ANALYTICS_STATUS.REJECTED]: "Rejected",
});

export const INSIGHT_LEVEL_LABELS = Object.freeze({
  [INSIGHT_LEVEL.INFO]: "Info",
  [INSIGHT_LEVEL.OPPORTUNITY]: "Opportunity",
  [INSIGHT_LEVEL.WARNING]: "Warning",
});

export function canHumanApprove(status) {
  return status === ANALYTICS_STATUS.WAITING_FOR_REVIEW;
}

export function insightLevelTone(level) {
  if (level === INSIGHT_LEVEL.WARNING) return "yellow";
  if (level === INSIGHT_LEVEL.OPPORTUNITY) return "green";
  return "neutral";
}
