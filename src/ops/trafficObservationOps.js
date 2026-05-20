/**
 * Lightweight traffic observation helpers (deterministic, no BI).
 * Input shapes match mergeIntelligence / traffic admin payloads.
 */

/**
 * Compare sessions with meaningful volume but weak completion.
 */
export function rankCompareDropOffHotspots(
  compareTrends = [],
  { maxCompletion = 42, minStarted = 4 } = {}
) {
  return (compareTrends || [])
    .filter((row) => {
      const started = Number(row.started ?? 0);
      const cr = Number(row.completionRate);
      return started >= minStarted && !Number.isNaN(cr) && cr <= maxCompletion;
    })
    .sort((a, b) => Number(a.completionRate) - Number(b.completionRate))
    .slice(0, 10);
}

/**
 * Landing pages with volume but no lead conversion row (label match heuristic).
 */
export function rankLowConvertingHighTrafficLandings(
  topLandingPages = [],
  topConvertingPages = [],
  { minViews = 12 } = {}
) {
  const convLabels = new Set(
    (topConvertingPages || [])
      .map((r) => String(r.label || "").trim())
      .filter(Boolean)
  );
  return (topLandingPages || [])
    .filter((row) => {
      const label = String(row.label || "").trim();
      const count = Number(row.count ?? 0);
      return count >= minViews && label && !convLabels.has(label);
    })
    .sort((a, b) => Number(b.count) - Number(a.count))
    .slice(0, 10);
}
