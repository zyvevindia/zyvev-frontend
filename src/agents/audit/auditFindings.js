/**
 * Audit Agent v1 — finding construction (deterministic, no auto-fix).
 */
import { FINDING_SEVERITY } from "./auditStatus.js";
import { AUDIT_CATEGORIES } from "./auditRules.js";

let findingCounter = 0;

function newFindingId() {
  findingCounter += 1;
  return `finding_${Date.now()}_${findingCounter}`;
}

export function resetFindingCounter() {
  findingCounter = 0;
}

/**
 * @param {object} params
 * @returns {object}
 */
export function createFinding({
  severity = FINDING_SEVERITY.INFO,
  category,
  code,
  message,
  entityId = null,
  metadata = {},
  recommendation = null,
}) {
  return {
    id: newFindingId(),
    severity,
    category,
    code,
    message,
    entityId,
    metadata,
    recommendation,
    detectedAt: new Date().toISOString(),
    autoFixApplied: false,
  };
}

export function sortFindings(findings = []) {
  const order = { CRITICAL: 0, WARNING: 1, INFO: 2 };
  return [...findings].sort(
    (a, b) =>
      (order[a.severity] ?? 9) - (order[b.severity] ?? 9) ||
      String(a.category).localeCompare(String(b.category))
  );
}

export function groupFindingsByCategory(findings = []) {
  const groups = {};
  for (const finding of findings) {
    const key = finding.category || "other";
    if (!groups[key]) groups[key] = [];
    groups[key].push(finding);
  }
  return groups;
}

export function countBySeverity(findings = []) {
  return {
    INFO: findings.filter((f) => f.severity === FINDING_SEVERITY.INFO).length,
    WARNING: findings.filter((f) => f.severity === FINDING_SEVERITY.WARNING).length,
    CRITICAL: findings.filter((f) => f.severity === FINDING_SEVERITY.CRITICAL).length,
    total: findings.length,
  };
}

export { FINDING_SEVERITY, AUDIT_CATEGORIES };
