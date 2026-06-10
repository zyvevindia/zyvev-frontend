/**
 * Vehicle Creation Agent v1 — client API (human approval required for publish).
 */

import {
  hashContent,
  buildSourceSnapshot,
  SNAPSHOT_TYPE,
} from "../catalogAcquisition/index.js";
import { updateCatalogImport, insertCatalogImportSnapshot, replaceEvidenceRecords } from "../backend/index.js";
import {
  apiApproveImport,
  apiCreateImportDraft,
  apiGetImport,
  apiPublishImport,
  apiUpdateReviewedVehicle,
} from "./catalogImportApi.js";
import {
  isLocalImportId,
  localReplaceEvidenceRecords,
  localUpdateImport,
} from "./catalogImportStore.js";
import {
  applyPipelineResult,
  applyStatusTransition,
  approveJob,
  buildCatalogImportDraft,
  createJobInput,
  markPublished,
  rebuildDossier,
  rejectJob,
} from "../agents/vehicleCreation/vehicleCreationAgent.js";
import { VEHICLE_CREATION_STATUS } from "../agents/vehicleCreation/vehicleCreationStatus.js";
import {
  createVehicleCreationJob,
  getVehicleCreationJob,
  listVehicleCreationJobs,
  updateVehicleCreationJob,
} from "./vehicleCreationStore.js";
import { logOpsAudit, AUDIT_ACTIONS } from "./opsAuditLog.js";
import { fetchGoldenDossier } from "../catalogAcquisition/benchmark/goldenLoader.js";
import { resolveGoldenId } from "../agents/vehicleCreation/vehicleCreationBenchmark.js";

async function loadGoldenDossierForJob(job, pipeline = {}) {
  const goldenId =
    resolveGoldenId(job, {
      familySlug: job.familySlug,
      extractedVehicle: pipeline.extractedVehicle,
    }) || job.familySlug;
  if (!goldenId) return null;
  try {
    return await fetchGoldenDossier(goldenId);
  } catch {
    return null;
  }
}

async function fileToBase64(file) {
  const buffer = await file.arrayBuffer();
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

async function persistCatalogImportFromV7(importId, pipeline, job) {
  const useLocal = isLocalImportId(importId);
  if (useLocal) {
    localReplaceEvidenceRecords(importId, pipeline.evidenceRecords || []);
  } else if (pipeline.evidenceRecords?.length) {
    await replaceEvidenceRecords(importId, pipeline.evidenceRecords);
  }

  const patch = {
    status: pipeline.status || "review_required",
    sourceInputs: {
      oemUrl: job.oemUrl,
      brochureUrl: job.brochureUrl,
      referenceUrls: job.referenceUrls || [],
      engine: "v7.1-vehicle-creation",
      vehicleCreationJobId: job.id,
    },
    evidenceSummary: pipeline.mergedFields,
    extractedVehicle: pipeline.extractedVehicle,
    reviewedVehicle: pipeline.reviewedVehicle,
    confidenceScore: pipeline.confidenceScore,
    diagnostics: pipeline.diagnostics,
  };

  if (useLocal) {
    return { ok: true, data: localUpdateImport(importId, patch) };
  }

  const updated = await updateCatalogImport(importId, patch);
  if (!updated.ok) {
    return { ok: false, errors: [updated.error?.message || "Failed to update catalog import"] };
  }

  const contentHash = await hashContent(
    JSON.stringify({
      oemUrl: job.oemUrl,
      brochureUrl: job.brochureUrl,
      engine: "v7.1",
    })
  );

  if (!useLocal) {
    await insertCatalogImportSnapshot(
      buildSourceSnapshot(importId, SNAPSHOT_TYPE.EXTRACTED, {
        engine: "v7.1-vehicle-creation",
        variantCount: pipeline.variantCount,
        conflictFields: pipeline.conflictFields,
        attentionFields: pipeline.attentionFields,
      }, contentHash)
    );
  }

  return { ok: true, data: updated.data };
}

/**
 * Run Catalog Acquisition v7.1 via serverless / dev middleware.
 */
export async function apiRunV7Acquisition({
  importId,
  oemUrl,
  brochureUrl,
  referenceUrls = [],
  pdfFile = null,
  familySlug = null,
}) {
  let pdfBase64 = null;
  let pdfName = null;
  if (pdfFile) {
    pdfBase64 = await fileToBase64(pdfFile);
    pdfName = pdfFile.name;
  }

  const apiBase = typeof window !== "undefined" ? window.location.origin : "";
  const res = await fetch(`${apiBase}/api/catalog-v7-acquire`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      importId,
      oemUrl: oemUrl || null,
      brochureUrl: brochureUrl || null,
      referenceUrls,
      pdfBase64,
      pdfName,
      familySlug,
    }),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body.ok) {
    return {
      ok: false,
      errors: body.errors || [`v7 acquisition failed (${res.status})`],
    };
  }
  return { ok: true, pipeline: body.pipeline };
}

export async function apiCreateVehicleCreationJob(input) {
  const parsed = createJobInput(input);
  if (!parsed.ok) return parsed;
  const job = createVehicleCreationJob(parsed.job);
  return { ok: true, data: job };
}

export async function apiListVehicleCreationJobs(opts = {}) {
  return { ok: true, data: listVehicleCreationJobs(opts) };
}

export async function apiGetVehicleCreationJob(id) {
  const job = getVehicleCreationJob(id);
  return job ? { ok: true, data: job } : { ok: false, errors: ["Job not found"] };
}

/**
 * Full workflow: draft → acquiring → extracting → review_required.
 */
export async function apiRunVehicleCreationWorkflow(jobId, { pdfFile = null } = {}) {
  let job = getVehicleCreationJob(jobId);
  if (!job) return { ok: false, errors: ["Job not found"] };

  let tr = applyStatusTransition(job, VEHICLE_CREATION_STATUS.ACQUIRING);
  if (!tr.ok) return tr;
  job = updateVehicleCreationJob(jobId, tr.job);

  const importDraft = buildCatalogImportDraft(job);
  const draft = await apiCreateImportDraft({
    sourceType: importDraft.sourceType,
    sourceUrl: importDraft.sourceUrl,
    sourceInputs: importDraft.sourceInputs,
    createdBy: importDraft.createdBy,
  });
  if (!draft.ok) {
    updateVehicleCreationJob(jobId, {
      status: VEHICLE_CREATION_STATUS.REJECTED,
      error: draft.errors?.join("; "),
    });
    return draft;
  }

  const catalogImportId = draft.data.id;
  job = updateVehicleCreationJob(jobId, { catalogImportId });

  tr = applyStatusTransition(job, VEHICLE_CREATION_STATUS.EXTRACTING);
  if (!tr.ok) return tr;
  job = updateVehicleCreationJob(jobId, tr.job);

  const pipelineResult = await apiRunV7Acquisition({
    importId: catalogImportId,
    oemUrl: job.oemUrl,
    brochureUrl: job.brochureUrl,
    referenceUrls: job.referenceUrls,
    pdfFile,
    familySlug: job.familySlug,
  });

  if (!pipelineResult.ok) {
    updateVehicleCreationJob(jobId, {
      status: VEHICLE_CREATION_STATUS.REJECTED,
      error: pipelineResult.errors?.join("; "),
    });
    return pipelineResult;
  }

  const goldenDossier = await loadGoldenDossierForJob(job, pipelineResult.pipeline);
  const applied = applyPipelineResult(
    job,
    { ...pipelineResult, goldenDossier },
    catalogImportId
  );
  if (!applied.ok) {
    updateVehicleCreationJob(jobId, applied.job || { status: VEHICLE_CREATION_STATUS.REJECTED });
    return applied;
  }

  await persistCatalogImportFromV7(catalogImportId, pipelineResult.pipeline, applied.job);

  const saved = updateVehicleCreationJob(jobId, {
    ...applied.job,
    goldenDossierId: goldenDossier?.id || job.familySlug || null,
  });

  logOpsAudit({
    action: AUDIT_ACTIONS.CATALOG_INGESTION_QUEUED,
    entityType: "vehicle_creation_job",
    entityId: jobId,
    meta: {
      status: saved.status,
      recommendation: saved.recommendation?.code,
      variantCount: saved.variantCount,
      estimatedReviewMinutes: saved.reviewDossier?.metrics?.reviewTimeMinutes,
      estimatedTotalEffortMinutes: saved.reviewDossier?.metrics?.totalEffortMinutes,
      publishProbability: saved.reviewDossier?.metrics?.publishProbability,
    },
  });

  return { ok: true, data: saved, pipeline: pipelineResult.pipeline };
}

export async function apiApproveVehicleCreation(jobId, { approvedBy } = {}) {
  const job = getVehicleCreationJob(jobId);
  if (!job) return { ok: false, errors: ["Job not found"] };

  const result = approveJob(job, { approvedBy });
  if (!result.ok) return result;

  const saved = updateVehicleCreationJob(jobId, result.job);

  if (job.catalogImportId) {
    await apiApproveImport(job.catalogImportId, approvedBy);
  }

  logOpsAudit({
    action: "vehicle_creation_approve",
    entityType: "vehicle_creation_job",
    entityId: jobId,
    meta: { approvedBy },
  });

  return { ok: true, data: saved };
}

export async function apiRejectVehicleCreation(jobId, { rejectedBy, reason } = {}) {
  const job = getVehicleCreationJob(jobId);
  if (!job) return { ok: false, errors: ["Job not found"] };

  const result = rejectJob(job, { rejectedBy, reason });
  if (!result.ok) return result;

  return { ok: true, data: updateVehicleCreationJob(jobId, result.job) };
}

/**
 * Publish only after explicit human approval — never autonomous.
 */
export async function apiPublishVehicleCreation(jobId, { publishedBy, goldenDossier = null } = {}) {
  const job = getVehicleCreationJob(jobId);
  if (!job) return { ok: false, errors: ["Job not found"] };

  if (job.status !== VEHICLE_CREATION_STATUS.APPROVED) {
    return {
      ok: false,
      errors: ["Human approval required before publish. Approve the review dossier first."],
    };
  }

  if (!job.catalogImportId) {
    return { ok: false, errors: ["Missing linked catalog import"] };
  }

  const importRecord = await apiGetImport(job.catalogImportId);
  if (!importRecord.ok) return importRecord;

  if (importRecord.data.status !== "approved") {
    return { ok: false, errors: ["Catalog import not approved"] };
  }

  const publish = await apiPublishImport(job.catalogImportId, { goldenDossier });
  if (!publish.ok) return publish;

  const published = markPublished(job, publish.publish);
  if (!published.ok) return published;

  const saved = updateVehicleCreationJob(jobId, published.job);

  logOpsAudit({
    action: "vehicle_creation_publish",
    entityType: "vehicle_creation_job",
    entityId: jobId,
    meta: { publishedBy, vehicleId: publish.publish?.vehicle?.id },
  });

  return { ok: true, data: saved, publish: publish.publish };
}

export async function apiRefreshVehicleCreationDossier(jobId, { attentionOnly = true } = {}) {
  const job = getVehicleCreationJob(jobId);
  if (!job) return { ok: false, errors: ["Job not found"] };
  let goldenDossier = null;
  if (job.goldenDossierId || job.familySlug) {
    goldenDossier = await loadGoldenDossierForJob(job, job.evidencePacket || {});
  }
  const rebuilt = rebuildDossier(job, { attentionOnly, goldenDossier });
  if (!rebuilt.ok) return rebuilt;
  return { ok: true, data: updateVehicleCreationJob(jobId, rebuilt.job) };
}

export async function apiUpdateVehicleCreationReview(jobId, reviewedVehicle) {
  const job = getVehicleCreationJob(jobId);
  if (!job) return { ok: false, errors: ["Job not found"] };

  if (job.catalogImportId) {
    await apiUpdateReviewedVehicle(job.catalogImportId, reviewedVehicle);
  }

  const evidencePacket = {
    ...(job.evidencePacket || {}),
    reviewedVehicle,
  };
  const draftJob = { ...job, evidencePacket };
  const reviewDossier = rebuildDossier(draftJob, { attentionOnly: true });

  return {
    ok: true,
    data: updateVehicleCreationJob(jobId, {
      evidencePacket,
      reviewDossier: reviewDossier.ok ? reviewDossier.reviewDossier : job.reviewDossier,
      recommendation: reviewDossier.ok
        ? reviewDossier.reviewDossier.recommendation
        : job.recommendation,
    }),
  };
}
