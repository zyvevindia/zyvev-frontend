/**
 * Browser persistence for Audit Agent runs.
 */

const STORAGE_KEY = "evsavari-audit-v1";
const MAX_RUNS = 50;

function loadRuns() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRuns(runs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(runs.slice(0, MAX_RUNS)));
}

function genId() {
  return `audit_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function createAuditRunRecord(run) {
  const record = {
    id: genId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...run,
  };
  const all = loadRuns();
  all.unshift(record);
  saveRuns(all);
  return record;
}

export function updateAuditRun(id, patch) {
  const all = loadRuns();
  const idx = all.findIndex((r) => r.id === id);
  if (idx < 0) return null;
  all[idx] = { ...all[idx], ...patch, updatedAt: new Date().toISOString() };
  saveRuns(all);
  return all[idx];
}

export function getAuditRun(id) {
  return loadRuns().find((r) => r.id === id) || null;
}

export function listAuditRuns(opts = {}) {
  let list = loadRuns();
  if (opts.status) list = list.filter((r) => r.status === opts.status);
  return list.slice(0, opts.limit ?? MAX_RUNS);
}

export function computeAuditStoreMetrics() {
  const runs = loadRuns();
  const latest = runs[0];
  const resolved = runs.filter(
    (r) => r.status === "approved" || r.status === "rejected"
  );

  return {
    totalRuns: runs.length,
    latestRunAt: latest?.completedAt || latest?.startedAt || null,
    latestAuditScore: latest?.metrics?.auditScore ?? null,
    latestTrustScore: latest?.metrics?.trustScore ?? null,
    totalFindings: latest?.metrics?.findingCount ?? 0,
    resolutionCount: resolved.length,
    resolutionRatePct:
      runs.length > 0
        ? Math.round((resolved.length / runs.length) * 1000) / 10
        : null,
  };
}
