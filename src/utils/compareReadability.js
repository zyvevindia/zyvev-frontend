/**
 * Beginner-friendly compare copy — wording only (no scoring changes).
 */

/**
 * @param {string} line
 */
export function softenCompareExplanation(line = "") {
  return String(line)
    .replace(
      /Composite score (\d+)\/100 blends range confidence, charging practicality, and ownership signals\./i,
      "EVSavari score $1/100 — based on range, charging ease, and ownership cost signals."
    )
    .replace(
      /Published catalog governance supports this score band\./i,
      "Catalog has been reviewed for this model family."
    )
    .replace(
      /Treat as directional — specs may be estimated or awaiting review\./i,
      "Use as a guide — confirm key specs with a dealer before you decide."
    )
    .replace(
      /Data quality impacts score confidence — missing or estimated fields lower the band\./i,
      "Some specs are still being verified — the score may shift as data improves."
    )
    .trim();
}
