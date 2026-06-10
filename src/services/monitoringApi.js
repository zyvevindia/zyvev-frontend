/**
 * Monitoring Agent v1 — client API (observe only, human approval for actions).
 */

import {
  runMonitoringScan,
  approveMonitoringScan,
  rejectMonitoringScan,
  resolveAlert,
  buildScoreSnapshot,
} from "../agents/monitoring/index.js";
import {
  createMonitoringScanRecord,
  updateMonitoringScan,
  getMonitoringScan,
  listMonitoringScans,
  saveScoreSnapshot,
  loadScoreSnapshots,
  computeMonitoringStoreMetrics,
} from "./monitoringStore.js";
import { listSeoJobs } from "./seoStore.js";
import { listVehicleCreationJobs } from "./vehicleCreationStore.js";
import { listChangeDetectionJobs } from "./changeDetectionStore.js";
import { listExecutionLogs } from "../agents/orchestrator/agentExecutionLog.js";
import { logOpsAudit } from "./opsAuditLog.js";
import { fetchGoldenDossier } from "../catalogAcquisition/benchmark/goldenLoader.js";
import { scoreVehicle } from "../scoring/index.js";

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

async function fetchContentManifest() {
  try {
    const res = await fetch("/seo-data/content-manifest.json");
    if (!res.ok) return { entries: [] };
    return await res.json();
  } catch {
    return { entries: [] };
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

function deriveFreshness(seoJobs, vcJobs, cdJobs, scoreSnapshots) {
  const seoDates = seoJobs.map((j) => j.updatedAt).filter(Boolean);
  const vcDates = vcJobs.map((j) => j.updatedAt).filter(Boolean);
  const cdDates = cdJobs.map((j) => j.lastCheckedAt || j.updatedAt).filter(Boolean);

  const maxDate = (dates) =>
    dates.length ? dates.sort().reverse()[0] : null;

  return {
    lastSeoGenerationAt: maxDate(seoDates),
    lastAcquisitionAt: maxDate([...vcDates, ...cdDates]),
    lastCatalogUpdate: maxDate([...seoDates, ...vcDates, ...cdDates]),
    lastScoreGenerationAt: scoreSnapshots.lastGeneratedAt || null,
  };
}

function compareCategoryRanks(currentScores, previousScores) {
  const shifts = [];
  const categories = ["family", "city", "highway", "value"];

  for (const cat of categories) {
    const currRanked = [...currentScores]
      .filter((s) => s.categoryScores?.[cat] != null)
      .sort((a, b) => b.categoryScores[cat] - a.categoryScores[cat]);
    const prevRanked = [...previousScores]
      .filter((s) => s.categoryScores?.[cat] != null)
      .sort((a, b) => b.categoryScores[cat] - a.categoryScores[cat]);

    for (const row of currRanked) {
      const prevIdx = prevRanked.findIndex(
        (p) => p.familySlug === row.familySlug
      );
      const currIdx = currRanked.findIndex(
        (c) => c.familySlug === row.familySlug
      );
      if (prevIdx >= 0 && currIdx >= 0) {
        const rankDelta = Math.abs(prevIdx - currIdx);
        if (rankDelta >= 2) {
          shifts.push({
            category: cat,
            familySlug: row.familySlug,
            rankDelta,
            previousRank: prevIdx + 1,
            currentRank: currIdx + 1,
          });
        }
      }
    }
  }
  return shifts;
}

async function buildPlatformSnapshot(options = {}) {
  const registry = options.registry ?? (await fetchRegistry());
  const seoJobs = options.seoJobs ?? listSeoJobs();
  const vehicleCreationJobs =
    options.vehicleCreationJobs ?? listVehicleCreationJobs();
  const changeDetectionJobs =
    options.changeDetectionJobs ?? listChangeDetectionJobs();
  const orchestratorExecutions =
    options.orchestratorExecutions ?? listExecutionLogs({ limit: 100 });
  const contentManifest =
    options.contentManifest ?? (await fetchContentManifest());

  const vehicles =
    options.vehicles ?? (await loadGoldenVehicles(options.goldenSlugs));
  const scoreRows = buildScoreSnapshot(vehicles);
  const stored = loadScoreSnapshots();
  saveScoreSnapshot(scoreRows);

  const enrichedScores = scoreRows.map((row) => {
    const v = vehicles.find(
      (x) => (x.familySlug || x.id) === row.familySlug
    );
    const scored = v ? scoreVehicle(v) : null;
    return {
      ...row,
      categoryScores: scored?.breakdown
        ? Object.fromEntries(
            Object.entries(scored.breakdown).map(([k, val]) => [
              k,
              val?.score ?? null,
            ])
          )
        : {},
    };
  });

  const categoryRankShifts = compareCategoryRanks(
    enrichedScores,
    stored.previous || []
  );

  const freshness = deriveFreshness(
    seoJobs,
    vehicleCreationJobs,
    changeDetectionJobs,
    { lastGeneratedAt: new Date().toISOString(), ...stored }
  );

  return {
    registry,
    seoJobs,
    vehicleCreationJobs,
    changeDetectionJobs,
    orchestratorExecutions,
    contentManifest,
    oemProbeResults: options.oemProbeResults || [],
    scoreSnapshots: {
      current: enrichedScores,
      previous: stored.previous || [],
      lastGeneratedAt: new Date().toISOString(),
      categoryRankShifts,
    },
    freshness,
    now: new Date().toISOString(),
  };
}

export async function apiRunMonitoringScan(options = {}) {
  const snapshot = await buildPlatformSnapshot(options);
  const result = runMonitoringScan(snapshot);

  if (!result.ok) {
    return result;
  }

  const record = createMonitoringScanRecord(result.scan);
  logOpsAudit("monitoring_scan_completed", {
    scanId: record.id,
    alertCount: record.metrics?.alertCount,
    recommendation: record.recommendation?.code,
  });

  return { ok: true, data: { scan: record } };
}

export function apiListMonitoringScans(opts = {}) {
  return { ok: true, data: { scans: listMonitoringScans(opts) } };
}

export function apiGetMonitoringScan(id) {
  const scan = getMonitoringScan(id);
  if (!scan) return { ok: false, errors: ["Scan not found"] };
  return { ok: true, data: { scan } };
}

export function apiApproveMonitoringScan(id, { approvedBy, note } = {}) {
  const scan = getMonitoringScan(id);
  if (!scan) return { ok: false, errors: ["Scan not found"] };
  const result = approveMonitoringScan(scan, { approvedBy, note });
  if (!result.ok) return result;
  const updated = updateMonitoringScan(id, result.scan);
  logOpsAudit("monitoring_scan_approved", { scanId: id, approvedBy });
  return { ok: true, data: { scan: updated } };
}

export function apiRejectMonitoringScan(id, { rejectedBy, reason } = {}) {
  const scan = getMonitoringScan(id);
  if (!scan) return { ok: false, errors: ["Scan not found"] };
  const result = rejectMonitoringScan(scan, { rejectedBy, reason });
  const updated = updateMonitoringScan(id, result.scan);
  return { ok: true, data: { scan: updated } };
}

export function apiResolveMonitoringAlert(scanId, alertId, options = {}) {
  const scan = getMonitoringScan(scanId);
  if (!scan) return { ok: false, errors: ["Scan not found"] };
  const updated = resolveAlert(scan, alertId, options);
  const record = updateMonitoringScan(scanId, updated);
  return { ok: true, data: { scan: record } };
}

export function apiGetMonitoringDashboard() {
  const scans = listMonitoringScans({ limit: 20 });
  const latest = scans[0];
  const storeMetrics = computeMonitoringStoreMetrics();

  return {
    ok: true,
    data: {
      latestScan: latest,
      scans,
      storeMetrics,
      healthTrend: scans.slice(0, 10).map((s, i) => ({
        index: i,
        healthScore: s.metrics?.healthScore ?? 0,
        freshnessScore: s.metrics?.freshnessScore ?? 0,
        alertCount: s.metrics?.alertCount ?? 0,
        at: s.completedAt,
      })),
    },
  };
}

export { buildPlatformSnapshot };
