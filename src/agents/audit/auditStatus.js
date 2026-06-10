/**
 * Audit Agent v1 — status, severity, and recommendation enums.
 */

export const AUDIT_STATUS = Object.freeze({
  IDLE: "idle",
  RUNNING: "running",
  COMPLETED: "completed",
  FAILED: "failed",
  WAITING_FOR_REVIEW: "waiting_for_review",
  APPROVED: "approved",
  REJECTED: "rejected",
});

export const FINDING_SEVERITY = Object.freeze({
  INFO: "INFO",
  WARNING: "WARNING",
  CRITICAL: "CRITICAL",
});

export const AUDIT_RECOMMENDATION = Object.freeze({
  NO_ACTION: "NO_ACTION",
  REVIEW_REQUIRED: "REVIEW_REQUIRED",
  BLOCKED: "BLOCKED",
});

export const STATUS_LABELS = Object.freeze({
  [AUDIT_STATUS.IDLE]: "Idle",
  [AUDIT_STATUS.RUNNING]: "Running",
  [AUDIT_STATUS.COMPLETED]: "Completed",
  [AUDIT_STATUS.FAILED]: "Failed",
  [AUDIT_STATUS.WAITING_FOR_REVIEW]: "Waiting for review",
  [AUDIT_STATUS.APPROVED]: "Approved",
  [AUDIT_STATUS.REJECTED]: "Rejected",
});

export const SEVERITY_LABELS = Object.freeze({
  [FINDING_SEVERITY.INFO]: "Info",
  [FINDING_SEVERITY.WARNING]: "Warning",
  [FINDING_SEVERITY.CRITICAL]: "Critical",
});

export function canHumanApprove(status) {
  return status === AUDIT_STATUS.WAITING_FOR_REVIEW;
}

export function severityTone(severity) {
  if (severity === FINDING_SEVERITY.CRITICAL) return "red";
  if (severity === FINDING_SEVERITY.WARNING) return "yellow";
  return "neutral";
}
