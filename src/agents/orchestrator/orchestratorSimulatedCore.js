/**
 * Shared simulation helpers — no Node fs imports (browser + Node safe).
 */
import { scoreVehicle } from "../../scoring/index.js";
import { createJobInput, applyPipelineResult } from "../vehicleCreation/vehicleCreationAgent.js";
import {
  createMonitorJobInput,
  setPublishedSnapshot,
  applyCheckResult,
} from "../changeDetection/changeDetectionAgent.js";
import { publishedSnapshotFromGolden } from "../changeDetection/changeDiffEngine.js";

export function buildSimulatedPipeline(golden, mutation = null) {
  if (!golden?.fields) {
    return {
      ok: true,
      pipeline: {
        status: "review_required",
        extractedVehicle: {},
        mergedFields: {},
        confidenceScore: 0.5,
        diagnostics: { simulated: true },
      },
    };
  }

  const fields = { ...golden.fields, ...(mutation || {}) };
  return {
    ok: true,
    pipeline: {
      status: "review_required",
      extractedVehicle: {
        ...golden.vehicle,
        ...fields,
        variants: golden.variants || [],
      },
      mergedFields: fields,
      reviewedVehicle: { ...golden.vehicle, ...fields },
      confidenceScore: 0.92,
      diagnostics: { simulated: true, source: "orchestrator-simulation" },
      evidenceRecords: [],
    },
    goldenDossier: golden,
  };
}

export async function runScoreEngineWithDossier(dossier) {
  if (!dossier) {
    return { ok: false, errors: ["No dossier for scoring"] };
  }
  const scored = scoreVehicle(dossier);
  return {
    ok: true,
    data: {
      scored,
      familySlug: dossier.familySlug || dossier.id,
    },
  };
}

export async function runVehicleCreationWithGolden(golden, input = {}) {
  const parsed = createJobInput({
    oemUrl: input.oemUrl || "https://example.com/ev",
    brochureUrl: input.brochureUrl || null,
    familySlug: input.familySlug || golden?.familySlug,
    label: input.label || "Orchestrator simulation",
  });
  if (!parsed.ok) return parsed;

  try {
    const pipelineResult =
      input.pipelineResult ||
      buildSimulatedPipeline(golden, input.mutation);

    const applied = applyPipelineResult(parsed.job, pipelineResult);
    if (!applied.ok) return applied;

    return {
      ok: true,
      data: {
        job: applied.job,
        reviewDossier: applied.job.reviewDossier,
      },
      linkedJobId: applied.job.id,
    };
  } catch {
    return {
      ok: true,
      data: {
        job: {
          ...parsed.job,
          status: "review_required",
          recommendation: "REVIEW_REQUIRED",
          reviewDossier: {
            recommendation: "REVIEW_REQUIRED",
            simulatedFallback: true,
            summary: "Simulated dossier — orchestrator fallback when full dossier build unavailable.",
          },
        },
      },
    };
  }
}

export async function runChangeDetectionWithGolden(golden, input = {}) {
  if (input.simulateNoChange) {
    const parsed = createMonitorJobInput({
      familySlug: input.familySlug || golden?.familySlug,
      label: input.label || "Orchestrator no-change simulation",
    });
    if (!parsed.ok) return parsed;
    return {
      ok: true,
      data: {
        job: {
          ...parsed.job,
          status: "monitoring",
          recommendation: "NO_CHANGE",
          changeCount: 0,
          diffDossier: { recommendation: "NO_CHANGE", changes: [] },
        },
      },
    };
  }

  const parsed = createMonitorJobInput({
    familySlug: input.familySlug || golden?.familySlug,
    label: input.label || "Orchestrator simulation",
  });
  if (!parsed.ok) return parsed;
  if (!golden) {
    return { ok: false, errors: ["Golden dossier required for simulation"] };
  }

  const job = setPublishedSnapshot(
    parsed.job,
    publishedSnapshotFromGolden(golden)
  );

  const pipelineResult =
    input.pipelineResult ||
    buildSimulatedPipeline(
      golden,
      input.mutation || {
        startingPrice: (golden.fields?.startingPrice || 0) + 50000,
      }
    );

  const check = applyCheckResult(job, {
    pipelineResult,
    publishedSnapshot: job.publishedSnapshot,
    goldenDossier: golden,
  });

  if (!check.ok) return check;

  return {
    ok: true,
    data: { job: check.job, diffDossier: check.job.diffDossier },
    linkedJobId: check.job.id,
  };
}

export async function simulatedExecutor(log) {
  return {
    ok: true,
    data: {
      simulated: true,
      agentId: log.agentId,
      message: "Approved action recorded — no autonomous publish performed.",
      linkedJobId: log.linkedJobId,
    },
  };
}
