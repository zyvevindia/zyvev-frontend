/**
 * Review time metrics — track reviewer effort for onboarding statistics.
 */

import { flattenExtractionDraft, ALL_SCALAR_FIELD_KEYS } from "../extractionSchema.js";
import { extractFieldValue } from "./compareUtils.js";

export function createReviewSession(importId) {
  return {
    importId,
    startedAt: new Date().toISOString(),
    endedAt: null,
    fieldsEdited: [],
    fieldsApproved: [],
    fieldsRejected: [],
    durationMs: null,
  };
}

export function finalizeReviewSession(session) {
  if (!session?.startedAt) return session;
  const endedAt = new Date().toISOString();
  const durationMs = Date.parse(endedAt) - Date.parse(session.startedAt);
  return { ...session, endedAt, durationMs };
}

export function computeReviewDiff(extractedDraft, reviewedDraft) {
  const extracted = flattenExtractionDraft(extractedDraft);
  const reviewed = flattenExtractionDraft(reviewedDraft);
  const edited = [];
  const approved = [];
  const rejected = [];

  for (const key of ALL_SCALAR_FIELD_KEYS) {
    const ev = extractFieldValue(extracted[key]);
    const rv = extractFieldValue(reviewed[key]);
    const rej = reviewed[key]?.rejected;

    if (rej) {
      rejected.push(key);
      continue;
    }
    if (rv !== null && rv !== undefined && rv !== "" && rv !== ev) {
      edited.push({ fieldKey: key, from: ev, to: rv });
    } else if (rv !== null && rv !== undefined && rv !== "") {
      approved.push(key);
    }
  }

  return { edited, approved, rejected };
}

export function buildReviewMetricsReport(session, extractedDraft, reviewedDraft) {
  const diff = computeReviewDiff(extractedDraft, reviewedDraft);
  const finalized = session?.endedAt ? session : finalizeReviewSession(session);

  return {
    generatedAt: new Date().toISOString(),
    importId: finalized?.importId,
    reviewStartedAt: finalized?.startedAt,
    reviewEndedAt: finalized?.endedAt,
    durationMs: finalized?.durationMs,
    durationMinutes: finalized?.durationMs
      ? Math.round((finalized.durationMs / 60000) * 10) / 10
      : null,
    fieldsEditedCount: diff.edited.length,
    fieldsApprovedCount: diff.approved.length,
    fieldsRejectedCount: diff.rejected.length,
    fieldsEdited: diff.edited,
    fieldsApproved: diff.approved,
    fieldsRejected: diff.rejected,
    onboardingStats: {
      avgEditsPerImport: diff.edited.length,
      reviewEfficiency:
        diff.approved.length + diff.edited.length
          ? diff.approved.length / (diff.approved.length + diff.edited.length)
          : null,
    },
  };
}

export const REVIEW_METRICS_STORAGE_KEY = "evsavari-catalog-review-metrics";

export function persistReviewMetrics(importId, report) {
  if (typeof localStorage === "undefined") return;
  try {
    const raw = localStorage.getItem(REVIEW_METRICS_STORAGE_KEY);
    const all = raw ? JSON.parse(raw) : {};
    all[importId] = report;
    localStorage.setItem(REVIEW_METRICS_STORAGE_KEY, JSON.stringify(all));
  } catch {
    /* ignore quota errors */
  }
}

export function loadReviewMetricsHistory() {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(REVIEW_METRICS_STORAGE_KEY);
    const all = raw ? JSON.parse(raw) : {};
    return Object.values(all).sort(
      (a, b) => Date.parse(b.generatedAt || 0) - Date.parse(a.generatedAt || 0)
    );
  } catch {
    return [];
  }
}
