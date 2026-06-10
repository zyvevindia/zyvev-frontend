/**
 * Change Detection Agent v1 — orchestration with mandatory human approval.
 */

import {
  canHumanApprove,
  canHumanPublish,
  canTransition,
  CHANGE_DETECTION_STATUS,
} from "./changeDetectionStatus.js";
import {
  buildDiffDossier,
  buildLatestSnapshotFromPipeline,
  workflowStatusAfterCheck,
} from "./changeDetectionWorkflow.js";
import {
  compareSnapshots,
  publishedSnapshotFromGolden,
  publishedSnapshotFromExtraction,
} from "./changeDiffEngine.js";
import { aggregateJobPriority } from "./changePriority.js";

export function createMonitorJobInput(input = {}) {
  const familySlug = String(input.familySlug || "").trim();
  if (!familySlug) {
    return { ok: false, errors: ["familySlug is required"] };
  }

  return {
    ok: true,
    job: {
      status: CHANGE_DETECTION_STATUS.DRAFT,
      familySlug,
      label: input.label || familySlug,
      brand: input.brand || null,
      model: input.model || null,
      oemUrl: input.oemUrl || null,
      brochureUrl: input.brochureUrl || null,
      publishedBrochureUrl: input.brochureUrl || null,
      publishedSnapshotAt: input.publishedSnapshotAt || null,
      createdBy: input.createdBy || null,
      scheduleCadence: input.scheduleCadence || "weekly",
    },
  };
}

export function applyStatusTransition(job, nextStatus, patch = {}) {
  if (!job) return { ok: false, errors: ["Job not found"] };
  if (!canTransition(job.status, nextStatus)) {
    return { ok: false, errors: [`Invalid transition ${job.status} → ${nextStatus}`] };
  }
  return {
    ok: true,
    job: { ...job, ...patch, status: nextStatus, updatedAt: new Date().toISOString() },
  };
}

export function setPublishedSnapshot(job, snapshot = {}) {
  return {
    ...job,
    publishedSnapshot: snapshot,
    publishedSnapshotAt: snapshot.capturedAt || new Date().toISOString(),
    publishedOemUrl: snapshot.oemUrl || job.oemUrl,
    publishedBrochureUrl: snapshot.brochureUrl || job.brochureUrl,
  };
}

/**
 * Apply check result after acquisition + comparison.
 */
export function applyCheckResult(job, {
  pipelineResult = {},
  publishedSnapshot = null,
  goldenDossier = null,
} = {}) {
  if (!pipelineResult.ok) {
    const comparison = { changes: [], hasChanges: false, summary: { total: 0 } };
    const dossier = buildDiffDossier(job, comparison, {
      acquisitionOk: false,
      oemUrl: job.oemUrl,
      brochureUrl: job.brochureUrl,
    });
    return {
      ok: true,
      job: {
        ...job,
        status: CHANGE_DETECTION_STATUS.REVIEW_REQUIRED,
        lastCheckedAt: new Date().toISOString(),
        diffDossier: dossier,
        recommendation: dossier.recommendation,
        changeCount: 0,
        priority: null,
        error: pipelineResult.errors?.join("; ") || "Acquisition failed",
      },
      comparison,
      diffDossier: dossier,
    };
  }

  const pipeline = pipelineResult.pipeline || pipelineResult;
  const pub =
    publishedSnapshot ||
    job.publishedSnapshot ||
    (goldenDossier ? publishedSnapshotFromGolden(goldenDossier) : null);

  if (!pub) {
    return { ok: false, errors: ["No published snapshot baseline available"] };
  }

  const latest = buildLatestSnapshotFromPipeline(pipeline, {
    oemUrl: job.oemUrl,
    brochureUrl: job.brochureUrl,
  });

  const latestForCompare = publishedSnapshotFromExtraction(pipeline.extractedVehicle || {}, {
    familySlug: job.familySlug,
    oemUrl: job.oemUrl,
    brochureUrl: job.brochureUrl,
    displayName: job.label,
  });
  latestForCompare.variants = pipeline.extractedVehicle?.variants || pipeline.mergedVariants || [];

  const comparison = compareSnapshots(pub, latestForCompare);

  const nextStatus = workflowStatusAfterCheck(comparison, true);
  const draftJob = {
    ...job,
    lastCheckedAt: new Date().toISOString(),
    changeCount: comparison.changes?.length || 0,
    priority: aggregateJobPriority(comparison.changes || []),
    latestSnapshot: latestForCompare,
  };

  const diffDossier = buildDiffDossier(draftJob, comparison, {
    oemUrl: job.oemUrl,
    brochureUrl: job.brochureUrl,
    evidenceRecordCount: pipeline.evidenceRecords?.length,
    confidenceScore: pipeline.confidenceScore,
    acquisitionOk: true,
    checkedAt: draftJob.lastCheckedAt,
  });

  const finalStatus =
    nextStatus === CHANGE_DETECTION_STATUS.CHANGE_DETECTED
      ? CHANGE_DETECTION_STATUS.REVIEW_REQUIRED
      : nextStatus;

  return {
    ok: true,
    job: {
      ...draftJob,
      status: finalStatus,
      diffDossier,
      recommendation: diffDossier.recommendation,
      publishedSnapshot: pub,
      comparison,
    },
    comparison,
    diffDossier,
  };
}

export function approveChangeJob(job, { approvedBy } = {}) {
  if (!canHumanApprove(job.status)) {
    return { ok: false, errors: [`Cannot approve job in status "${job.status}"`] };
  }
  return applyStatusTransition(job, CHANGE_DETECTION_STATUS.APPROVED, {
    approvedBy: approvedBy || null,
    approvedAt: new Date().toISOString(),
  });
}

export function ignoreChangeJob(job, { ignoredBy, reason } = {}) {
  return applyStatusTransition(job, CHANGE_DETECTION_STATUS.IGNORED, {
    ignoredBy: ignoredBy || null,
    ignoredAt: new Date().toISOString(),
    ignoreReason: reason || null,
  });
}

export function markChangePublished(job, publishResult = {}) {
  if (!canHumanPublish(job.status)) {
    return {
      ok: false,
      errors: [`Cannot publish catalog update in status "${job.status}" — approve first`],
    };
  }
  return applyStatusTransition(job, CHANGE_DETECTION_STATUS.PUBLISHED, {
    publishedAt: new Date().toISOString(),
    publishResult,
    publishedSnapshot: job.latestSnapshot || job.publishedSnapshot,
    publishedSnapshotAt: new Date().toISOString(),
  });
}

export function rebuildDiffDossier(job) {
  if (!job?.comparison && !job?.diffDossier?.comparison) {
    return { ok: false, errors: ["No comparison data on job"] };
  }
  const comparison = job.comparison || job.diffDossier.comparison;
  const diffDossier = buildDiffDossier(job, comparison, {
    oemUrl: job.oemUrl,
    brochureUrl: job.brochureUrl,
    acquisitionOk: !job.error,
  });
  return {
    ok: true,
    job: { ...job, diffDossier, recommendation: diffDossier.recommendation },
    diffDossier,
  };
}
