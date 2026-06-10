import { CATEGORY_DEFINITIONS } from "./scoreWeights.js";

/**
 * Resolve category sort score from a scored vehicle result.
 * @param {object} scored result from scoreVehicle / scoreVehicleFromSignals
 * @param {string} categoryId
 * @returns {number}
 */
export function getCategoryScore(scored, categoryId) {
  const def = CATEGORY_DEFINITIONS[categoryId];
  if (!def || !scored?.breakdown) return 0;
  const row = scored.breakdown[def.scoreKey];
  return row?.score ?? 0;
}

/**
 * Rank scored vehicles for a category.
 * @param {Array<{ vehicle: object, scored: object }>} entries
 * @param {string} categoryId
 * @param {object} options
 * @returns {object[]}
 */
export function rankByCategory(entries, categoryId, options = {}) {
  const def = CATEGORY_DEFINITIONS[categoryId];
  if (!def) return [];

  const limit = options.limit ?? entries.length;
  const minScore = options.minScore ?? 0;

  return [...entries]
    .map((entry) => ({
      ...entry,
      categoryScore: getCategoryScore(entry.scored, categoryId),
      categoryLabel: def.label,
    }))
    .filter((row) => row.categoryScore >= minScore && row.scored?.hasData)
    .sort((a, b) => {
      const diff = b.categoryScore - a.categoryScore;
      if (diff !== 0) return diff;
      return (b.scored?.overall?.score ?? 0) - (a.scored?.overall?.score ?? 0);
    })
    .slice(0, limit)
    .map((row, index) => ({
      rank: index + 1,
      vehicle: row.vehicle,
      scored: row.scored,
      category: categoryId,
      categoryLabel: def.label,
      score: row.categoryScore,
      overallScore: row.scored?.overall?.score ?? null,
      grade: row.scored?.overall?.grade ?? null,
      reason: `${def.label}: ${row.categoryScore}/100 (${def.description})`,
    }));
}

/**
 * Build all category rankings for a vehicle set.
 * @param {Array<{ vehicle: object, scored: object }>} entries
 * @param {object} options
 * @returns {Record<string, object[]>}
 */
export function buildCategoryRankings(entries, options = {}) {
  const out = {};
  for (const categoryId of Object.keys(CATEGORY_DEFINITIONS)) {
    out[categoryId] = rankByCategory(entries, categoryId, options);
  }
  return out;
}

/**
 * Top N vehicles per category as flat list for UI tables.
 * @param {Array<{ vehicle: object, scored: object }>} entries
 * @param {number} topN
 * @returns {object[]}
 */
export function getTopRankedByCategory(entries, topN = 5) {
  const rankings = buildCategoryRankings(entries, { limit: topN });
  return Object.entries(rankings).flatMap(([categoryId, rows]) =>
    rows.map((row) => ({ ...row, categoryId }))
  );
}

export { CATEGORY_DEFINITIONS };
