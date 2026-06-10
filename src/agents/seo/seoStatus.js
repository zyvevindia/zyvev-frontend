/**
 * SEO Agent v1 — job status and recommendation enums.
 */

export const SEO_STATUS = Object.freeze({
  DRAFT: "draft",
  GENERATING: "generating",
  REVIEW_REQUIRED: "review_required",
  APPROVED: "approved",
  PUBLISHED: "published",
  REJECTED: "rejected",
});

export const SEO_RECOMMENDATION = Object.freeze({
  READY: "READY",
  REVIEW_REQUIRED: "REVIEW_REQUIRED",
  BLOCKED: "BLOCKED",
});

export const STATUS_LABELS = Object.freeze({
  [SEO_STATUS.DRAFT]: "Draft",
  [SEO_STATUS.GENERATING]: "Generating",
  [SEO_STATUS.REVIEW_REQUIRED]: "Review required",
  [SEO_STATUS.APPROVED]: "Approved",
  [SEO_STATUS.PUBLISHED]: "Published",
  [SEO_STATUS.REJECTED]: "Rejected",
});

export const RECOMMENDATION_LABELS = Object.freeze({
  [SEO_RECOMMENDATION.READY]: "Ready for human review",
  [SEO_RECOMMENDATION.REVIEW_REQUIRED]: "Review required — data gaps",
  [SEO_RECOMMENDATION.BLOCKED]: "Blocked — missing required data",
});

export const ALLOWED_TRANSITIONS = Object.freeze({
  [SEO_STATUS.DRAFT]: [SEO_STATUS.GENERATING, SEO_STATUS.REJECTED],
  [SEO_STATUS.GENERATING]: [
    SEO_STATUS.REVIEW_REQUIRED,
    SEO_STATUS.REJECTED,
  ],
  [SEO_STATUS.REVIEW_REQUIRED]: [
    SEO_STATUS.APPROVED,
    SEO_STATUS.REJECTED,
    SEO_STATUS.GENERATING,
  ],
  [SEO_STATUS.APPROVED]: [
    SEO_STATUS.PUBLISHED,
    SEO_STATUS.REVIEW_REQUIRED,
    SEO_STATUS.REJECTED,
  ],
  [SEO_STATUS.PUBLISHED]: [],
  [SEO_STATUS.REJECTED]: [SEO_STATUS.DRAFT],
});

export function canTransition(fromStatus, toStatus) {
  return (ALLOWED_TRANSITIONS[fromStatus] || []).includes(toStatus);
}

export function canHumanApprove(status) {
  return status === SEO_STATUS.REVIEW_REQUIRED;
}

export function canHumanPublish(status) {
  return status === SEO_STATUS.APPROVED;
}

export function isTerminalStatus(status) {
  return (
    status === SEO_STATUS.PUBLISHED || status === SEO_STATUS.REJECTED
  );
}
