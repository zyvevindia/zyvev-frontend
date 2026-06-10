/**
 * Analytics Agent v1 — read-only client API (insights only, human approval).
 */

import {
  runAnalyticsReport,
  approveAnalyticsReport,
  rejectAnalyticsReport,
  buildAnalyticsScoreRecords,
} from "../agents/analytics/index.js";
import {
  createAnalyticsReportRecord,
  updateAnalyticsReport,
  getAnalyticsReport,
  listAnalyticsReports,
  computeAnalyticsStoreMetrics,
} from "./analyticsStore.js";
import { listSeoJobs } from "./seoStore.js";
import { listVehicleCreationJobs } from "./vehicleCreationStore.js";
import { listChangeDetectionJobs } from "./changeDetectionStore.js";
import { listMonitoringScans } from "./monitoringStore.js";
import { listAuditRuns } from "./auditStore.js";
import { listExecutionLogs } from "../agents/orchestrator/agentExecutionLog.js";
import { logOpsAudit } from "./opsAuditLog.js";
import { fetchGoldenDossier } from "../catalogAcquisition/benchmark/goldenLoader.js";

const DEFAULT_GOLDEN_SLUGS = [
  "tata-nexon-ev",
  "tata-punch-ev",
  "tata-curvv-ev",
  "mahindra-be-6",
  "mahindra-xev-9e",
  "mg-windsor-ev",
  "hyundai-creta-electric",
  "byd-atto-3",
];

async function fetchRegistry() {
  try {
    const res = await fetch("/catalog/source-registry.json");
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

async function loadGoldenVehicles(slugs = DEFAULT_GOLDEN_SLUGS) {
  const vehicles = [];
  for (const slug of slugs) {
    try {
      const d = await fetchGoldenDossier(slug);
      if (d) vehicles.push(d);
    } catch {
      /* skip */
    }
  }
  return vehicles;
}

function deriveFreshness(seoJobs, vcJobs, cdJobs) {
  const seoDates = seoJobs.map((j) => j.updatedAt).filter(Boolean);
  const vcDates = vcJobs.map((j) => j.updatedAt).filter(Boolean);
  const cdDates = cdJobs.map((j) => j.lastCheckedAt || j.updatedAt).filter(Boolean);
  const maxDate = (dates) =>
    dates.length ? dates.sort().reverse()[0] : null;

  return {
    lastSeoGenerationAt: maxDate(seoDates),
    lastAcquisitionAt: maxDate([...vcDates, ...cdDates]),
    lastCatalogUpdate: maxDate([...seoDates, ...vcDates, ...cdDates]),
    lastScoreGenerationAt: new Date().toISOString(),
  };
}

async function buildAnalyticsSnapshot(options = {}) {
  const registry = options.registry ?? (await fetchRegistry());
  const seoJobs = options.seoJobs ?? listSeoJobs();
  const vehicleCreationJobs =
    options.vehicleCreationJobs ?? listVehicleCreationJobs();
  const changeDetectionJobs =
    options.changeDetectionJobs ?? listChangeDetectionJobs();
  const orchestratorExecutions =
    options.orchestratorExecutions ?? listExecutionLogs({ limit: 100 });
  const monitoringScans =
    options.monitoringScans ?? listMonitoringScans({ limit: 10 });
  const auditRuns = options.auditRuns ?? listAuditRuns({ limit: 10 });
  const vehicles =
    options.vehicles ?? (await loadGoldenVehicles(options.goldenSlugs));
  const scoreRecords =
    options.scoreRecords ?? buildAnalyticsScoreRecords(vehicles);
  const previousReports = listAnalyticsReports({ limit: 5 });
  const previousSnapshot = options.previousSnapshot ?? {
    vehicleCount: previousReports[0]?.snapshot?.vehicles?.length ?? vehicles.length,
    scoreRecords: previousReports[0]?.snapshot?.scoreRecords ?? [],
  };

  return {
    registry,
    seoJobs,
    vehicleCreationJobs,
    changeDetectionJobs,
    orchestratorExecutions,
    monitoringScans,
    auditRuns,
    vehicles,
    scoreRecords,
    scoreSnapshots: options.scoreSnapshots ?? { categoryRankShifts: [] },
    previousSnapshot,
    freshness: options.freshness ?? deriveFreshness(seoJobs, vehicleCreationJobs, changeDetectionJobs),
    now: new Date().toISOString(),
  };
}

export async function apiRunAnalyticsReport(options = {}) {
  const snapshot = await buildAnalyticsSnapshot(options);
  const result = runAnalyticsReport(snapshot);

  if (!result.ok) {
    return result;
  }

  const record = createAnalyticsReportRecord(result.report);
  logOpsAudit("analytics_report_completed", {
    reportId: record.id,
    insightCount: record.metrics?.insightCount,
    recommendation: record.recommendation?.code,
  });

  return { ok: true, data: { report: record } };
}

export function apiListAnalyticsReports(opts = {}) {
  return { ok: true, data: { reports: listAnalyticsReports(opts) } };
}

export function apiGetAnalyticsReport(id) {
  const report = getAnalyticsReport(id);
  if (!report) return { ok: false, errors: ["Report not found"] };
  return { ok: true, data: { report } };
}

export function apiApproveAnalyticsReport(id, { approvedBy, note } = {}) {
  const report = getAnalyticsReport(id);
  if (!report) return { ok: false, errors: ["Report not found"] };
  const result = approveAnalyticsReport(report, { approvedBy, note });
  if (!result.ok) return result;
  const updated = updateAnalyticsReport(id, result.report);
  logOpsAudit("analytics_report_approved", { reportId: id, approvedBy });
  return { ok: true, data: { report: updated } };
}

export function apiRejectAnalyticsReport(id, { rejectedBy, reason } = {}) {
  const report = getAnalyticsReport(id);
  if (!report) return { ok: false, errors: ["Report not found"] };
  const result = rejectAnalyticsReport(report, { rejectedBy, reason });
  const updated = updateAnalyticsReport(id, result.report);
  return { ok: true, data: { report: updated } };
}

export function apiGetAnalyticsDashboard() {
  const reports = listAnalyticsReports({ limit: 20 });
  const latest = reports[0];
  const storeMetrics = computeAnalyticsStoreMetrics();

  return {
    ok: true,
    data: {
      latestReport: latest,
      reports,
      storeMetrics,
      healthTrend: reports.slice(0, 10).map((r, i) => ({
        index: i,
        platformHealthScore: r.metrics?.platformHealthScore ?? 0,
        growthScore: r.metrics?.growthScore ?? 0,
        trustScore: r.metrics?.trustScore ?? 0,
        insightCount: r.metrics?.insightCount ?? 0,
        at: r.completedAt,
      })),
    },
  };
}

export { buildAnalyticsSnapshot };
