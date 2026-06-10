/**
 * Analytics Agent v1 — read-only BI reports (no auto-execute).
 */
import { ANALYTICS_STATUS } from "./analyticsStatus.js";
import { runAnalyticsWorkflow } from "./analyticsWorkflow.js";
import { sortInsights, resetInsightCounter } from "./analyticsInsights.js";
import { buildAnalyticsRecommendation } from "./analyticsRecommendation.js";
import { computeAnalyticsMetrics } from "./analyticsMetrics.js";
import { scoreVehicle } from "../../scoring/index.js";

export function createAnalyticsReportInput(input = {}) {
  return {
    ok: true,
    report: {
      status: ANALYTICS_STATUS.IDLE,
      label: input.label || "Platform analytics report",
      createdBy: input.createdBy || null,
    },
  };
}

/**
 * Build score records for analytics from vehicle dossiers.
 * @param {object[]} vehicles
 * @returns {object[]}
 */
export function buildAnalyticsScoreRecords(vehicles = []) {
  const generatedAt = new Date().toISOString();
  return (vehicles || []).map((v) => {
    const scored = scoreVehicle(v);
    const slug = v.familySlug || v.id || v.fields?.familySlug;
    return {
      familySlug: slug,
      displayName: v.displayName || v.fields?.model,
      overallScore: scored.overall?.score ?? null,
      grade: scored.overall?.grade ?? null,
      breakdown: scored.breakdown || {},
      generatedAt,
    };
  });
}

/**
 * Run full analytics report on provided snapshot.
 * @param {object} snapshot
 */
export function runAnalyticsReport(snapshot = {}, options = {}) {
  resetInsightCounter();

  const startedAt = new Date().toISOString();
  const normalized = {
    ...snapshot,
    now: snapshot.now ? new Date(snapshot.now) : new Date(),
    scoreRecords:
      snapshot.scoreRecords ||
      buildAnalyticsScoreRecords(snapshot.vehicles || []),
  };

  try {
    const { insights: rawInsights } = runAnalyticsWorkflow(normalized);
    const insights = sortInsights(rawInsights);
    const recommendation = buildAnalyticsRecommendation(insights);
    const completedAt = new Date().toISOString();

    const report = {
      status:
        recommendation.code === "NO_ACTION"
          ? ANALYTICS_STATUS.COMPLETED
          : ANALYTICS_STATUS.WAITING_FOR_REVIEW,
      startedAt,
      completedAt,
      durationMs:
        new Date(completedAt).getTime() - new Date(startedAt).getTime(),
      snapshot: normalized,
      insights,
      recommendation,
      autonomousActionsTaken: 0,
    };

    report.metrics = computeAnalyticsMetrics(report, normalized);

    return { ok: true, report };
  } catch (err) {
    return {
      ok: false,
      errors: [err?.message || String(err)],
      report: {
        status: ANALYTICS_STATUS.FAILED,
        startedAt,
        error: err?.message,
      },
    };
  }
}

export function approveAnalyticsReport(report, { approvedBy, note } = {}) {
  if (report.status !== ANALYTICS_STATUS.WAITING_FOR_REVIEW) {
    return {
      ok: false,
      errors: [`Cannot approve report in status: ${report.status}`],
    };
  }
  return {
    ok: true,
    report: {
      ...report,
      status: ANALYTICS_STATUS.APPROVED,
      approvedAt: new Date().toISOString(),
      approvedBy: approvedBy || "human-reviewer",
      approvalNote: note || null,
    },
  };
}

export function rejectAnalyticsReport(report, { rejectedBy, reason } = {}) {
  return {
    ok: true,
    report: {
      ...report,
      status: ANALYTICS_STATUS.REJECTED,
      rejectedAt: new Date().toISOString(),
      rejectedBy: rejectedBy || "human-reviewer",
      rejectionReason: reason || "Rejected by reviewer",
    },
  };
}

export { ANALYTICS_STATUS };
