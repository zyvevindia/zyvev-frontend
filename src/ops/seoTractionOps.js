/**
 * Lightweight SEO traction summaries from traffic aggregates (no Search Console API).
 * Uses path heuristics on admin “label” fields — good enough for internal triage.
 */

/**
 * @param {string} label
 * @returns {"discovery"|"compare"|"detail"|"city"|"other"}
 */
export function classifyLandingForSeoTraction(label = "") {
  const s = String(label).toLowerCase().trim();
  if (!s) return "other";
  if (s.includes("/compare") || /\bcompare\b/.test(s)) return "compare";
  if (s.includes("/cars/")) return "detail";
  if (
    s.includes("best-evs") ||
    s.includes("ownership-") ||
    s.includes("/guides/") ||
    s.includes("/guide/") ||
    s.includes("charging") && s.includes("city")
  ) {
    return "discovery";
  }
  if (s.includes("city") && (s.includes("ev") || s.includes("charging"))) return "city";
  return "other";
}

/**
 * Discovery-like landings with meaningful views.
 * @param {{ label: string, count: number }[]} topLandingPages
 */
export function pickDiscoveryLandingsWithTraffic(topLandingPages = [], minViews = 3) {
  return (topLandingPages || [])
    .filter((r) => classifyLandingForSeoTraction(r.label) === "discovery")
    .filter((r) => Number(r.count) >= minViews)
    .sort((a, b) => Number(b.count) - Number(a.count))
    .slice(0, 15);
}

/**
 * Compare-related rows merged from compare-specific and landing lists.
 */
export function pickComparePagesGainingTraffic(
  topComparePages = [],
  topLandingPages = [],
  minViews = 2
) {
  const byLabel = new Map();
  for (const r of [...(topComparePages || []), ...(topLandingPages || [])]) {
    const label = String(r.label || "").trim();
    if (!label) continue;
    if (classifyLandingForSeoTraction(label) !== "compare") continue;
    const n = Number(r.count ?? 0);
    if (n < minViews) continue;
    byLabel.set(label, (byLabel.get(label) || 0) + n);
  }
  return [...byLabel.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);
}

/**
 * High traffic + not in top converters + discovery/compare/detail class.
 */
export function rankWeakEngagementByTrafficClass(
  topLandingPages = [],
  topConvertingPages = [],
  { minViews = 10 } = {}
) {
  const conv = new Set(
    (topConvertingPages || [])
      .map((r) => String(r.label || "").trim())
      .filter(Boolean)
  );
  return (topLandingPages || [])
    .filter((r) => {
      const label = String(r.label || "").trim();
      const count = Number(r.count ?? 0);
      const cls = classifyLandingForSeoTraction(label);
      return (
        count >= minViews &&
        label &&
        !conv.has(label) &&
        cls !== "other"
      );
    })
    .map((r) => ({
      ...r,
      trafficClass: classifyLandingForSeoTraction(r.label),
    }))
    .sort((a, b) => Number(b.count) - Number(a.count))
    .slice(0, 12);
}
