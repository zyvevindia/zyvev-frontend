/**
 * Monitoring Agent v1 — health and freshness metrics.
 */
import { ALERT_LEVEL } from "./monitoringStatus.js";
import { countByLevel } from "./monitoringAlerts.js";
import { daysSince, FRESHNESS_THRESHOLDS_DAYS } from "./monitoringRules.js";

export function computeFreshnessScore(snapshot, alerts = []) {
  const freshnessAlerts = alerts.filter(
    (a) => a.category === "catalog_freshness"
  );
  let score = 100;
  score -= freshnessAlerts.filter((a) => a.level === ALERT_LEVEL.WARNING).length * 8;
  score -= freshnessAlerts.filter((a) => a.level === ALERT_LEVEL.CRITICAL).length * 20;

  const registry = snapshot.registry || [];
  const verifiedDates = registry
    .map((r) => r.lastVerifiedAt)
    .filter(Boolean);
  if (verifiedDates.length) {
    const avgDays =
      verifiedDates.reduce((s, d) => s + (daysSince(d, snapshot.now) || 0), 0) /
      verifiedDates.length;
    if (avgDays > FRESHNESS_THRESHOLDS_DAYS.registryVerification) {
      score -= 10;
    }
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

export function computeHealthScore(alerts = []) {
  const counts = countByLevel(alerts);
  let score = 100;
  score -= counts.CRITICAL * 15;
  score -= counts.WARNING * 5;
  score -= counts.INFO * 1;
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function computeAgentHealthMetrics(snapshot) {
  const agents = {
    vehicleCreation: analyzeJobs(snapshot.vehicleCreationJobs || [], "vehicleCreation"),
    changeDetection: analyzeJobs(snapshot.changeDetectionJobs || [], "changeDetection"),
    seo: analyzeJobs(snapshot.seoJobs || [], "seo"),
    orchestrator: analyzeExecutions(snapshot.orchestratorExecutions || []),
    scoreEngine: analyzeScoreRuns(snapshot.scoreSnapshots || {}),
  };
  return agents;
}

function analyzeJobs(jobs, agentId) {
  const total = jobs.length;
  const failed = jobs.filter(
    (j) => j.status === "rejected" || j.error
  ).length;
  const success = jobs.filter(
    (j) => j.status === "published" || j.status === "approved" || j.status === "review_required"
  ).length;
  const durations = jobs
    .map((j) => j.durationMs)
    .filter((d) => d != null && Number.isFinite(d));

  return {
    agentId,
    totalRuns: total,
    successRatePct: total > 0 ? Math.round((success / total) * 1000) / 10 : null,
    failureRatePct: total > 0 ? Math.round((failed / total) * 1000) / 10 : null,
    averageDurationMs: durations.length
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : null,
    lastRunAt: jobs[0]?.updatedAt || jobs[0]?.createdAt || null,
  };
}

function analyzeExecutions(logs) {
  const total = logs.length;
  const failed = logs.filter((l) => l.status === "failed").length;
  const success = logs.filter(
    (l) => l.status === "completed" || l.status === "approved"
  ).length;
  const durations = logs.map((l) => l.durationMs).filter(Number.isFinite);

  return {
    agentId: "orchestrator",
    totalRuns: total,
    successRatePct: total > 0 ? Math.round((success / total) * 1000) / 10 : null,
    failureRatePct: total > 0 ? Math.round((failed / total) * 1000) / 10 : null,
    averageDurationMs: durations.length
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : null,
    lastRunAt: logs[0]?.createdAt || null,
  };
}

function analyzeScoreRuns(scoreSnapshots) {
  const current = scoreSnapshots.current || [];
  return {
    agentId: "scoreEngine",
    totalRuns: current.length,
    lastRunAt: scoreSnapshots.lastGeneratedAt || null,
    vehiclesScored: current.length,
  };
}

export function computeMonitoringMetrics(scan) {
  const alerts = scan.alerts || [];
  const counts = countByLevel(alerts);

  return {
    alertCount: counts.total,
    criticalCount: counts.CRITICAL,
    warningCount: counts.WARNING,
    infoCount: counts.INFO,
    healthScore: computeHealthScore(alerts),
    freshnessScore: computeFreshnessScore(scan.snapshot || {}, alerts),
    agentMetrics: computeAgentHealthMetrics(scan.snapshot || {}),
    failureFrequency: counts.CRITICAL + counts.WARNING,
    resolutionTimeMs: scan.resolutionTimeMs ?? null,
    scannedAt: scan.completedAt || scan.startedAt,
  };
}

export function buildTrendPoints(scans = [], key = "healthScore") {
  return [...scans]
    .reverse()
    .slice(-12)
    .map((s, i) => ({
      index: i + 1,
      label: s.completedAt
        ? new Date(s.completedAt).toLocaleDateString()
        : `#${i + 1}`,
      value: s.metrics?.[key] ?? computeHealthScore(s.alerts || []),
    }));
}
