/**
 * Vehicle Creation Agent v1 — orchestrates onboarding with mandatory human approval.
 * Does not auto-publish. Uses Catalog Acquisition v7.1 via serverless API.
 */

import { IMPORT_STATUS, IMPORT_SOURCE_TYPE } from "../../catalogAcquisition/constants.js";
import {
  canHumanApprove,
  canHumanPublish,
  canTransition,
  VEHICLE_CREATION_STATUS,
} from "./vehicleCreationStatus.js";
import {
  buildEvidencePacket,
  buildReviewDossier,
  workflowCompleteStatus,
} from "./vehicleCreationWorkflow.js";
import { resolveGoldenId } from "./vehicleCreationBenchmark.js";

/**
 * @typedef {object} VehicleCreationJob
 * @property {string} id
 * @property {string} status
 * @property {string} oemUrl
 * @property {string|null} brochureUrl
 * @property {string[]} referenceUrls
 * @property {object|null} evidencePacket
 * @property {object|null} reviewDossier
 * @property {string|null} catalogImportId
 */

export function createJobInput(input = {}) {
  const oemUrl = String(input.oemUrl || "").trim();
  const brochureUrl = String(input.brochureUrl || "").trim() || null;
  const referenceUrls = (input.referenceUrls || []).map((u) => String(u).trim()).filter(Boolean);

  if (!oemUrl && !brochureUrl && !input.pdfFile) {
    return { ok: false, errors: ["OEM URL or brochure URL/PDF is required"] };
  }

  return {
    ok: true,
    job: {
      status: VEHICLE_CREATION_STATUS.DRAFT,
      oemUrl,
      brochureUrl,
      referenceUrls,
      familySlug: input.familySlug || null,
      createdBy: input.createdBy || null,
      label: input.label || oemUrl || brochureUrl || "New EV",
    },
  };
}

export function applyStatusTransition(job, nextStatus, patch = {}) {
  if (!job) return { ok: false, errors: ["Job not found"] };
  if (!canTransition(job.status, nextStatus)) {
    return {
      ok: false,
      errors: [`Invalid transition ${job.status} → ${nextStatus}`],
    };
  }
  return {
    ok: true,
    job: {
      ...job,
      ...patch,
      status: nextStatus,
      updatedAt: new Date().toISOString(),
    },
  };
}

/**
 * Map v7 pipeline response to job patch after acquisition + extraction.
 */
export function applyPipelineResult(job, pipelineResult = {}, catalogImportId = null) {
  if (!pipelineResult.ok) {
    return applyStatusTransition(job, VEHICLE_CREATION_STATUS.REJECTED, {
      error: pipelineResult.errors?.join("; ") || "Pipeline failed",
      diagnostics: pipelineResult.diagnostics || null,
    });
  }

  const pipeline = pipelineResult.pipeline || pipelineResult;
  const goldenId = resolveGoldenId(job, { extractedVehicle: pipeline.extractedVehicle, familySlug: job.familySlug });
  const evidencePacket = buildEvidencePacket(pipeline, {
    importId: catalogImportId,
    oemUrl: job.oemUrl,
    brochureUrl: job.brochureUrl,
    familySlug: goldenId || job.familySlug,
    goldenId,
  });

  const nextStatus = workflowCompleteStatus(true);
  const draftJob = {
    ...job,
    status: nextStatus,
    catalogImportId,
    evidencePacket,
    confidenceScore: evidencePacket.confidenceScore,
    variantCount: evidencePacket.variantCount,
    diagnostics: pipeline.diagnostics || null,
    updatedAt: new Date().toISOString(),
  };

  const reviewDossier = buildReviewDossier(draftJob, evidencePacket, {
    attentionOnly: true,
    goldenDossier: pipelineResult.goldenDossier || null,
  });

  return {
    ok: true,
    job: {
      ...draftJob,
      reviewDossier,
      recommendation: reviewDossier.recommendation,
    },
    evidencePacket,
    reviewDossier,
  };
}

export function approveJob(job, { approvedBy } = {}) {
  if (!canHumanApprove(job.status)) {
    return {
      ok: false,
      errors: [`Cannot approve job in status "${job.status}"`],
    };
  }
  return applyStatusTransition(job, VEHICLE_CREATION_STATUS.APPROVED, {
    approvedBy: approvedBy || null,
    approvedAt: new Date().toISOString(),
  });
}

export function rejectJob(job, { rejectedBy, reason } = {}) {
  if (job.status === VEHICLE_CREATION_STATUS.PUBLISHED) {
    return { ok: false, errors: ["Published jobs cannot be rejected"] };
  }
  return applyStatusTransition(job, VEHICLE_CREATION_STATUS.REJECTED, {
    rejectedBy: rejectedBy || null,
    rejectedAt: new Date().toISOString(),
    rejectionReason: reason || null,
  });
}

export function markPublished(job, publishResult = {}) {
  if (!canHumanPublish(job.status)) {
    return {
      ok: false,
      errors: [`Cannot publish job in status "${job.status}" — approve first`],
    };
  }
  return applyStatusTransition(job, VEHICLE_CREATION_STATUS.PUBLISHED, {
    publishedAt: new Date().toISOString(),
    publishResult,
  });
}

/**
 * Build catalog import draft payload linked to a vehicle creation job.
 */
export function buildCatalogImportDraft(job) {
  return {
    status: IMPORT_STATUS.DRAFT,
    sourceType: job.brochureUrl ? IMPORT_SOURCE_TYPE.PDF_BROCHURE : IMPORT_SOURCE_TYPE.OEM_URL,
    sourceUrl: job.oemUrl || job.brochureUrl,
    sourceInputs: {
      oemUrl: job.oemUrl,
      brochureUrl: job.brochureUrl,
      referenceUrls: job.referenceUrls || [],
      engine: "vehicle-creation-v1.1",
      vehicleCreationJobId: job.id,
    },
    createdBy: job.createdBy,
    diagnostics: { agent: "vehicle-creation-v1.1", jobId: job.id },
  };
}

/**
 * Patch catalog import after v7 pipeline completes.
 */
export function buildCatalogImportPatch(pipeline, catalogImportId) {
  const p = pipeline.pipeline || pipeline;
  return {
    status: p.status || IMPORT_STATUS.REVIEW_REQUIRED,
    sourceInputs: {
      ...(p.diagnostics || {}),
      engine: "v7.1-vehicle-creation",
      catalogImportId,
    },
    evidenceSummary: p.mergedFields,
    extractedVehicle: p.extractedVehicle,
    reviewedVehicle: p.reviewedVehicle,
    confidenceScore: p.confidenceScore,
    diagnostics: p.diagnostics,
  };
}

export function rebuildDossier(job, { attentionOnly = true, goldenDossier = null } = {}) {
  if (!job?.evidencePacket) {
    return { ok: false, errors: ["No evidence packet on job"] };
  }
  const reviewDossier = buildReviewDossier(job, job.evidencePacket, {
    attentionOnly,
    goldenDossier: goldenDossier || job.goldenDossier || null,
  });
  return {
    ok: true,
    job: { ...job, reviewDossier, recommendation: reviewDossier.recommendation },
    reviewDossier,
  };
}
