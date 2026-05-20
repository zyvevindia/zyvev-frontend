/** @typedef {'pending'|'approved'|'rejected'|'deferred'} IngestionReviewStatus */

export const INGESTION_FORMAT = "evsavari-ingestion/1";

export const QUEUE_STORAGE_KEY = "evsavari-catalog-ingestion-queue-v1";

export const MAX_QUEUE_SESSIONS = 40;

export const REVIEW_STATUS = Object.freeze({
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  DEFERRED: "deferred",
});

/** @enum {string} */
export const CHANGE_SEVERITY = Object.freeze({
  MINOR: "minor",
  PRICING: "pricing",
  INTELLIGENCE: "intelligence",
});

export const STALE_PENDING_MS = 7 * 24 * 60 * 60 * 1000;
