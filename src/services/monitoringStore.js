/**
 * Browser persistence for Monitoring Agent scans.
 */

const STORAGE_KEY = "evsavari-monitoring-v1";
const SCORE_SNAPSHOT_KEY = "evsavari-monitoring-score-snapshot";
const MAX_SCANS = 50;

function loadScans() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveScans(scans) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(scans.slice(0, MAX_SCANS)));
}

function genId() {
  return `mon_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function createMonitoringScanRecord(scan) {
  const record = {
    id: genId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...scan,
  };
  const all = loadScans();
  all.unshift(record);
  saveScans(all);
  return record;
}

export function updateMonitoringScan(id, patch) {
  const all = loadScans();
  const idx = all.findIndex((s) => s.id === id);
  if (idx < 0) return null;
  all[idx] = { ...all[idx], ...patch, updatedAt: new Date().toISOString() };
  saveScans(all);
  return all[idx];
}

export function getMonitoringScan(id) {
  return loadScans().find((s) => s.id === id) || null;
}

export function listMonitoringScans(opts = {}) {
  let list = loadScans();
  if (opts.status) list = list.filter((s) => s.status === opts.status);
  return list.slice(0, opts.limit ?? MAX_SCANS);
}

export function saveScoreSnapshot(rows) {
  try {
    const raw = localStorage.getItem(SCORE_SNAPSHOT_KEY);
    const existing = raw ? JSON.parse(raw) : { current: [], previous: [] };
    localStorage.setItem(
      SCORE_SNAPSHOT_KEY,
      JSON.stringify({
        current: rows,
        previous: existing.current || [],
        lastGeneratedAt: new Date().toISOString(),
      })
    );
  } catch {
    /* ignore */
  }
}

export function loadScoreSnapshots() {
  try {
    const raw = localStorage.getItem(SCORE_SNAPSHOT_KEY);
    return raw ? JSON.parse(raw) : { current: [], previous: [] };
  } catch {
    return { current: [], previous: [] };
  }
}

export function computeMonitoringStoreMetrics() {
  const scans = loadScans();
  const latest = scans[0];
  const resolved = scans.filter((s) =>
    (s.alerts || []).some((a) => a.resolvedAt)
  );

  return {
    totalScans: scans.length,
    latestScanAt: latest?.completedAt || latest?.startedAt || null,
    latestHealthScore: latest?.metrics?.healthScore ?? null,
    latestFreshnessScore: latest?.metrics?.freshnessScore ?? null,
    totalAlerts: latest?.metrics?.alertCount ?? 0,
    resolutionCount: resolved.length,
  };
}
