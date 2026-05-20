/**
 * Lightweight content quality score for ops (0–100, higher is better).
 * Deterministic blend of editorial flags + catalog audit density.
 */

import { summarizeEditorialFlags } from "./editorialContentFlags.js";

/**
 * @param {object} editorial from summarizeEditorialFlags()
 * @param {object} catalogSummary from buildCatalogOpsSummary-style { totalVehicles, vehicles }
 */
export function computeContentQualityOpsScore(editorial = {}, catalogSummary = null) {
  let score = 100;
  const totalFlags = Number(editorial.total || 0);
  score -= Math.min(30, totalFlags * 3);

  const vehicles = catalogSummary?.vehicles || [];
  const withIssues = vehicles.filter((v) => (v.issueCount || 0) > 0).length;
  const n = vehicles.length || 1;
  const density = withIssues / n;
  score -= Math.min(40, Math.round(density * 55));

  return Math.max(0, Math.min(100, score));
}
