/**
 * Browser persistence for Vehicle Creation Agent jobs.
 */

const STORAGE_KEY = "evsavari-vehicle-creation-v1";
const MAX_JOBS = 25;

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
  return `vc_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function createVehicleCreationJob(jobInput) {
  const record = {
    id: genId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    publishedAt: null,
    approvedAt: null,
    approvedBy: null,
    rejectedBy: null,
    catalogImportId: null,
    evidencePacket: null,
    reviewDossier: null,
    recommendation: null,
    error: null,
    diagnostics: null,
    publishResult: null,
    ...jobInput,
  };
  const all = loadAll();
  all.unshift(record);
  saveAll(all);
  return record;
}

export function updateVehicleCreationJob(id, patch) {
  const all = loadAll();
  const idx = all.findIndex((j) => j.id === id);
  if (idx < 0) return null;
  all[idx] = { ...all[idx], ...patch, updatedAt: new Date().toISOString() };
  saveAll(all);
  return all[idx];
}

export function getVehicleCreationJob(id) {
  return loadAll().find((j) => j.id === id) || null;
}

export function listVehicleCreationJobs(opts = {}) {
  let list = loadAll();
  if (opts.status) list = list.filter((j) => j.status === opts.status);
  return list.slice(0, opts.limit ?? MAX_JOBS);
}

export function deleteVehicleCreationJob(id) {
  const all = loadAll().filter((j) => j.id !== id);
  saveAll(all);
  return true;
}
