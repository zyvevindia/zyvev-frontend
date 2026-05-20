/**
 * Batch validation for catalog ingestion — deterministic warnings only.
 */

/**
 * @param {Array<{ slug: string, fields: object, normalization: object }>} normalizedRows
 */
export function detectDuplicateSlugs(normalizedRows) {
  const seen = new Map();
  const dupes = [];
  for (const row of normalizedRows || []) {
    const s = String(row.slug || "").toLowerCase();
    if (!s) continue;
    if (seen.has(s)) dupes.push(s);
    else seen.set(s, true);
  }
  return [...new Set(dupes)];
}

/**
 * @param {Array<{ slug: string, fields: { startingPrice?: number } }>} normalizedRows
 * @param {{ slug: string, price: number }[]} priceHistory optional prior snapshot
 */
export function detectDangerousPriceMoves(normalizedRows, catalogBySlug) {
  const out = [];
  for (const row of normalizedRows || []) {
    const slug = row.slug;
    const next = row.fields?.startingPrice;
    if (next == null || !slug) continue;
    const car = catalogBySlug.get(slug);
    const prev = Number(car?.startingPrice ?? car?.price ?? 0) || 0;
    if (!prev) continue;
    const pct = ((next - prev) / prev) * 100;
    if (pct <= -25) {
      out.push({
        slug,
        kind: "large_price_drop",
        prev,
        next,
        pct: Math.round(pct),
      });
    }
    if (pct >= 35) {
      out.push({
        slug,
        kind: "large_price_increase",
        prev,
        next,
        pct: Math.round(pct),
      });
    }
  }
  return out;
}

/**
 * @param {object[]} rawItems
 */
export function summarizeUnsupportedFields(rawItems) {
  const counts = {};
  for (const item of rawItems || []) {
    if (!item || typeof item !== "object") continue;
    Object.keys(item).forEach((k) => {
      counts[k] = (counts[k] || 0) + 1;
    });
  }
  return counts;
}

/**
 * @param {object} diagnostics
 */
export function buildIngestionHealthSummary(diagnostics) {
  const lines = [];
  lines.push(`Rows parsed: ${diagnostics.rowCount ?? 0}`);
  lines.push(`Normalized: ${diagnostics.normalizedCount ?? 0}`);
  lines.push(`Parse errors: ${(diagnostics.parseErrors || []).length}`);
  lines.push(`Duplicate slugs: ${(diagnostics.duplicateSlugs || []).length}`);
  lines.push(`Dangerous price moves: ${(diagnostics.dangerousPrices || []).length}`);
  lines.push(`Taxonomy hints: ${(diagnostics.taxonomyHints || []).length}`);
  return lines.join("\n");
}
