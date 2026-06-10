/**
 * Change Detection Agent v1 — client API (human approval required).
 */

import { fetchGoldenDossier } from "../catalogAcquisition/benchmark/goldenLoader.js";
import { publishedSnapshotFromGolden } from "../agents/changeDetection/changeDiffEngine.js";
import {
  applyCheckResult,
  applyStatusTransition,
  approveChangeJob,
  createMonitorJobInput,
  ignoreChangeJob,
  markChangePublished,
  setPublishedSnapshot,
} from "../agents/changeDetection/changeDetectionAgent.js";
import { CHANGE_DETECTION_STATUS } from "../agents/changeDetection/changeDetectionStatus.js";
import {
  createChangeDetectionJob,
  getChangeDetectionJob,
  listChangeDetectionJobs,
  updateChangeDetectionJob,
} from "./changeDetectionStore.js";
import { logOpsAudit } from "./opsAuditLog.js";

async function fileToBase64(file) {
  const buffer = await file.arrayBuffer();
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

async function loadGoldenForFamily(familySlug) {
  if (!familySlug) return null;
  try {
    return await fetchGoldenDossier(familySlug);
  } catch {
    return null;
  }
}

export async function apiRunV7AcquisitionForChangeDetection({
  importId,
  oemUrl,
  brochureUrl,
  referenceUrls = [],
  familySlug = null,
}) {
  const apiBase = typeof window !== "undefined" ? window.location.origin : "";
  const res = await fetch(`${apiBase}/api/catalog-v7-acquire`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      importId,
      oemUrl,
      brochureUrl,
      referenceUrls,
      familySlug,
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body.ok) {
    return { ok: false, errors: body.errors || [`Acquisition failed (${res.status})`] };
  }
  return { ok: true, pipeline: body.pipeline };
}

export async function apiCreateChangeDetectionJob(input) {
  const parsed = createMonitorJobInput(input);
  if (!parsed.ok) return parsed;

  let golden = null;
  try {
    golden = await loadGoldenForFamily(parsed.job.familySlug);
  } catch {
    /* optional */
  }

  const job = createChangeDetectionJob(
    golden
      ? setPublishedSnapshot(parsed.job, publishedSnapshotFromGolden(golden))
      : parsed.job
  );

  return { ok: true, data: job };
}

export async function apiListChangeDetectionJobs(opts = {}) {
  return { ok: true, data: listChangeDetectionJobs(opts) };
}

export async function apiGetChangeDetectionJob(id) {
  const job = getChangeDetectionJob(id);
  return job ? { ok: true, data: job } : { ok: false, errors: ["Job not found"] };
}

/**
 * Manual or scheduled check: acquire latest → compare → diff dossier.
 */
export async function apiRunChangeDetectionCheck(jobId) {
  let job = getChangeDetectionJob(jobId);
  if (!job) return { ok: false, errors: ["Job not found"] };

  let tr = applyStatusTransition(job, CHANGE_DETECTION_STATUS.MONITORING);
  if (!tr.ok && job.status !== CHANGE_DETECTION_STATUS.MONITORING) {
    tr = { ok: true, job };
  } else if (tr.ok) {
    job = updateChangeDetectionJob(jobId, tr.job);
  }

  const golden = await loadGoldenForFamily(job.familySlug);
  const publishedSnapshot =
    job.publishedSnapshot || (golden ? publishedSnapshotFromGolden(golden) : null);

  const pipelineResult = await apiRunV7AcquisitionForChangeDetection({
    importId: `cd-check-${jobId}`,
    oemUrl: job.oemUrl,
    brochureUrl: job.brochureUrl,
    referenceUrls: job.referenceUrls || [],
    familySlug: job.familySlug,
  });

  const applied = applyCheckResult(job, {
    pipelineResult,
    publishedSnapshot,
    goldenDossier: golden,
  });

  if (!applied.ok) return applied;

  const saved = updateChangeDetectionJob(jobId, applied.job);

  logOpsAudit({
    action: "change_detection_check",
    entityType: "change_detection_job",
    entityId: jobId,
    meta: {
      familySlug: job.familySlug,
      changeCount: saved.changeCount,
      recommendation: saved.recommendation?.code,
      priority: saved.priority,
    },
  });

  return { ok: true, data: saved, comparison: applied.comparison };
}

export async function apiApproveChangeDetection(jobId, { approvedBy } = {}) {
  const job = getChangeDetectionJob(jobId);
  if (!job) return { ok: false, errors: ["Job not found"] };

  const result = approveChangeJob(job, { approvedBy });
  if (!result.ok) return result;

  const saved = updateChangeDetectionJob(jobId, result.job);
  logOpsAudit({
    action: "change_detection_approve",
    entityType: "change_detection_job",
    entityId: jobId,
    meta: { approvedBy, familySlug: job.familySlug },
  });
  return { ok: true, data: saved };
}

export async function apiIgnoreChangeDetection(jobId, { ignoredBy, reason } = {}) {
  const job = getChangeDetectionJob(jobId);
  if (!job) return { ok: false, errors: ["Job not found"] };

  const result = ignoreChangeJob(job, { ignoredBy, reason });
  if (!result.ok) return result;

  return { ok: true, data: updateChangeDetectionJob(jobId, result.job) };
}

/**
 * Apply approved changes to catalog baseline — human must approve first.
 * Does not auto-publish to live API; updates local published snapshot only.
 */
export async function apiPublishChangeDetection(jobId, { publishedBy } = {}) {
  const job = getChangeDetectionJob(jobId);
  if (!job) return { ok: false, errors: ["Job not found"] };

  if (job.status !== CHANGE_DETECTION_STATUS.APPROVED) {
    return {
      ok: false,
      errors: ["Human approval required before catalog update"],
    };
  }

  const published = markChangePublished(job, {
    publishedBy,
    familySlug: job.familySlug,
    changeCount: job.changeCount,
  });
  if (!published.ok) return published;

  const saved = updateChangeDetectionJob(jobId, {
    ...published.job,
    publishedSnapshot: job.latestSnapshot || job.publishedSnapshot,
    status: CHANGE_DETECTION_STATUS.PUBLISHED,
  });

  logOpsAudit({
    action: "change_detection_publish",
    entityType: "change_detection_job",
    entityId: jobId,
    meta: { publishedBy, familySlug: job.familySlug },
  });

  return { ok: true, data: saved };
}

export async function apiSeedMonitorsFromRegistry(registryEntries = []) {
  const created = [];
  for (const entry of registryEntries) {
    const existing = listChangeDetectionJobs({ familySlug: entry.familySlug });
    if (existing.length) continue;
    const r = await apiCreateChangeDetectionJob({
      familySlug: entry.familySlug,
      label: `${entry.brand} ${entry.model}`,
      brand: entry.brand,
      model: entry.model,
      oemUrl: entry.officialUrl,
      brochureUrl: entry.brochureUrl,
    });
    if (r.ok) created.push(r.data);
  }
  return { ok: true, data: created, count: created.length };
}
