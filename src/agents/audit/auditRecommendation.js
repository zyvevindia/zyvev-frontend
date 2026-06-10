/**
 * Audit Agent v1 — platform recommendation from findings.
 */
import { AUDIT_RECOMMENDATION, FINDING_SEVERITY } from "./auditStatus.js";
import { countBySeverity } from "./auditFindings.js";

export function buildAuditRecommendation(findings = []) {
  const counts = countBySeverity(findings);

  if (counts.CRITICAL > 0) {
    return {
      code: AUDIT_RECOMMENDATION.BLOCKED,
      label: "Blocked — critical integrity issues",
      summary: `${counts.CRITICAL} critical finding(s) require human review before platform actions.`,
      findingCounts: counts,
    };
  }

  if (counts.WARNING > 0) {
    return {
      code: AUDIT_RECOMMENDATION.REVIEW_REQUIRED,
      label: "Review required",
      summary: `${counts.WARNING} warning(s) detected — human should review findings. No autonomous corrections.`,
      findingCounts: counts,
    };
  }

  if (counts.INFO > 0) {
    return {
      code: AUDIT_RECOMMENDATION.REVIEW_REQUIRED,
      label: "Informational review",
      summary: `${counts.INFO} info finding(s) — optional human review.`,
      findingCounts: counts,
    };
  }

  return {
    code: AUDIT_RECOMMENDATION.NO_ACTION,
    label: "No action required",
    summary: "Platform integrity checks passed.",
    findingCounts: counts,
  };
}

export function requiresHumanReview(recommendation) {
  return (
    recommendation?.code === AUDIT_RECOMMENDATION.REVIEW_REQUIRED ||
    recommendation?.code === AUDIT_RECOMMENDATION.BLOCKED
  );
}

export function severityToRecommendation(severity) {
  if (severity === FINDING_SEVERITY.CRITICAL) return AUDIT_RECOMMENDATION.BLOCKED;
  if (severity === FINDING_SEVERITY.WARNING) return AUDIT_RECOMMENDATION.REVIEW_REQUIRED;
  return AUDIT_RECOMMENDATION.NO_ACTION;
}

export { AUDIT_RECOMMENDATION };
