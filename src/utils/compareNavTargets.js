/** Compare nav route constants and pure routing helpers (no storage deps). */

/** Same entry as Home “Compare EVs” body CTA */
export const COMPARE_DISCOVERY_PATH = "/cars?compareMode=true";

export const COMPARE_HUB_PATH = "/compare";

/**
 * @param {number} count
 * @returns {string}
 */
export function getCompareNavDestinationFromCount(count) {
  return count > 0 ? COMPARE_HUB_PATH : COMPARE_DISCOVERY_PATH;
}

/**
 * Highlight Compare in nav for hub or catalog compare-discovery mode.
 * @param {string} pathname
 * @param {string} [search]
 */
export function isCompareNavActive(pathname, search = "") {
  if (pathname === COMPARE_HUB_PATH) return true;

  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  if (params.get("compareMode") !== "true") return false;

  return (
    pathname === "/cars" ||
    pathname === "/popular" ||
    pathname === "/latest" ||
    pathname === "/upcoming"
  );
}
