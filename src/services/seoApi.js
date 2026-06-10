/**
 * SEO Agent v1 — client API (human approval required for publish).
 */

import {
  createSeoJobInput,
  applyGenerationResult,
  approveSeoJob,
  rejectSeoJob,
  markSeoPublished,
  generateSeoJobContent,
  SEO_PAGE_SPECS,
} from "../agents/seo/index.js";
import {
  createSeoJob,
  updateSeoJob,
  getSeoJob,
  listSeoJobs,
  computeSeoMetrics,
} from "./seoStore.js";
import { fetchGoldenDossier } from "../catalogAcquisition/benchmark/goldenLoader.js";
import { logOpsAudit } from "./opsAuditLog.js";

async function loadCatalogPool(familySlugs = []) {
  const slugs =
    familySlugs.length > 0
      ? familySlugs
      : [
          "tata-nexon-ev",
          "tata-punch-ev",
          "tata-curvv-ev",
          "mahindra-be-6",
          "mahindra-xev-9e",
          "mg-windsor-ev",
          "hyundai-creta-electric",
          "byd-atto-3",
          "mg-zs-ev",
          "citroen-ec3",
        ];

  const vehicles = [];
  for (const slug of slugs) {
    try {
      const dossier = await fetchGoldenDossier(slug);
      if (dossier) vehicles.push(dossier);
    } catch {
      /* skip missing */
    }
  }
  return vehicles;
}

export async function apiCreateSeoJob(input) {
  const parsed = createSeoJobInput(input);
  if (!parsed.ok) return parsed;
  const job = createSeoJob(parsed.job);
  logOpsAudit("seo_job_created", { jobId: job.id, specId: job.specId });
  return { ok: true, data: { job } };
}

export function apiListSeoJobs(opts = {}) {
  return { ok: true, data: { jobs: listSeoJobs(opts) } };
}

export function apiGetSeoJob(id) {
  const job = getSeoJob(id);
  if (!job) return { ok: false, errors: ["Job not found"] };
  return { ok: true, data: { job } };
}

export async function apiGenerateSeoContent(jobId, { familySlugs } = {}) {
  const job = getSeoJob(jobId);
  if (!job) return { ok: false, errors: ["Job not found"] };

  updateSeoJob(jobId, { status: "generating", error: null });

  const vehicles = await loadCatalogPool(familySlugs || []);
  if (!vehicles.length) {
    updateSeoJob(jobId, {
      status: "rejected",
      error: "No catalog vehicles available for generation",
    });
    return { ok: false, errors: ["No catalog vehicles available"] };
  }

  const pipeline = generateSeoJobContent(job, vehicles);
  const applied = applyGenerationResult(job, pipeline, vehicles);

  if (!applied.ok) {
    updateSeoJob(jobId, applied.job || { status: "rejected", error: applied.errors?.[0] });
    return applied;
  }

  const updated = updateSeoJob(jobId, applied.job);
  logOpsAudit("seo_content_generated", {
    jobId,
    specId: job.specId,
    recommendation: applied.job.recommendation?.code,
  });

  return { ok: true, data: { job: updated, reviewDossier: applied.reviewDossier } };
}

export function apiApproveSeoJob(jobId, { approvedBy } = {}) {
  const job = getSeoJob(jobId);
  if (!job) return { ok: false, errors: ["Job not found"] };
  const result = approveSeoJob(job, { approvedBy });
  if (!result.ok) return result;
  const updated = updateSeoJob(jobId, result.job);
  logOpsAudit("seo_job_approved", { jobId, approvedBy });
  return { ok: true, data: { job: updated } };
}

export function apiRejectSeoJob(jobId, { rejectedBy, reason } = {}) {
  const job = getSeoJob(jobId);
  if (!job) return { ok: false, errors: ["Job not found"] };
  const result = rejectSeoJob(job, { rejectedBy, reason });
  const updated = updateSeoJob(jobId, result.job);
  logOpsAudit("seo_job_rejected", { jobId, reason });
  return { ok: true, data: { job: updated } };
}

export function apiPublishSeoJob(jobId, { publishedBy } = {}) {
  const job = getSeoJob(jobId);
  if (!job) return { ok: false, errors: ["Job not found"] };
  const result = markSeoPublished(job, { publishedBy });
  if (!result.ok) return result;
  const updated = updateSeoJob(jobId, result.job);
  logOpsAudit("seo_job_published", { jobId, publishedBy, slug: job.seoPage?.slug });
  return { ok: true, data: { job: updated } };
}

export function apiGetSeoMetrics() {
  return { ok: true, data: computeSeoMetrics() };
}

export function apiListSeoPageSpecs() {
  return { ok: true, data: { specs: SEO_PAGE_SPECS } };
}

export async function apiGenerateAllSeoSpecs({ approvedBy } = {}) {
  const results = [];
  for (const spec of SEO_PAGE_SPECS) {
    const created = await apiCreateSeoJob({ specId: spec.id, label: spec.h1 });
    if (!created.ok) {
      results.push({ specId: spec.id, ok: false, errors: created.errors });
      continue;
    }
    const gen = await apiGenerateSeoContent(created.data.job.id);
    results.push({
      specId: spec.id,
      ok: gen.ok,
      jobId: created.data.job.id,
      recommendation: gen.data?.job?.recommendation?.code,
    });
  }
  return { ok: true, data: { results } };
}
