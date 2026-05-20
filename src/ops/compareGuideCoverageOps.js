/**
 * Compare guide coverage vs popular compare pairs (deterministic).
 */

import { GENERATED_COMPARE_SLUGS } from "../content/generated/manifest.js";
import { buildComparePairSlug } from "../seo/slugs.js";

const GUIDE_SET = new Set(GENERATED_COMPARE_SLUGS);

/**
 * Parse slugs from ops row (API shapes vary).
 * @param {object} row
 * @returns {string[]}
 */
export function extractComparePairSlugs(row) {
  if (!row || typeof row !== "object") return [];
  if (Array.isArray(row.slugs) && row.slugs.length >= 2) {
    return row.slugs.map((s) => String(s || "").trim()).filter(Boolean);
  }
  const label = String(row.label || "");
  const vs = label.split(/\s+vs\.?\s+/i);
  if (vs.length === 2) {
    return vs
      .map((s) =>
        s
          .trim()
          .toLowerCase()
          .replace(/\s+/g, "-")
      )
      .filter(Boolean);
  }
  return [];
}

/**
 * @param {object[]} topCompareRows from ops snapshot
 * @param {number} [intentWeight] views or completions — for sorting
 */
export function rankMissingCompareGuidesForPopularPairs(topCompareRows = []) {
  const rows = Array.isArray(topCompareRows) ? topCompareRows : [];
  const out = [];

  for (const row of rows) {
    const slugs = extractComparePairSlugs(row);
    if (slugs.length < 2) continue;
    const pairSlug = buildComparePairSlug(slugs[0], slugs[1]);
    if (!pairSlug) continue;
    const hasGuide = GUIDE_SET.has(pairSlug);
    const weight = Number(row.views ?? row.count ?? row.completed ?? row.leads ?? 0);
    if (!hasGuide) {
      out.push({
        pairSlug,
        slugs,
        label: row.label || `${slugs[0]} vs ${slugs[1]}`,
        intentSignal: weight,
        suggestion: `Add editorial compare guide or SEO pair for \`${pairSlug}\` when editorially ready.`,
      });
    }
  }

  return out.sort((a, b) => b.intentSignal - a.intentSignal).slice(0, 16);
}
