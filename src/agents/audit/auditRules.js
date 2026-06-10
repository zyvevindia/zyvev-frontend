/**
 * Audit Agent v1 — deterministic rules and thresholds.
 */

export const AUDIT_CATEGORIES = Object.freeze({
  CATALOG_INTEGRITY: "catalog_integrity",
  SCORE_INTEGRITY: "score_integrity",
  SEO_INTEGRITY: "seo_integrity",
  AGENT_GOVERNANCE: "agent_governance",
  REGISTRY_INTEGRITY: "registry_integrity",
  MONITORING_INTEGRITY: "monitoring_integrity",
});

export const SCORE_OUTLIER_THRESHOLD = 95;
export const SCORE_OUTLIER_LOW = 15;
export const RANKING_INCONSISTENCY_DELTA = 3;
export const MONITORING_ALERT_FLOOD_THRESHOLD = 20;
export const MONITORING_REPEATED_FAILURE_THRESHOLD = 3;

export const REGISTRY_VERIFICATION_MAX_DAYS = 30;

export const REQUIRED_CATALOG_FIELDS = Object.freeze([
  "familySlug",
  "displayName",
]);

export const REQUIRED_VARIANT_FIELDS = Object.freeze([
  "variantName",
  "priceInr",
]);

export const RULE_DEFINITIONS = Object.freeze([
  { id: "catalog_missing_required_field", category: AUDIT_CATEGORIES.CATALOG_INTEGRITY },
  { id: "catalog_broken_relationship", category: AUDIT_CATEGORIES.CATALOG_INTEGRITY },
  { id: "catalog_duplicate_variant", category: AUDIT_CATEGORIES.CATALOG_INTEGRITY },
  { id: "catalog_invalid_price", category: AUDIT_CATEGORIES.CATALOG_INTEGRITY },
  { id: "catalog_missing_score", category: AUDIT_CATEGORIES.CATALOG_INTEGRITY },
  { id: "score_missing_breakdown", category: AUDIT_CATEGORIES.SCORE_INTEGRITY },
  { id: "score_outlier", category: AUDIT_CATEGORIES.SCORE_INTEGRITY },
  { id: "score_inconsistent_ranking", category: AUDIT_CATEGORIES.SCORE_INTEGRITY },
  { id: "score_grade_mismatch", category: AUDIT_CATEGORIES.SCORE_INTEGRITY },
  { id: "seo_duplicate_slug", category: AUDIT_CATEGORIES.SEO_INTEGRITY },
  { id: "seo_missing_metadata", category: AUDIT_CATEGORIES.SEO_INTEGRITY },
  { id: "seo_broken_canonical", category: AUDIT_CATEGORIES.SEO_INTEGRITY },
  { id: "seo_missing_faq", category: AUDIT_CATEGORIES.SEO_INTEGRITY },
  { id: "governance_missing_approval", category: AUDIT_CATEGORIES.AGENT_GOVERNANCE },
  { id: "governance_unexpected_path", category: AUDIT_CATEGORIES.AGENT_GOVERNANCE },
  { id: "governance_failed_run", category: AUDIT_CATEGORIES.AGENT_GOVERNANCE },
  { id: "governance_log_anomaly", category: AUDIT_CATEGORIES.AGENT_GOVERNANCE },
  { id: "registry_broken_url", category: AUDIT_CATEGORIES.REGISTRY_INTEGRITY },
  { id: "registry_verification_expired", category: AUDIT_CATEGORIES.REGISTRY_INTEGRITY },
  { id: "registry_missing_brochure", category: AUDIT_CATEGORIES.REGISTRY_INTEGRITY },
  { id: "monitoring_unresolved_critical", category: AUDIT_CATEGORIES.MONITORING_INTEGRITY },
  { id: "monitoring_repeated_failure", category: AUDIT_CATEGORIES.MONITORING_INTEGRITY },
  { id: "monitoring_alert_flood", category: AUDIT_CATEGORIES.MONITORING_INTEGRITY },
]);

export function daysSince(isoDate, now = new Date()) {
  if (!isoDate) return null;
  const then = new Date(isoDate);
  if (Number.isNaN(then.getTime())) return null;
  const nowDate = now instanceof Date ? now : new Date(now);
  if (Number.isNaN(nowDate.getTime())) return null;
  return (nowDate.getTime() - then.getTime()) / (1000 * 60 * 60 * 24);
}
