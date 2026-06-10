/**
 * Monitoring Agent v1 — deterministic rules and thresholds.
 */

export const FRESHNESS_THRESHOLDS_DAYS = Object.freeze({
  catalogUpdate: 30,
  acquisition: 14,
  scoreGeneration: 7,
  seoGeneration: 7,
  registryVerification: 30,
});

export const SCORE_DRIFT_THRESHOLD = 15;

export const AGENT_FAILURE_RATE_WARNING = 20;
export const AGENT_FAILURE_RATE_CRITICAL = 40;

export const OEM_PROBE_TIMEOUT_MS = 15000;

export const MONITORING_CATEGORIES = Object.freeze({
  CATALOG_FRESHNESS: "catalog_freshness",
  OEM_HEALTH: "oem_health",
  AGENT_HEALTH: "agent_health",
  SCORE_DRIFT: "score_drift",
  SEO_HEALTH: "seo_health",
  REGISTRY_HEALTH: "registry_health",
});

export const AGENT_IDS = Object.freeze({
  VEHICLE_CREATION: "vehicleCreation",
  CHANGE_DETECTION: "changeDetection",
  SCORE_ENGINE: "scoreEngine",
  SEO: "seo",
  ORCHESTRATOR: "orchestrator",
});

export const RULE_DEFINITIONS = Object.freeze([
  { id: "catalog_stale_update", category: MONITORING_CATEGORIES.CATALOG_FRESHNESS },
  { id: "acquisition_stale", category: MONITORING_CATEGORIES.CATALOG_FRESHNESS },
  { id: "score_generation_stale", category: MONITORING_CATEGORIES.CATALOG_FRESHNESS },
  { id: "seo_generation_stale", category: MONITORING_CATEGORIES.CATALOG_FRESHNESS },
  { id: "oem_unreachable", category: MONITORING_CATEGORIES.OEM_HEALTH },
  { id: "oem_redirect", category: MONITORING_CATEGORIES.OEM_HEALTH },
  { id: "oem_timeout", category: MONITORING_CATEGORIES.OEM_HEALTH },
  { id: "oem_pdf_missing", category: MONITORING_CATEGORIES.OEM_HEALTH },
  { id: "agent_high_failure_rate", category: MONITORING_CATEGORIES.AGENT_HEALTH },
  { id: "agent_recent_failure", category: MONITORING_CATEGORIES.AGENT_HEALTH },
  { id: "score_missing", category: MONITORING_CATEGORIES.SCORE_DRIFT },
  { id: "score_large_drift", category: MONITORING_CATEGORIES.SCORE_DRIFT },
  { id: "category_ranking_shift", category: MONITORING_CATEGORIES.SCORE_DRIFT },
  { id: "seo_missing_metadata", category: MONITORING_CATEGORIES.SEO_HEALTH },
  { id: "seo_duplicate_slug", category: MONITORING_CATEGORIES.SEO_HEALTH },
  { id: "seo_unpublished_drafts", category: MONITORING_CATEGORIES.SEO_HEALTH },
  { id: "seo_orphan_page", category: MONITORING_CATEGORIES.SEO_HEALTH },
  { id: "registry_missing_brochure", category: MONITORING_CATEGORIES.REGISTRY_HEALTH },
  { id: "registry_unverified_url", category: MONITORING_CATEGORIES.REGISTRY_HEALTH },
  { id: "registry_verification_expired", category: MONITORING_CATEGORIES.REGISTRY_HEALTH },
]);

export function daysSince(isoDate, now = new Date()) {
  if (!isoDate) return null;
  const then = new Date(isoDate);
  if (Number.isNaN(then.getTime())) return null;
  const nowDate = now instanceof Date ? now : new Date(now);
  if (Number.isNaN(nowDate.getTime())) return null;
  return (nowDate.getTime() - then.getTime()) / (1000 * 60 * 60 * 24);
}
