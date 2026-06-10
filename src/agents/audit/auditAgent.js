/**
 * Audit Agent v1 — validate integrity, recommend only (no auto-fix).
 */
import { AUDIT_STATUS } from "./auditStatus.js";
import { runAuditWorkflow } from "./auditWorkflow.js";
import { sortFindings, resetFindingCounter } from "./auditFindings.js";
import { buildAuditRecommendation } from "./auditRecommendation.js";
import { computeAuditMetrics } from "./auditMetrics.js";
import { scoreVehicle } from "../../scoring/index.js";

export function createAuditRunInput(input = {}) {
  return {
    ok: true,
    run: {
      status: AUDIT_STATUS.IDLE,
      label: input.label || "Platform integrity audit",
      createdBy: input.createdBy || null,
    },
  };
}

/**
 * Build score audit records from vehicle dossiers.
 * @param {object[]} vehicles
 * @returns {object[]}
 */
export function buildScoreAuditRecords(vehicles = []) {
  const generatedAt = new Date().toISOString();
  const records = (vehicles || []).map((v) => {
    const scored = scoreVehicle(v);
    const slug = v.familySlug || v.id || v.fields?.familySlug;
    return {
      familySlug: slug,
      displayName: v.displayName || v.fields?.model,
      overallScore: scored.overall?.score ?? null,
      grade: scored.overall?.grade ?? null,
      breakdown: scored.breakdown || {},
      generatedAt,
    };
  });

  const ranked = [...records]
    .filter((r) => r.overallScore != null)
    .sort((a, b) => b.overallScore - a.overallScore);

  return records.map((r) => {
    const rankPosition = ranked.findIndex((x) => x.familySlug === r.familySlug);
    return {
      ...r,
      rankPosition: rankPosition >= 0 ? rankPosition + 1 : null,
    };
  });
}

/**
 * Run full audit on provided snapshot.
 * @param {object} snapshot
 */
export function runAuditScan(snapshot = {}, options = {}) {
  resetFindingCounter();

  const startedAt = new Date().toISOString();
  const normalized = {
    ...snapshot,
    now: snapshot.now ? new Date(snapshot.now) : new Date(),
    scoreRecords:
      snapshot.scoreRecords ||
      buildScoreAuditRecords(snapshot.vehicles || []),
  };

  try {
    const { findings: rawFindings } = runAuditWorkflow(normalized);
    const findings = sortFindings(rawFindings);
    const recommendation = buildAuditRecommendation(findings);
    const completedAt = new Date().toISOString();

    const run = {
      status:
        recommendation.code === "NO_ACTION"
          ? AUDIT_STATUS.COMPLETED
          : AUDIT_STATUS.WAITING_FOR_REVIEW,
      startedAt,
      completedAt,
      durationMs: new Date(completedAt).getTime() - new Date(startedAt).getTime(),
      snapshot: normalized,
      findings,
      recommendation,
      autonomousActionsTaken: 0,
    };

    run.metrics = computeAuditMetrics(run, options.priorRuns || []);

    return { ok: true, run };
  } catch (err) {
    return {
      ok: false,
      errors: [err?.message || String(err)],
      run: {
        status: AUDIT_STATUS.FAILED,
        startedAt,
        error: err?.message,
      },
    };
  }
}

export function approveAuditRun(run, { approvedBy, note } = {}) {
  if (run.status !== AUDIT_STATUS.WAITING_FOR_REVIEW) {
    return {
      ok: false,
      errors: [`Cannot approve audit in status: ${run.status}`],
    };
  }
  return {
    ok: true,
    run: {
      ...run,
      status: AUDIT_STATUS.APPROVED,
      approvedAt: new Date().toISOString(),
      approvedBy: approvedBy || "human-reviewer",
      approvalNote: note || null,
    },
  };
}

export function rejectAuditRun(run, { rejectedBy, reason } = {}) {
  return {
    ok: true,
    run: {
      ...run,
      status: AUDIT_STATUS.REJECTED,
      rejectedAt: new Date().toISOString(),
      rejectedBy: rejectedBy || "human-reviewer",
      rejectionReason: reason || "Rejected by reviewer",
    },
  };
}

export function resolveFinding(run, findingId, { resolvedBy, note } = {}) {
  const findings = (run.findings || []).map((f) =>
    f.id === findingId
      ? {
          ...f,
          resolvedAt: new Date().toISOString(),
          resolvedBy: resolvedBy || "human-reviewer",
          resolutionNote: note || null,
        }
      : f
  );
  return {
    ...run,
    findings,
    resolutionTimeMs:
      run.startedAt && findings.find((f) => f.id === findingId)?.resolvedAt
        ? new Date(findings.find((f) => f.id === findingId).resolvedAt).getTime() -
          new Date(run.startedAt).getTime()
        : run.resolutionTimeMs,
  };
}

export { AUDIT_STATUS };
