/**
 * Analytics Agent v1 — thresholds and category definitions.
 */

export const ANALYTICS_CATEGORIES = Object.freeze({
  CATALOG: "catalog_analytics",
  SCORE: "score_analytics",
  SEO: "seo_analytics",
  AGENT: "agent_analytics",
  MONITORING: "monitoring_analytics",
  AUDIT: "audit_analytics",
});

export const CATALOG_GROWTH_THRESHOLD = 2;
export const SEO_DRAFT_BACKLOG_THRESHOLD = 5;
export const RANKING_SHIFT_THRESHOLD = 2;
export const AGENT_FAILURE_RATE_WARNING = 25;
export const MONITORING_ALERT_SPIKE_THRESHOLD = 15;
export const AUDIT_FINDING_SPIKE_THRESHOLD = 10;

export const FRESHNESS_STALE_DAYS = 14;

export const INSIGHT_DEFINITIONS = Object.freeze([
  { id: "catalog_vehicle_count", category: ANALYTICS_CATEGORIES.CATALOG },
  { id: "catalog_variant_count", category: ANALYTICS_CATEGORIES.CATALOG },
  { id: "catalog_coverage_trend", category: ANALYTICS_CATEGORIES.CATALOG },
  { id: "catalog_freshness_trend", category: ANALYTICS_CATEGORIES.CATALOG },
  { id: "catalog_growth_detected", category: ANALYTICS_CATEGORIES.CATALOG },
  { id: "score_average", category: ANALYTICS_CATEGORIES.SCORE },
  { id: "score_category_leader", category: ANALYTICS_CATEGORIES.SCORE },
  { id: "score_ranking_shift", category: ANALYTICS_CATEGORIES.SCORE },
  { id: "score_distribution", category: ANALYTICS_CATEGORIES.SCORE },
  { id: "seo_pages_generated", category: ANALYTICS_CATEGORIES.SEO },
  { id: "seo_approval_rate", category: ANALYTICS_CATEGORIES.SEO },
  { id: "seo_publish_rate", category: ANALYTICS_CATEGORIES.SEO },
  { id: "seo_top_category", category: ANALYTICS_CATEGORIES.SEO },
  { id: "seo_draft_backlog", category: ANALYTICS_CATEGORIES.SEO },
  { id: "agent_success_rate", category: ANALYTICS_CATEGORIES.AGENT },
  { id: "agent_failure_rate", category: ANALYTICS_CATEGORIES.AGENT },
  { id: "agent_duration_avg", category: ANALYTICS_CATEGORIES.AGENT },
  { id: "agent_approval_count", category: ANALYTICS_CATEGORIES.AGENT },
  { id: "agent_failure_trend", category: ANALYTICS_CATEGORIES.AGENT },
  { id: "monitoring_alert_frequency", category: ANALYTICS_CATEGORIES.MONITORING },
  { id: "monitoring_resolution_time", category: ANALYTICS_CATEGORIES.MONITORING },
  { id: "monitoring_failure_pattern", category: ANALYTICS_CATEGORIES.MONITORING },
  { id: "monitoring_alert_spike", category: ANALYTICS_CATEGORIES.MONITORING },
  { id: "audit_finding_trend", category: ANALYTICS_CATEGORIES.AUDIT },
  { id: "audit_critical_trend", category: ANALYTICS_CATEGORIES.AUDIT },
  { id: "audit_trust_history", category: ANALYTICS_CATEGORIES.AUDIT },
  { id: "audit_resolution_rate", category: ANALYTICS_CATEGORIES.AUDIT },
]);

export function daysSince(isoDate, now = new Date()) {
  if (!isoDate) return null;
  const then = new Date(isoDate);
  if (Number.isNaN(then.getTime())) return null;
  const nowDate = now instanceof Date ? now : new Date(now);
  if (Number.isNaN(nowDate.getTime())) return null;
  return (nowDate.getTime() - then.getTime()) / (1000 * 60 * 60 * 24);
}

export function pct(part, total) {
  if (!total) return null;
  return Math.round((part / total) * 1000) / 10;
}
