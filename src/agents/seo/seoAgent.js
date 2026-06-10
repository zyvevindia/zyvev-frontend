/**
 * SEO Agent v1 — pure agent logic (human approval required for publish).
 */
import {
  SEO_STATUS,
  canTransition,
  canHumanApprove,
  canHumanPublish,
} from "./seoStatus.js";
import { getPageSpec } from "./seoTemplates.js";
import { runGenerationPipeline } from "./seoWorkflow.js";
import { buildSeoRecommendation } from "./seoRecommendation.js";
import { validateContentCompleteness } from "./seoContentGenerator.js";

export function createSeoJobInput(input = {}) {
  const specId = input.specId || input.pageSpecId;
  const spec = getPageSpec(specId);

  if (!spec && !input.customSpec) {
    return { ok: false, errors: [`Unknown page spec: ${specId}`] };
  }

  return {
    ok: true,
    job: {
      status: SEO_STATUS.DRAFT,
      specId: spec?.id || input.customSpec?.id || "custom",
      pageSpec: spec || input.customSpec,
      label: input.label || spec?.h1 || "SEO page draft",
      createdBy: input.createdBy || null,
      regenerationCount: 0,
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

export function applyGenerationResult(job, pipelineResult, vehicles = []) {
  if (!pipelineResult?.ok) {
    return {
      ok: false,
      errors: pipelineResult.errors || ["Generation failed"],
      job: {
        ...job,
        status: SEO_STATUS.REJECTED,
        error: pipelineResult.errors?.join("; ") || "Generation failed",
      },
    };
  }

  const reviewDossier = buildReviewDossier(job, pipelineResult);

  return {
    ok: true,
    job: {
      ...job,
      status: SEO_STATUS.REVIEW_REQUIRED,
      seoPage: pipelineResult.seoPage,
      wrappedContent: pipelineResult.wrappedContent,
      missingFields: pipelineResult.missingFields,
      recommendation: pipelineResult.recommendation,
      reviewDossier,
      candidatePoolSize: pipelineResult.candidatePoolSize,
      regenerationCount: (job.regenerationCount || 0) + 1,
      updatedAt: new Date().toISOString(),
      error: null,
    },
    reviewDossier,
  };
}

export function generateSeoJobContent(job, vehicles = []) {
  const spec = job.pageSpec || getPageSpec(job.specId);
  if (!spec) {
    return { ok: false, errors: ["Page spec missing on job"] };
  }
  return runGenerationPipeline(spec, vehicles);
}

export function approveSeoJob(job, { approvedBy } = {}) {
  if (!canHumanApprove(job.status)) {
    return {
      ok: false,
      errors: [`Cannot approve job in status: ${job.status}`],
    };
  }
  return {
    ok: true,
    job: {
      ...job,
      status: SEO_STATUS.APPROVED,
      approvedAt: new Date().toISOString(),
      approvedBy: approvedBy || "human-reviewer",
    },
  };
}

export function rejectSeoJob(job, { rejectedBy, reason } = {}) {
  return {
    ok: true,
    job: {
      ...job,
      status: SEO_STATUS.REJECTED,
      rejectedAt: new Date().toISOString(),
      rejectedBy: rejectedBy || "human-reviewer",
      rejectionReason: reason || "Rejected by reviewer",
    },
  };
}

export function markSeoPublished(job, { publishedBy } = {}) {
  if (!canHumanPublish(job.status)) {
    return {
      ok: false,
      errors: [`Cannot publish job in status: ${job.status}. Approve first.`],
    };
  }
  return {
    ok: true,
    job: {
      ...job,
      status: SEO_STATUS.PUBLISHED,
      publishedAt: new Date().toISOString(),
      publishedBy: publishedBy || job.approvedBy || "human-reviewer",
    },
  };
}

function buildReviewDossier(job, pipelineResult) {
  const seoPage = pipelineResult.seoPage;
  const missing = validateContentCompleteness(seoPage);

  return {
    version: 1,
    specId: job.specId,
    title: seoPage.title,
    slug: seoPage.slug,
    canonicalUrl: seoPage.canonicalUrl,
    rankedCount: seoPage.rankedVehicles?.length ?? 0,
    missingFields: missing,
    recommendation: pipelineResult.recommendation,
    sections: [
      {
        id: "metadata",
        label: "Metadata",
        items: [
          { label: "Title", value: seoPage.title },
          { label: "Description", value: seoPage.metaDescription },
          { label: "Keywords", value: (seoPage.keywords || []).join(", ") },
        ],
      },
      {
        id: "rankings",
        label: "Ranked vehicles",
        items: (seoPage.rankedVehicles || []).map((v) => ({
          label: `#${v.rank} ${v.displayName}`,
          value: v.explanation,
        })),
      },
    ],
    governance: seoPage.governance,
  };
}

export { canHumanApprove, canHumanPublish };
