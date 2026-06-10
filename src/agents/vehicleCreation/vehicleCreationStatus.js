/**
 * Vehicle Creation Agent v1 — job status and recommendation enums.
 */

export const VEHICLE_CREATION_STATUS = Object.freeze({
  DRAFT: "draft",
  ACQUIRING: "acquiring",
  EXTRACTING: "extracting",
  REVIEW_REQUIRED: "review_required",
  APPROVED: "approved",
  PUBLISHED: "published",
  REJECTED: "rejected",
});

export const VEHICLE_CREATION_RECOMMENDATION = Object.freeze({
  READY: "READY",
  REVIEW_REQUIRED: "REVIEW_REQUIRED",
  BLOCKED: "BLOCKED",
});

export const STATUS_LABELS = Object.freeze({
  [VEHICLE_CREATION_STATUS.DRAFT]: "Draft",
  [VEHICLE_CREATION_STATUS.ACQUIRING]: "Acquiring sources",
  [VEHICLE_CREATION_STATUS.EXTRACTING]: "Extracting evidence",
  [VEHICLE_CREATION_STATUS.REVIEW_REQUIRED]: "Review required",
  [VEHICLE_CREATION_STATUS.APPROVED]: "Approved",
  [VEHICLE_CREATION_STATUS.PUBLISHED]: "Published",
  [VEHICLE_CREATION_STATUS.REJECTED]: "Rejected",
});

export const RECOMMENDATION_LABELS = Object.freeze({
  [VEHICLE_CREATION_RECOMMENDATION.READY]: "Ready to approve",
  [VEHICLE_CREATION_RECOMMENDATION.REVIEW_REQUIRED]: "Human review required",
  [VEHICLE_CREATION_RECOMMENDATION.BLOCKED]: "Blocked — fix before publish",
});

/** Valid human-driven transitions (no autonomous publish). */
export const ALLOWED_TRANSITIONS = Object.freeze({
  [VEHICLE_CREATION_STATUS.DRAFT]: [
    VEHICLE_CREATION_STATUS.ACQUIRING,
    VEHICLE_CREATION_STATUS.REJECTED,
  ],
  [VEHICLE_CREATION_STATUS.ACQUIRING]: [
    VEHICLE_CREATION_STATUS.EXTRACTING,
    VEHICLE_CREATION_STATUS.REVIEW_REQUIRED,
    VEHICLE_CREATION_STATUS.REJECTED,
  ],
  [VEHICLE_CREATION_STATUS.EXTRACTING]: [
    VEHICLE_CREATION_STATUS.REVIEW_REQUIRED,
    VEHICLE_CREATION_STATUS.REJECTED,
  ],
  [VEHICLE_CREATION_STATUS.REVIEW_REQUIRED]: [
    VEHICLE_CREATION_STATUS.APPROVED,
    VEHICLE_CREATION_STATUS.REJECTED,
  ],
  [VEHICLE_CREATION_STATUS.APPROVED]: [
    VEHICLE_CREATION_STATUS.PUBLISHED,
    VEHICLE_CREATION_STATUS.REVIEW_REQUIRED,
    VEHICLE_CREATION_STATUS.REJECTED,
  ],
  [VEHICLE_CREATION_STATUS.PUBLISHED]: [],
  [VEHICLE_CREATION_STATUS.REJECTED]: [VEHICLE_CREATION_STATUS.DRAFT],
});

export function canTransition(fromStatus, toStatus) {
  const allowed = ALLOWED_TRANSITIONS[fromStatus] || [];
  return allowed.includes(toStatus);
}

export function isTerminalStatus(status) {
  return (
    status === VEHICLE_CREATION_STATUS.PUBLISHED ||
    status === VEHICLE_CREATION_STATUS.REJECTED
  );
}

export function canHumanApprove(status) {
  return status === VEHICLE_CREATION_STATUS.REVIEW_REQUIRED;
}

export function canHumanPublish(status) {
  return status === VEHICLE_CREATION_STATUS.APPROVED;
}
