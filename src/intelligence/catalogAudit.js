import { buildVehicleIntelligence } from "./buildVehicleIntelligence.js";
import { validateVehicleForIntelligence, validateCompareSet } from "./intelligenceValidation.js";
import { buildFreshnessMetadata, FRESHNESS_STATE } from "./freshnessMetadata.js";
import { extractCurationMetadata } from "./curationMetadata.js";
import { extractCatalogChangeLog } from "./changeDetection.js";
import { computeFreshnessScore } from "./freshnessScoring.js";
import { CONFIDENCE_LEVELS } from "./constants.js";
import { isPresent } from "./governance.js";
import {
  classifyRangeCategory,
  classifyBatteryCapacity,
  classifyPriceBand,
} from "./taxonomy.js";

export const AUDIT_ISSUE = Object.freeze({
  MISSING_CHARGING: "missing_charging_intelligence",
  MISSING_OWNERSHIP: "missing_ownership_data",
  INCOMPLETE_TAXONOMY: "incomplete_taxonomy_mapping",
  WEAK_CONFIDENCE: "weak_confidence",
  MISSING_FEATURES: "missing_feature_mapping",
  COMPARE_RISK: "compare_incompatibility_risk",
  STALE_TRUST: "stale_trust_metadata",
  UNREVIEWED: "unreviewed_intelligence",
  PARTIAL_BUNDLE: "partial_intelligence_bundle",
});

const ISSUE_LABELS = {
  [AUDIT_ISSUE.MISSING_CHARGING]: "Missing charging intelligence",
  [AUDIT_ISSUE.MISSING_OWNERSHIP]: "Missing ownership data",
  [AUDIT_ISSUE.INCOMPLETE_TAXONOMY]: "Incomplete taxonomy mapping",
  [AUDIT_ISSUE.WEAK_CONFIDENCE]: "Weak confidence scores",
  [AUDIT_ISSUE.MISSING_FEATURES]: "Missing feature mapping",
  [AUDIT_ISSUE.COMPARE_RISK]: "Compare compatibility risk",
  [AUDIT_ISSUE.STALE_TRUST]: "Stale trust metadata",
  [AUDIT_ISSUE.UNREVIEWED]: "Unreviewed intelligence",
  [AUDIT_ISSUE.PARTIAL_BUNDLE]: "Partial intelligence bundle",
};

/**
 * Per-vehicle intelligence audit — human-readable, non-blocking.
 * @param {object} car
 */
export function auditVehicleCatalog(car) {
  const slug = car?.slug || car?._id || "unknown";
  const name = car?.name || slug;
  const issues = [];
  const warnings = [];

  const validation = validateVehicleForIntelligence(car);
  if (!validation.valid) {
    issues.push({
      code: AUDIT_ISSUE.COMPARE_RISK,
      label: ISSUE_LABELS[AUDIT_ISSUE.COMPARE_RISK],
      detail: validation.issues.join(", "),
    });
  }
  warnings.push(...(validation.warnings || []));

  const bundle = buildVehicleIntelligence(car);
  const curation = extractCurationMetadata(car);
  const freshness = buildFreshnessMetadata(car);
  const freshnessScore = computeFreshnessScore(freshness);
  const changeLog = extractCatalogChangeLog(car);

  if (!bundle) {
    issues.push({
      code: AUDIT_ISSUE.PARTIAL_BUNDLE,
      label: ISSUE_LABELS[AUDIT_ISSUE.PARTIAL_BUNDLE],
      detail: "No intelligence bundle could be built",
    });
    return formatAuditReport({ slug, name, issues, warnings, freshness, freshnessScore, changeLog });
  }

  if (!bundle.charging?.hasData) {
    issues.push({
      code: AUDIT_ISSUE.MISSING_CHARGING,
      label: ISSUE_LABELS[AUDIT_ISSUE.MISSING_CHARGING],
    });
  }

  if (!bundle.ownership?.hasData) {
    issues.push({
      code: AUDIT_ISSUE.MISSING_OWNERSHIP,
      label: ISSUE_LABELS[AUDIT_ISSUE.MISSING_OWNERSHIP],
    });
  }

  if (!bundle.features?.hasData || bundle.features.highlights?.length < 2) {
    warnings.push(AUDIT_ISSUE.MISSING_FEATURES);
  }

  const rangeKm =
    bundle.range?.claimedRangeKm ?? car?.specifications?.range;
  const price = Number(car?.startingPrice ?? car?.price);
  const battery = car?.specifications?.batteryPack;

  if (
    !classifyRangeCategory(rangeKm) ||
    !classifyPriceBand(price) ||
    (!battery && !bundle.ownership?.batteryKwh)
  ) {
    issues.push({
      code: AUDIT_ISSUE.INCOMPLETE_TAXONOMY,
      label: ISSUE_LABELS[AUDIT_ISSUE.INCOMPLETE_TAXONOMY],
    });
  } else if (!classifyBatteryCapacity(bundle.ownership?.batteryKwh)) {
    warnings.push(AUDIT_ISSUE.INCOMPLETE_TAXONOMY);
  }

  const trustConfidence =
    bundle.range?.confidenceLevel || CONFIDENCE_LEVELS.ESTIMATED;

  if (trustConfidence === CONFIDENCE_LEVELS.ESTIMATED && !curation.reviewed) {
    issues.push({
      code: AUDIT_ISSUE.WEAK_CONFIDENCE,
      label: ISSUE_LABELS[AUDIT_ISSUE.WEAK_CONFIDENCE],
    });
  }

  if (
    freshness.state === FRESHNESS_STATE.POTENTIALLY_STALE ||
    freshness.state === FRESHNESS_STATE.NEEDS_REVIEW
  ) {
    issues.push({
      code: AUDIT_ISSUE.STALE_TRUST,
      label: ISSUE_LABELS[AUDIT_ISSUE.STALE_TRUST],
      detail: freshness.stateLabel,
    });
  }

  if (!curation.reviewed) {
    issues.push({
      code: AUDIT_ISSUE.UNREVIEWED,
      label: ISSUE_LABELS[AUDIT_ISSUE.UNREVIEWED],
      detail: curation.reviewPriority || "normal",
    });
  }

  if (bundle.governance?.partial) {
    warnings.push(AUDIT_ISSUE.PARTIAL_BUNDLE);
  }

  return formatAuditReport({
    slug,
    name,
    issues,
    warnings,
    freshness,
    freshnessScore,
    changeLog,
    bundle,
    curation,
  });
}

function formatAuditReport({
  slug,
  name,
  issues,
  warnings,
  freshness,
  freshnessScore,
  changeLog,
  bundle,
  curation,
}) {
  const issueCodes = issues.map((i) => i.code);
  const severity =
    issueCodes.includes(AUDIT_ISSUE.COMPARE_RISK) ||
    issueCodes.includes(AUDIT_ISSUE.MISSING_CHARGING)
      ? "high"
      : issues.length >= 3
        ? "medium"
        : issues.length > 0
          ? "low"
          : "none";

  return {
    slug,
    name,
    issues,
    warnings: [...new Set(warnings)],
    issueCount: issues.length,
    severity,
    freshness,
    freshnessScore,
    changeLog,
    reviewed: Boolean(curation?.reviewed),
    reviewPriority: curation?.reviewPriority || null,
    escalation: Boolean(curation?.escalation),
    hasIntelligence: Boolean(bundle),
    summary:
      issues.length === 0
        ? "Catalog intelligence OK"
        : `${issues.length} issue(s) — ${issues.map((i) => i.label).join("; ")}`,
  };
}

/**
 * Catalog-wide ops summary for admin dashboards.
 * @param {object[]} cars
 */
export function buildCatalogOpsSummary(cars = []) {
  const audits = (cars || []).map(auditVehicleCatalog);

  const countByCode = (code) =>
    audits.filter((a) => a.issues.some((i) => i.code === code)).length;

  const staleCount = audits.filter(
    (a) =>
      a.freshness?.state === FRESHNESS_STATE.POTENTIALLY_STALE ||
      a.freshness?.state === FRESHNESS_STATE.NEEDS_REVIEW
  ).length;

  const unreviewedCount = audits.filter((a) => !a.reviewed).length;
  const incompleteIntelligenceCount = audits.filter(
    (a) => !a.hasIntelligence || a.warnings.includes(AUDIT_ISSUE.PARTIAL_BUNDLE)
  ).length;

  const highRiskCompare = audits.filter((a) =>
    a.issues.some((i) => i.code === AUDIT_ISSUE.COMPARE_RISK)
  ).length;

  return {
    totalVehicles: audits.length,
    auditedAt: new Date().toISOString(),
    staleCount,
    unreviewedCount,
    incompleteIntelligenceCount,
    missingChargingCount: countByCode(AUDIT_ISSUE.MISSING_CHARGING),
    missingOwnershipCount: countByCode(AUDIT_ISSUE.MISSING_OWNERSHIP),
    taxonomyMismatchCount: countByCode(AUDIT_ISSUE.INCOMPLETE_TAXONOMY),
    weakConfidenceCount: countByCode(AUDIT_ISSUE.WEAK_CONFIDENCE),
    compareRiskCount: highRiskCompare,
    escalationCount: audits.filter((a) => a.escalation).length,
    highSeverityCount: audits.filter((a) => a.severity === "high").length,
    vehicles: audits.sort((a, b) => b.issueCount - a.issueCount),
  };
}

/**
 * Validate a compare set for ops QA.
 */
export function auditCompareSet(cars = []) {
  const compareCheck = validateCompareSet(cars);
  const perVehicle = (cars || []).map(auditVehicleCatalog);

  return {
    compareSafe: compareCheck.safe,
    compareReason: compareCheck.reason,
    vehicles: perVehicle,
    anyStale: perVehicle.some((a) => a.freshness?.isStale),
    anyUnreviewed: perVehicle.some((a) => !a.reviewed),
  };
}
