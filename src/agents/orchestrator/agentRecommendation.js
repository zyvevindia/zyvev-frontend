import { AGENT_IDS } from "./agentRegistry.js";

export const RECOMMENDATION_KIND = Object.freeze({
  PROCEED: "PROCEED",
  REVIEW_REQUIRED: "REVIEW_REQUIRED",
  NO_ACTION: "NO_ACTION",
  BLOCKED: "BLOCKED",
});

/**
 * Normalize agent-specific output into orchestrator recommendation.
 * @param {string} agentId
 * @param {object} result agent run result
 * @returns {object}
 */
export function buildRecommendation(agentId, result) {
  if (!result?.ok) {
    return {
      kind: RECOMMENDATION_KIND.BLOCKED,
      code: "FAILED",
      label: "Run failed",
      summary: result?.errors?.[0] || "Agent execution failed.",
      approvalRequired: false,
    };
  }

  switch (agentId) {
    case AGENT_IDS.VEHICLE_CREATION:
      return buildVehicleCreationRecommendation(result);
    case AGENT_IDS.CHANGE_DETECTION:
      return buildChangeDetectionRecommendation(result);
    case AGENT_IDS.SCORE_ENGINE:
      return buildScoreEngineRecommendation(result);
    default:
      return {
        kind: RECOMMENDATION_KIND.REVIEW_REQUIRED,
        code: "UNKNOWN",
        label: "Review required",
        summary: "Unknown agent output — human review required.",
        approvalRequired: true,
      };
  }
}

function buildVehicleCreationRecommendation(result) {
  const rec =
    result.data?.job?.recommendation ||
    result.data?.reviewDossier?.recommendation ||
    result.output?.recommendation ||
    "REVIEW_REQUIRED";

  const map = {
    READY: {
      kind: RECOMMENDATION_KIND.PROCEED,
      label: "Ready to approve",
      summary: "Dossier passed quality gates — human approval required before publish.",
    },
    REVIEW_REQUIRED: {
      kind: RECOMMENDATION_KIND.REVIEW_REQUIRED,
      label: "Human review required",
      summary: "Review dossier corrections and benchmark deltas before approval.",
    },
    BLOCKED: {
      kind: RECOMMENDATION_KIND.BLOCKED,
      label: "Blocked",
      summary: "Fix acquisition or evidence issues before approval.",
    },
  };

  const row = map[rec] || map.REVIEW_REQUIRED;
  return {
    ...row,
    code: rec,
    approvalRequired: true,
  };
}

function buildChangeDetectionRecommendation(result) {
  const rec =
    result.data?.job?.recommendation ||
    result.output?.recommendation ||
    "REVIEW_REQUIRED";

  const map = {
    NO_CHANGE: {
      kind: RECOMMENDATION_KIND.NO_ACTION,
      label: "No change detected",
      summary: "Baseline matches latest acquisition — no human action needed.",
    },
    REVIEW_REQUIRED: {
      kind: RECOMMENDATION_KIND.REVIEW_REQUIRED,
      label: "Changes detected",
      summary: "Diff dossier ready — human must approve before baseline update.",
    },
    BLOCKED: {
      kind: RECOMMENDATION_KIND.BLOCKED,
      label: "Blocked",
      summary: "Change detection blocked — resolve errors before retry.",
    },
  };

  const row = map[rec] || map.REVIEW_REQUIRED;
  return {
    ...row,
    code: rec,
    approvalRequired: rec !== "NO_CHANGE",
  };
}

function buildScoreEngineRecommendation(result) {
  const scored = result.data?.scored || result.output?.scored;
  const score = scored?.overall?.score;
  const grade = scored?.overall?.grade;

  return {
    kind: RECOMMENDATION_KIND.PROCEED,
    code: "SCORED",
    label: grade ? `Scored ${score}/100 (${grade})` : "Scored",
    summary: scored?.hasData
      ? `Deterministic score generated${score != null ? `: ${score}/100` : ""}.`
      : "Insufficient data for full score breakdown.",
    approvalRequired: false,
  };
}

export function requiresHumanApproval(agentId, recommendation) {
  if (recommendation?.approvalRequired === false) return false;
  const blocked = recommendation?.kind === RECOMMENDATION_KIND.NO_ACTION;
  if (blocked && agentId === AGENT_IDS.CHANGE_DETECTION) return false;
  if (agentId === AGENT_IDS.SCORE_ENGINE) return false;
  return (
    recommendation?.kind === RECOMMENDATION_KIND.REVIEW_REQUIRED ||
    recommendation?.kind === RECOMMENDATION_KIND.PROCEED ||
    recommendation?.approvalRequired === true
  );
}
