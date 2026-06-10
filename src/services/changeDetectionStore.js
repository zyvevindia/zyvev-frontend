/**
 * Browser persistence for Change Detection Agent jobs.
 */

const STORAGE_KEY = "evsavari-change-detection-v1";
const MAX_JOBS = 50;

function loadAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveAll(jobs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs.slice(0, MAX_JOBS)));
}

function genId() {
  return `cd_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function createChangeDetectionJob(jobInput) {
  const record = {
    id: genId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastCheckedAt: null,
    approvedAt: null,
    publishedAt: null,
    changeCount: 0,
    priority: null,
    publishedSnapshot: null,
    latestSnapshot: null,
    diffDossier: null,
    recommendation: null,
    comparison: null,
    error: null,
    ...jobInput,
  };
  const all = loadAll();
  all.unshift(record);
  saveAll(all);
  return record;
}

export function updateChangeDetectionJob(id, patch) {
  const all = loadAll();
  const idx = all.findIndex((j) => j.id === id);
  if (idx < 0) return null;
  all[idx] = { ...all[idx], ...patch, updatedAt: new Date().toISOString() };
  saveAll(all);
  return all[idx];
}

export function getChangeDetectionJob(id) {
  return loadAll().find((j) => j.id === id) || null;
}

export function listChangeDetectionJobs(opts = {}) {
  let list = loadAll();
  if (opts.status) list = list.filter((j) => j.status === opts.status);
  if (opts.familySlug) list = list.filter((j) => j.familySlug === opts.familySlug);
  return list.slice(0, opts.limit ?? MAX_JOBS);
}

export function getMonitorJobByFamilySlug(familySlug) {
  return loadAll().find((j) => j.familySlug === familySlug) || null;
}
