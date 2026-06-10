/**
 * Brand options for buyer-facing catalog filters (derived from loaded families).
 * @param {object[]} families
 * @returns {string[]}
 */
export function getCatalogBrandOptions(families = []) {
  return Array.from(
    new Set(
      (families || [])
        .map((family) => family?.brand)
        .filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b));
}
