/**
 * Monitoring Agent v1 — status and recommendation enums.
 */

export const MONITORING_STATUS = Object.freeze({
  IDLE: "idle",
  RUNNING: "running",
  COMPLETED: "completed",
  FAILED: "failed",
  WAITING_FOR_REVIEW: "waiting_for_review",
  APPROVED: "approved",
  REJECTED: "rejected",
});

export const ALERT_LEVEL = Object.freeze({
  INFO: "INFO",
  WARNING: "WARNING",
  CRITICAL: "CRITICAL",
});

export const MONITORING_RECOMMENDATION = Object.freeze({
  NO_ACTION: "NO_ACTION",
  REVIEW_REQUIRED: "REVIEW_REQUIRED",
  BLOCKED: "BLOCKED",
});

export const STATUS_LABELS = Object.freeze({
  [MONITORING_STATUS.IDLE]: "Idle",
  [MONITORING_STATUS.RUNNING]: "Running",
  [MONITORING_STATUS.COMPLETED]: "Completed",
  [MONITORING_STATUS.FAILED]: "Failed",
  [MONITORING_STATUS.WAITING_FOR_REVIEW]: "Waiting for review",
  [MONITORING_STATUS.APPROVED]: "Approved",
  [MONITORING_STATUS.REJECTED]: "Rejected",
});

export const ALERT_LEVEL_LABELS = Object.freeze({
  [ALERT_LEVEL.INFO]: "Info",
  [ALERT_LEVEL.WARNING]: "Warning",
  [ALERT_LEVEL.CRITICAL]: "Critical",
});

export function canHumanApprove(status) {
  return status === MONITORING_STATUS.WAITING_FOR_REVIEW;
}

export function alertLevelTone(level) {
  if (level === ALERT_LEVEL.CRITICAL) return "red";
  if (level === ALERT_LEVEL.WARNING) return "yellow";
  return "neutral";
}
