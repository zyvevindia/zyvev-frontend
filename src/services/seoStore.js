/**
 * Browser persistence for SEO Agent jobs.
 */

const STORAGE_KEY = "evsavari-seo-agent-v1";
const MAX_JOBS = 100;

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
  return `seo_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function createSeoJob(jobInput) {
  const record = {
    id: genId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    approvedAt: null,
    publishedAt: null,
    seoPage: null,
    wrappedContent: null,
    reviewDossier: null,
    recommendation: null,
    missingFields: [],
    regenerationCount: 0,
    error: null,
    ...jobInput,
  };
  const all = loadAll();
  all.unshift(record);
  saveAll(all);
  return record;
}

export function updateSeoJob(id, patch) {
  const all = loadAll();
  const idx = all.findIndex((j) => j.id === id);
  if (idx < 0) return null;
  all[idx] = { ...all[idx], ...patch, updatedAt: new Date().toISOString() };
  saveAll(all);
  return all[idx];
}

export function getSeoJob(id) {
  return loadAll().find((j) => j.id === id) || null;
}

export function listSeoJobs(opts = {}) {
  let list = loadAll();
  if (opts.status) list = list.filter((j) => j.status === opts.status);
  if (opts.specId) list = list.filter((j) => j.specId === opts.specId);
  return list.slice(0, opts.limit ?? MAX_JOBS);
}

export function deleteSeoJob(id) {
  const all = loadAll().filter((j) => j.id !== id);
  saveAll(all);
  return true;
}

export function computeSeoMetrics() {
  const jobs = loadAll();
  const generated = jobs.filter((j) => j.seoPage != null).length;
  const approved = jobs.filter((j) => j.status === "approved" || j.approvedAt).length;
  const published = jobs.filter((j) => j.status === "published").length;
  const rejected = jobs.filter((j) => j.status === "rejected").length;
  const reviewQueue = jobs.filter((j) => j.status === "review_required").length;
  const regenerations = jobs.reduce(
    (sum, j) => sum + (j.regenerationCount || 0),
    0
  );

  return {
    pagesGenerated: generated,
    approvalRatePct:
      generated > 0 ? Math.round((approved / generated) * 1000) / 10 : null,
    publishRatePct:
      approved > 0 ? Math.round((published / approved) * 1000) / 10 : null,
    regenerationCount: regenerations,
    reviewQueue,
    published,
    approved,
    rejected,
    totalJobs: jobs.length,
  };
}
