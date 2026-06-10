/**
 * Audit Agent v1 — audit score, trust score, and resolution metrics.
 */
import { FINDING_SEVERITY } from "./auditStatus.js";
import { countBySeverity } from "./auditFindings.js";
import { AUDIT_CATEGORIES } from "./auditRules.js";

export function computeAuditScore(findings = []) {
  const counts = countBySeverity(findings);
  let score = 100;
  score -= counts.CRITICAL * 18;
  score -= counts.WARNING * 6;
  score -= counts.INFO * 2;
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function computeTrustScore(findings = [], scans = []) {
  let score = 100;
  const counts = countBySeverity(findings);

  score -= counts.CRITICAL * 20;
  score -= counts.WARNING * 8;

  const governance = findings.filter(
    (f) => f.category === AUDIT_CATEGORIES.AGENT_GOVERNANCE
  );
  score -= governance.filter((f) => f.severity === FINDING_SEVERITY.CRITICAL).length * 10;

  const monitoring = findings.filter(
    (f) => f.category === AUDIT_CATEGORIES.MONITORING_INTEGRITY
  );
  score -= monitoring.filter((f) => f.severity === FINDING_SEVERITY.CRITICAL).length * 15;

  const resolvedScans = scans.filter((s) => s.status === "approved").length;
  const totalScans = scans.length || 1;
  const resolutionRate = resolvedScans / totalScans;
  score = score * 0.85 + resolutionRate * 15;

  return Math.max(0, Math.min(100, Math.round(score)));
}

export function computeResolutionRate(scans = []) {
  if (!scans.length) return null;
  const resolved = scans.filter(
    (s) => s.status === "approved" || s.status === "rejected"
  ).length;
  return Math.round((resolved / scans.length) * 1000) / 10;
}

export function computeAuditMetrics(auditRun, priorScans = []) {
  const findings = auditRun.findings || [];
  const counts = countBySeverity(findings);

  return {
    findingCount: counts.total,
    criticalCount: counts.CRITICAL,
    warningCount: counts.WARNING,
    infoCount: counts.INFO,
    auditScore: computeAuditScore(findings),
    trustScore: computeTrustScore(findings, priorScans),
    resolutionRatePct: computeResolutionRate(priorScans),
    failureFrequency: counts.CRITICAL + counts.WARNING,
    resolutionTimeMs: auditRun.resolutionTimeMs ?? null,
    auditedAt: auditRun.completedAt || auditRun.startedAt,
  };
}

export function buildTrendPoints(scans = [], key = "auditScore") {
  return [...scans]
    .reverse()
    .slice(-12)
    .map((s, i) => ({
      index: i + 1,
      label: s.completedAt
        ? new Date(s.completedAt).toLocaleDateString()
        : `#${i + 1}`,
      value: s.metrics?.[key] ?? computeAuditScore(s.findings || []),
    }));
}
