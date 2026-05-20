/**
 * Metadata-only editorial flags (localStorage) — no CMS.
 * Compatible with future AI-assist: flags are structured strings + notes.
 */

const STORAGE_KEY = "evsavari-editorial-content-flags-v1";
const MAX = 150;

const FLAG_TYPES = Object.freeze([
  "needs_better_explanation",
  "missing_faq",
  "review_needed",
  "quality_concern",
  "trust_copy_review",
  "weak_faq",
  "thin_compare_copy",
  "weak_charging_guidance",
  "unclear_ownership_copy",
  "weak_recommendation_rationale",
]);

function read() {
  if (typeof localStorage === "undefined") {
    return [];
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function write(rows) {
  if (typeof localStorage === "undefined") {
    return;
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rows.slice(0, MAX)));
  } catch {
    /* quota */
  }
}

export { FLAG_TYPES };

/**
 * @param {{ pathOrSlug: string; flagType: string; note?: string }} payload
 */
export function appendEditorialContentFlag(payload = {}) {
  const pathOrSlug = String(payload.pathOrSlug || "").trim();
  if (!pathOrSlug) return null;
  const flagType = FLAG_TYPES.includes(payload.flagType)
    ? payload.flagType
    : "review_needed";
  const row = {
    id: `ecf-${Date.now()}`,
    at: new Date().toISOString(),
    pathOrSlug,
    flagType,
    note: String(payload.note || "").trim().slice(0, 2000),
  };
  write([row, ...read()]);
  return row;
}

export function listEditorialContentFlags() {
  return read();
}

export function summarizeEditorialFlags() {
  const rows = read();
  const byType = {};
  for (const r of rows) {
    byType[r.flagType] = (byType[r.flagType] || 0) + 1;
  }
  return { total: rows.length, byType, recent: rows.slice(0, 15) };
}
