/**
 * Coerce intelligence insight entries (strings or score-engine objects) to labels.
 * Presentation-only — never throws on malformed catalog data.
 */

/**
 * @param {unknown} entry
 * @returns {string}
 */
export function normalizeInsightLabel(entry) {
  if (entry == null) return "";
  if (typeof entry === "string") return entry.trim();
  if (typeof entry === "number" || typeof entry === "boolean") {
    return String(entry).trim();
  }
  if (typeof entry === "object") {
    const candidate =
      entry.reason ?? entry.label ?? entry.text ?? entry.summary ?? "";
    return String(candidate).trim();
  }
  return "";
}

/**
 * @param {unknown} entries
 * @returns {string[]}
 */
export function normalizeInsightLabels(entries) {
  if (!Array.isArray(entries)) return [];
  return entries.map(normalizeInsightLabel).filter(Boolean);
}
