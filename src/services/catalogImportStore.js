/**
 * Browser localStorage fallback when Supabase catalog_imports is unavailable.
 */

const STORAGE_KEY = "evsavari-catalog-imports-v1";
const EVIDENCE_KEY = "evsavari-catalog-evidence-v2";
const MAX_RECORDS = 30;

function loadAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveAll(records) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records.slice(0, MAX_RECORDS)));
}

function genId() {
  return `local_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function localCreateImport(input) {
  const record = {
    id: genId(),
    status: input.status || "draft",
    sourceType: input.sourceType,
    sourceUrl: input.sourceUrl || null,
    sourceFile: input.sourceFile || {},
    rawContent: input.rawContent || null,
    rawContentHash: input.rawContentHash || null,
    extractedVehicle: input.extractedVehicle || {},
    reviewedVehicle: input.reviewedVehicle || {},
    confidenceScore: input.confidenceScore ?? null,
    publishResult: input.publishResult || {},
    diagnostics: { ...input.diagnostics, storage: "localStorage" },
    sourceInputs: input.sourceInputs || {},
    evidenceSummary: input.evidenceSummary || {},
    createdBy: input.createdBy || null,
    approvedBy: null,
    approvedAt: null,
    publishedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const all = loadAll();
  all.unshift(record);
  saveAll(all);
  return record;
}

export function localUpdateImport(id, patch) {
  const all = loadAll();
  const idx = all.findIndex((r) => r.id === id);
  if (idx < 0) return null;
  all[idx] = { ...all[idx], ...patch, updatedAt: new Date().toISOString() };
  saveAll(all);
  return all[idx];
}

export function localGetImport(id) {
  return loadAll().find((r) => r.id === id) || null;
}

export function localListImports(opts = {}) {
  let list = loadAll();
  if (opts.status) list = list.filter((r) => r.status === opts.status);
  return list.slice(0, opts.limit ?? 50);
}

export function isLocalImportId(id) {
  return String(id).startsWith("local_");
}

function loadEvidenceAll() {
  try {
    const raw = localStorage.getItem(EVIDENCE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveEvidenceAll(map) {
  localStorage.setItem(EVIDENCE_KEY, JSON.stringify(map));
}

export function localReplaceEvidenceRecords(importId, records = []) {
  const map = loadEvidenceAll();
  map[importId] = records.map((r, i) => ({
    ...r,
    id: r.id || `local_ev_${importId}_${i}`,
    importId,
    createdAt: r.createdAt || new Date().toISOString(),
  }));
  saveEvidenceAll(map);
  return map[importId];
}

export function localListEvidenceRecords(importId) {
  return loadEvidenceAll()[importId] || [];
}
