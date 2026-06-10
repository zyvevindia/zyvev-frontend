/**
 * Orchestrator execution states — unified across all agents.
 */
export const ORCHESTRATOR_STATUS = Object.freeze({
  IDLE: "idle",
  RUNNING: "running",
  COMPLETED: "completed",
  FAILED: "failed",
  WAITING_FOR_REVIEW: "waiting_for_review",
  APPROVED: "approved",
  REJECTED: "rejected",
});

export const STATUS_LABELS = Object.freeze({
  [ORCHESTRATOR_STATUS.IDLE]: "Idle",
  [ORCHESTRATOR_STATUS.RUNNING]: "Running",
  [ORCHESTRATOR_STATUS.COMPLETED]: "Completed",
  [ORCHESTRATOR_STATUS.FAILED]: "Failed",
  [ORCHESTRATOR_STATUS.WAITING_FOR_REVIEW]: "Waiting for review",
  [ORCHESTRATOR_STATUS.APPROVED]: "Approved",
  [ORCHESTRATOR_STATUS.REJECTED]: "Rejected",
});

export function isTerminalStatus(status) {
  return (
    status === ORCHESTRATOR_STATUS.COMPLETED ||
    status === ORCHESTRATOR_STATUS.FAILED ||
    status === ORCHESTRATOR_STATUS.REJECTED ||
    status === ORCHESTRATOR_STATUS.APPROVED
  );
}

export function canHumanApprove(status) {
  return status === ORCHESTRATOR_STATUS.WAITING_FOR_REVIEW;
}

export function canHumanExecute(status) {
  return status === ORCHESTRATOR_STATUS.APPROVED;
}

export function statusTone(status) {
  if (status === ORCHESTRATOR_STATUS.COMPLETED) return "green";
  if (status === ORCHESTRATOR_STATUS.APPROVED) return "green";
  if (status === ORCHESTRATOR_STATUS.WAITING_FOR_REVIEW) return "yellow";
  if (status === ORCHESTRATOR_STATUS.FAILED) return "red";
  if (status === ORCHESTRATOR_STATUS.REJECTED) return "red";
  if (status === ORCHESTRATOR_STATUS.RUNNING) return "blue";
  return "neutral";
}
