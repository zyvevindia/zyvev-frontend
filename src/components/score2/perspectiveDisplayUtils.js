/**
 * Display-only helpers for EVSavari Perspective card copy.
 */

const SUMMARY_TARGET_MAX = 220;

/**
 * Display-only summary compression for the perspective card (~25–35% shorter).
 *
 * @param {string|null|undefined} text
 * @returns {string}
 */
export function compactPerspectiveSummary(text) {
  const trimmed = String(text || "").trim();
  if (!trimmed) return "";

  const sentences =
    trimmed.match(/[^.!?]+[.!?]+/g)?.map((sentence) => sentence.trim()) || [
      trimmed,
    ];

  let summary =
    sentences.length <= 2
      ? sentences.join(" ")
      : `${sentences[0]} ${sentences[sentences.length - 1]}`;

  summary = summary
    .replace(
      /Designed primarily for city commuting, the /gi,
      "Built for city life, the "
    )
    .replace(
      /offers excellent running costs and easy ownership/gi,
      "combines low running costs with easy ownership"
    )
    .replace(
      /Its compact dimensions and affordability make it attractive for urban buyers, although /gi,
      "Its compact size and affordability make it a strong urban choice, though "
    )
    .replace(/\bprimarily for\b/gi, "for")
    .replace(/\bparticularly well suited\b/gi, "well suited")
    .replace(/\bmake it a compelling choice\b/gi, "make it a strong choice")
    .replace(/\s{2,}/g, " ")
    .trim();

  if (summary.length > SUMMARY_TARGET_MAX) {
    summary = summary.slice(0, SUMMARY_TARGET_MAX).replace(/\s+\S*$/, "").trim();
    if (!summary.endsWith("…") && !summary.endsWith(".")) {
      summary += "…";
    }
  }

  return summary;
}
