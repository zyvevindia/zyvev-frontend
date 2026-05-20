/**
 * Structured user feedback — operational categories + default severity hints.
 * Stored on each report as `category` (id) and `severity` (user-selected).
 */

/** @typedef {{ id: string; label: string; hint?: string; defaultSeverity: 'high'|'medium'|'low'; opsWeight: number; group: string }} FeedbackCategoryDef */

/** @type {FeedbackCategoryDef[]} */
export const FEEDBACK_CATEGORY_DEFS = [
  {
    id: "incorrect_ev_data",
    label: "Incorrect EV data (specs, price, range)",
    hint: "Wrong numbers or outdated specs on a vehicle page",
    defaultSeverity: "high",
    opsWeight: 10,
    group: "data_quality",
  },
  {
    id: "compare_confusing",
    label: "Compare section confusing or unclear",
    defaultSeverity: "medium",
    opsWeight: 7,
    group: "compare",
  },
  {
    id: "recommendation_mismatch",
    label: "Recommendation / ranking feels wrong",
    defaultSeverity: "medium",
    opsWeight: 6,
    group: "discovery",
  },
  {
    id: "stale_information",
    label: "Information feels stale or outdated",
    defaultSeverity: "medium",
    opsWeight: 8,
    group: "freshness",
  },
  {
    id: "missing_ev",
    label: "Missing EV model or variant",
    defaultSeverity: "medium",
    opsWeight: 5,
    group: "catalog",
  },
  {
    id: "missing_compare_coverage",
    label: "Missing compare I want (two models)",
    defaultSeverity: "low",
    opsWeight: 4,
    group: "compare",
  },
  {
    id: "ux_confusion",
    label: "UX confusion (navigation, labels)",
    defaultSeverity: "low",
    opsWeight: 3,
    group: "ux",
  },
  {
    id: "charging_range_trust",
    label: "Charging or range trust concern",
    defaultSeverity: "high",
    opsWeight: 9,
    group: "trust",
  },
  {
    id: "broken_image",
    label: "Broken or missing image",
    defaultSeverity: "low",
    opsWeight: 4,
    group: "media",
  },
  {
    id: "form_lead",
    label: "Form or lead issue",
    defaultSeverity: "high",
    opsWeight: 8,
    group: "leads",
  },
  {
    id: "performance",
    label: "Slow or not loading",
    defaultSeverity: "medium",
    opsWeight: 5,
    group: "ux",
  },
  {
    id: "other",
    label: "Other",
    defaultSeverity: "low",
    opsWeight: 2,
    group: "other",
  },
];

const LEGACY_CATEGORY_MAP = Object.freeze({
  wrong_data: "incorrect_ev_data",
  compare: "compare_confusing",
  form: "form_lead",
  broken_image: "broken_image",
  performance: "performance",
  other: "other",
});

const byId = new Map(FEEDBACK_CATEGORY_DEFS.map((d) => [d.id, d]));

export const FEEDBACK_SEVERITY_LEVELS = Object.freeze([
  { id: "high", label: "High — blocks trust or purchase" },
  { id: "medium", label: "Medium — confusing or incomplete" },
  { id: "low", label: "Low — polish / minor" },
]);

/**
 * Normalize stored category (legacy + current).
 */
export function normalizeFeedbackCategoryId(raw) {
  const s = String(raw || "").trim();
  if (!s) return "other";
  if (byId.has(s)) return s;
  return LEGACY_CATEGORY_MAP[s] || "other";
}

export function getFeedbackCategoryDef(id) {
  return byId.get(normalizeFeedbackCategoryId(id)) || byId.get("other");
}

const SEVERITY_MULT = { high: 3, medium: 2, low: 1 };

/**
 * Deterministic ops priority score for sorting issue rows.
 */
export function feedbackOpsPriorityScore(categoryId, severity) {
  const def = getFeedbackCategoryDef(categoryId);
  const sev = SEVERITY_MULT[severity] || SEVERITY_MULT.medium;
  return def.opsWeight * sev;
}
