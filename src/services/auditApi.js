/**
 * Audit Agent v1 — client API (findings only, human approval for actions).
 */

import {
  runAuditScan,
  approveAuditRun,
  rejectAuditRun,
  resolveFinding,
  buildScoreAuditRecords,
} from "../agents/audit/index.js";
import {
  createAuditRunRecord,
  updateAuditRun,
  getAuditRun,
  listAuditRuns,
  computeAuditStoreMetrics,
} from "./auditStore.js";
import { listSeoJobs } from "./seoStore.js";
import { listVehicleCreationJobs } from "./vehicleCreationStore.js";
import { listChangeDetectionJobs } from "./changeDetectionStore.js";
import { listMonitoringScans } from "./monitoringStore.js";
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

async function buildAuditSnapshot(options = {}) {
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
  const vehicles =
    options.vehicles ?? (await loadGoldenVehicles(options.goldenSlugs));
  const scoreRecords =
    options.scoreRecords ?? buildScoreAuditRecords(vehicles);

  return {
    registry,
    seoJobs,
    vehicleCreationJobs,
    changeDetectionJobs,
    orchestratorExecutions,
    monitoringScans,
    vehicles,
    scoreRecords,
    now: new Date().toISOString(),
  };
}

export async function apiRunAuditScan(options = {}) {
  const snapshot = await buildAuditSnapshot(options);
  const priorRuns = listAuditRuns({ limit: 20 });
  const result = runAuditScan(snapshot, { priorRuns });

  if (!result.ok) {
    return result;
  }

  const record = createAuditRunRecord(result.run);
  logOpsAudit("audit_scan_completed", {
    runId: record.id,
    findingCount: record.metrics?.findingCount,
    recommendation: record.recommendation?.code,
  });

  return { ok: true, data: { run: record } };
}

export function apiListAuditRuns(opts = {}) {
  return { ok: true, data: { runs: listAuditRuns(opts) } };
}

export function apiGetAuditRun(id) {
  const run = getAuditRun(id);
  if (!run) return { ok: false, errors: ["Audit run not found"] };
  return { ok: true, data: { run } };
}

export function apiApproveAuditRun(id, { approvedBy, note } = {}) {
  const run = getAuditRun(id);
  if (!run) return { ok: false, errors: ["Audit run not found"] };
  const result = approveAuditRun(run, { approvedBy, note });
  if (!result.ok) return result;
  const updated = updateAuditRun(id, result.run);
  logOpsAudit("audit_scan_approved", { runId: id, approvedBy });
  return { ok: true, data: { run: updated } };
}

export function apiRejectAuditRun(id, { rejectedBy, reason } = {}) {
  const run = getAuditRun(id);
  if (!run) return { ok: false, errors: ["Audit run not found"] };
  const result = rejectAuditRun(run, { rejectedBy, reason });
  const updated = updateAuditRun(id, result.run);
  return { ok: true, data: { run: updated } };
}

export function apiResolveAuditFinding(runId, findingId, options = {}) {
  const run = getAuditRun(runId);
  if (!run) return { ok: false, errors: ["Audit run not found"] };
  const updated = resolveFinding(run, findingId, options);
  const record = updateAuditRun(runId, updated);
  return { ok: true, data: { run: record } };
}

export function apiGetAuditDashboard() {
  const runs = listAuditRuns({ limit: 20 });
  const latest = runs[0];
  const storeMetrics = computeAuditStoreMetrics();

  return {
    ok: true,
    data: {
      latestRun: latest,
      runs,
      storeMetrics,
      auditTrend: runs.slice(0, 10).map((r, i) => ({
        index: i,
        auditScore: r.metrics?.auditScore ?? 0,
        trustScore: r.metrics?.trustScore ?? 0,
        findingCount: r.metrics?.findingCount ?? 0,
        at: r.completedAt,
      })),
    },
  };
}

export { buildAuditSnapshot };
