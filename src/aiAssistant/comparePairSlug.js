/**
 * Deterministic compare pair slug builder (Node-safe, no SEO route deps).
 */

/**
 * @param {string} slugA
 * @param {string} slugB
 * @returns {string|null}
 */
export function buildAssistantComparePairSlug(slugA, slugB) {
  const normalize = (value) =>
    String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

  const a = normalize(slugA);
  const b = normalize(slugB);

  if (!a || !b || a === b) return null;

  const [left, right] = [a, b].sort();
  return `${left}-vs-${right}`;
}
