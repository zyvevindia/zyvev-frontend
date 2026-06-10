/**
 * Browser persistence for Analytics Agent reports.
 */

const STORAGE_KEY = "evsavari-analytics-v1";
const MAX_REPORTS = 50;

function loadReports() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveReports(reports) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reports.slice(0, MAX_REPORTS)));
}

function genId() {
  return `analytics_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function createAnalyticsReportRecord(report) {
  const record = {
    id: genId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...report,
  };
  const all = loadReports();
  all.unshift(record);
  saveReports(all);
  return record;
}

export function updateAnalyticsReport(id, patch) {
  const all = loadReports();
  const idx = all.findIndex((r) => r.id === id);
  if (idx < 0) return null;
  all[idx] = { ...all[idx], ...patch, updatedAt: new Date().toISOString() };
  saveReports(all);
  return all[idx];
}

export function getAnalyticsReport(id) {
  return loadReports().find((r) => r.id === id) || null;
}

export function listAnalyticsReports(opts = {}) {
  let list = loadReports();
  if (opts.status) list = list.filter((r) => r.status === opts.status);
  return list.slice(0, opts.limit ?? MAX_REPORTS);
}

export function computeAnalyticsStoreMetrics() {
  const reports = loadReports();
  const latest = reports[0];

  return {
    totalReports: reports.length,
    latestReportAt: latest?.completedAt || latest?.startedAt || null,
    latestPlatformHealth: latest?.metrics?.platformHealthScore ?? null,
    latestTrustScore: latest?.metrics?.trustScore ?? null,
    latestGrowthScore: latest?.metrics?.growthScore ?? null,
    totalInsights: latest?.metrics?.insightCount ?? 0,
  };
}
