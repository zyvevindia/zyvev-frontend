/**
 * Group local feedback / learning signals into recurring themes (deterministic).
 */

import { listLocalFeedback } from "../services/feedbackApi.js";

/**
 * @param {object[]} entries from listLocalFeedback()
 */
export function groupFeedbackThemes(entries = []) {
  const byCategory = new Map();
  for (const e of entries || []) {
    const cat = String(e.category || "other").toLowerCase();
    byCategory.set(cat, (byCategory.get(cat) || 0) + 1);
  }
  return [...byCategory.entries()]
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Top friction routes (normalized prefix).
 */
export function rankFrictionRoutes(entries = [], limit = 10) {
  const byRoute = new Map();
  for (const e of entries || []) {
    const r = String(e.route || "/").split("?")[0] || "/";
    byRoute.set(r, (byRoute.get(r) || 0) + 1);
  }
  return [...byRoute.entries()]
    .map(([route, count]) => ({ route, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export function buildUsageFrictionSummary() {
  const entries = listLocalFeedback();
  return {
    total: entries.length,
    themes: groupFeedbackThemes(entries),
    topRoutes: rankFrictionRoutes(entries, 8),
  };
}
