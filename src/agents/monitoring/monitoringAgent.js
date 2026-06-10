/**
 * Monitoring Agent v1 — observe platform health, recommend only (no auto-fix).
 */
import { MONITORING_STATUS } from "./monitoringStatus.js";
import { runMonitoringWorkflow } from "./monitoringWorkflow.js";
import { sortAlerts, resetAlertCounter } from "./monitoringAlerts.js";
import { buildMonitoringRecommendation } from "./monitoringRecommendation.js";
import { computeMonitoringMetrics } from "./monitoringMetrics.js";
import { scoreVehicle } from "../../scoring/index.js";

export function createMonitoringScanInput(input = {}) {
  return {
    ok: true,
    scan: {
      status: MONITORING_STATUS.IDLE,
      label: input.label || "Platform health scan",
      createdBy: input.createdBy || null,
    },
  };
}

/**
 * Build score snapshot rows from vehicle dossiers.
 * @param {object[]} vehicles
 * @returns {object[]}
 */
export function buildScoreSnapshot(vehicles = []) {
  const generatedAt = new Date().toISOString();
  return (vehicles || []).map((v) => {
    const scored = scoreVehicle(v);
    return {
      familySlug: v.familySlug || v.id || v.fields?.familySlug,
      displayName: v.displayName || v.fields?.model,
      overallScore: scored.overall?.score ?? null,
      grade: scored.overall?.grade ?? null,
      generatedAt,
    };
  });
}

/**
 * Run full monitoring scan on provided snapshot.
 * @param {object} snapshot
 * @param {object} options
 */
export function runMonitoringScan(snapshot = {}, options = {}) {
  resetAlertCounter();

  const startedAt = new Date().toISOString();
  const normalized = {
    ...snapshot,
    now: snapshot.now ? new Date(snapshot.now) : new Date(),
  };

  try {
    const { alerts: rawAlerts } = runMonitoringWorkflow(normalized);
    const alerts = sortAlerts(rawAlerts);
    const recommendation = buildMonitoringRecommendation(alerts);
    const completedAt = new Date().toISOString();

    const scan = {
      status:
        recommendation.code === "NO_ACTION"
          ? MONITORING_STATUS.COMPLETED
          : MONITORING_STATUS.WAITING_FOR_REVIEW,
      startedAt,
      completedAt,
      durationMs: new Date(completedAt).getTime() - new Date(startedAt).getTime(),
      snapshot: normalized,
      alerts,
      recommendation,
      autonomousActionsTaken: 0,
    };

    scan.metrics = computeMonitoringMetrics(scan);

    return { ok: true, scan };
  } catch (err) {
    return {
      ok: false,
      errors: [err?.message || String(err)],
      scan: {
        status: MONITORING_STATUS.FAILED,
        startedAt,
        error: err?.message,
      },
    };
  }
}

export function approveMonitoringScan(scan, { approvedBy, note } = {}) {
  if (scan.status !== MONITORING_STATUS.WAITING_FOR_REVIEW) {
    return {
      ok: false,
      errors: [`Cannot approve scan in status: ${scan.status}`],
    };
  }
  return {
    ok: true,
    scan: {
      ...scan,
      status: MONITORING_STATUS.APPROVED,
      approvedAt: new Date().toISOString(),
      approvedBy: approvedBy || "human-reviewer",
      approvalNote: note || null,
    },
  };
}

export function rejectMonitoringScan(scan, { rejectedBy, reason } = {}) {
  return {
    ok: true,
    scan: {
      ...scan,
      status: MONITORING_STATUS.REJECTED,
      rejectedAt: new Date().toISOString(),
      rejectedBy: rejectedBy || "human-reviewer",
      rejectionReason: reason || "Rejected by reviewer",
    },
  };
}

export function resolveAlert(scan, alertId, { resolvedBy, note } = {}) {
  const alerts = (scan.alerts || []).map((a) =>
    a.id === alertId
      ? {
          ...a,
          resolvedAt: new Date().toISOString(),
          resolvedBy: resolvedBy || "human-reviewer",
          resolutionNote: note || null,
        }
      : a
  );
  return {
    ...scan,
    alerts,
    resolutionTimeMs:
      scan.startedAt && alerts.find((a) => a.id === alertId)?.resolvedAt
        ? new Date(alerts.find((a) => a.id === alertId).resolvedAt).getTime() -
          new Date(scan.startedAt).getTime()
        : scan.resolutionTimeMs,
  };
}

export { MONITORING_STATUS };
