/**
 * Lightweight ops alerting — deterministic thresholds, no external services.
 * Used by admin dashboards; optional analytics when alerts render.
 */

const DEFAULT_THRESHOLDS = Object.freeze({
  staleVehicles: 12,
  unreviewedVehicles: 25,
  missingCharging: 8,
  compareRisk: 5,
  thinProfiles: 10,
  usefulnessNegativeRatio: 0.65,
  highSeverityFeedback: 4,
  missingEvFeedback: 3,
});

/**
 * @param {object} summary from buildContentOpsSummary / buildCatalogOpsSummary
 * @param {{ usefulnessYes?: number; usefulnessNo?: number }} [feedback]
 */
export function computeOpsTrafficAlerts(
  summary,
  feedback = {},
  thresholds = DEFAULT_THRESHOLDS
) {
  if (!summary) return [];

  const alerts = [];
  const t = { ...DEFAULT_THRESHOLDS, ...thresholds };

  if (summary.staleCount >= t.staleVehicles) {
    alerts.push({
      level: "warn",
      code: "stale_catalog_spike",
      message: `${summary.staleCount} vehicles flagged stale or need review — prioritize editorial refresh.`,
    });
  }

  if (summary.unreviewedCount >= t.unreviewedVehicles) {
    alerts.push({
      level: "info",
      code: "unreviewed_backlog",
      message: `${summary.unreviewedCount} vehicles unreviewed — schedule curation pass.`,
    });
  }

  if (summary.missingChargingCount >= t.missingCharging) {
    alerts.push({
      level: "warn",
      code: "charging_intel_gap",
      message: `${summary.missingChargingCount} vehicles missing charging intelligence — check catalog ingestion.`,
    });
  }

  if (summary.compareRiskCount >= t.compareRisk) {
    alerts.push({
      level: "warn",
      code: "compare_identity_risk",
      message: `${summary.compareRiskCount} vehicles have compare identity gaps — verify slug/name fields.`,
    });
  }

  const thin = summary.contentOps?.thinProfileCount ?? 0;
  if (thin >= t.thinProfiles) {
    alerts.push({
      level: "info",
      code: "thin_profiles",
      message: `${thin} thin or incomplete profiles — enrich high-traffic models first.`,
    });
  }

  const yes = Number(feedback.usefulnessYes || 0);
  const no = Number(feedback.usefulnessNo || 0);
  const total = yes + no;
  if (
    total >= 8 &&
    no / total >= t.usefulnessNegativeRatio
  ) {
    alerts.push({
      level: "warn",
      code: "usefulness_negative_trend",
      message:
        "Local usefulness votes skew negative — review compare UX and trust copy.",
    });
  }

  const highSev = Number(feedback.severityCounts?.high || 0);
  if (highSev >= t.highSeverityFeedback) {
    alerts.push({
      level: "warn",
      code: "high_severity_feedback_spike",
      message: `${highSev} high-severity issue reports in local buffer — triage data & trust pages.`,
    });
  }

  const missingEv = Number(feedback.byOperationalCategory?.missing_ev || 0);
  if (missingEv >= t.missingEvFeedback) {
    alerts.push({
      level: "info",
      code: "missing_ev_demand_signal",
      message: `${missingEv} “missing EV” reports — align catalog expansion with stated demand.`,
    });
  }

  return alerts;
}

/**
 * Cross-reference top-viewed slugs with audit rows (when ops snapshot present).
 */
export function prioritizeHighTrafficWeakModels(liveOps = {}, vehicles = []) {
  const top = liveOps.topViewed || liveOps.topCars || [];
  if (!Array.isArray(top) || !vehicles.length) return [];

  const bySlug = new Map(vehicles.map((v) => [v.slug, v]));

  return top
    .map((row) => {
      const slug = row.slug || row.familySlug;
      const audit = bySlug.get(slug);
      if (!audit) return null;
      return {
        slug,
        name: row.name || audit.name,
        views: row.views ?? row.count ?? 0,
        issueCount: audit.issueCount,
        summary: audit.summary,
      };
    })
    .filter(Boolean)
    .filter((r) => r.views > 0 && r.issueCount > 0)
    .sort((a, b) => b.views * b.issueCount - a.views * a.issueCount)
    .slice(0, 12);
}
