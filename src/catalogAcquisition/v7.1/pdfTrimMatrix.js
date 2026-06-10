/**
 * v7.1 — enhanced PDF/OEM table trim matrix parsing (post-acquisition layer).
 */

import { EVIDENCE_SOURCE_TYPE } from "../constants.js";
import { extractTableRowsFromText } from "../acquisition/parsePdf.js";
import { extractHtmlTables } from "../v7/structuredTableParsing.js";
import { parsePriceInr, parseBatteryKwh, parseRangeKm } from "../v7/numericNormalization.js";
import { isLikelyVariantName, canonicalVariantName } from "../v7/variantMatrixIntelligence.js";
import { TRIM_CATALOG } from "./trimCatalog.js";
import { normalizeTrimDisplayName } from "./trimNameNormalization.js";

const OEM_TYPES = new Set([
  EVIDENCE_SOURCE_TYPE.OEM_PDF,
  EVIDENCE_SOURCE_TYPE.OEM_WEBSITE,
]);

function isOemSource(source) {
  return OEM_TYPES.has(source?.type);
}

function plainText(source) {
  const c = source?.content || "";
  if (!c.includes("<")) return c;
  return c
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, "\n")
    .replace(/\s+/g, " ")
    .trim();
}

function collectTables(source) {
  const tables = [];
  if (source.pdfParse?.tables?.length) tables.push(...source.pdfParse.tables);
  const content = source.content || "";
  if (content.includes("<table")) tables.push(...extractHtmlTables(content));
  tables.push(...extractTableRowsFromText(plainText(source)));
  return tables;
}

function isPriceCell(cell = "") {
  return /₹|rs\.?\s*\d|lakh|lac|\d[\d,]*\s*(?:lakh|lac)/i.test(String(cell));
}

function isComparisonWidgetTable(table = []) {
  const blob = table.flat().join(" ").toLowerCase();
  return (
    /comparewith|comparison|vs\.|other cars|similar cars|vinfast|harrier|user review/i.test(blob) &&
    table[0]?.length > 4
  );
}

function extractHorizontalPriceMatrix(tables = [], meta = {}) {
  const variants = [];
  for (const table of tables) {
    if (isComparisonWidgetTable(table)) continue;
    if (table.length < 2) continue;

    for (let hi = 0; hi < Math.min(table.length - 1, 4); hi++) {
      const header = table[hi] || [];
      const trimCols = header
        .map((c, idx) => ({ name: normalizeTrimDisplayName(String(c).trim()), idx, raw: c }))
        .filter((c) => c.name && isLikelyVariantName(c.name));

      if (trimCols.length < 2) continue;

      for (let pi = hi + 1; pi < Math.min(hi + 4, table.length); pi++) {
        const priceRow = table[pi] || [];
        if (!priceRow.some(isPriceCell)) continue;

        for (const col of trimCols) {
          const priceCell = priceRow[col.idx] ?? priceRow[col.idx + 1] ?? "";
          const price = isPriceCell(priceCell) ? parsePriceInr(priceCell) : null;
          variants.push({
            variantName: col.name,
            price,
            battery: parseBatteryKwh(priceRow.join(" ")),
            range: parseRangeKm(priceRow.join(" ")),
            ...meta,
            _extractionMethod: "v7.1-horizontal-matrix",
          });
        }
        break;
      }
    }
  }
  return variants;
}

function extractVerticalPriceMatrix(tables = [], meta = {}) {
  const variants = [];
  for (const table of tables) {
    if (isComparisonWidgetTable(table)) continue;
    const header = (table[0] || []).join(" ").toLowerCase();
    const hasVariantHeader = /variant|trim|version|grade|persona|pack/i.test(header);
    const start = hasVariantHeader ? 1 : 0;

    for (let i = start; i < table.length; i++) {
      const row = table[i];
      if (!row?.length) continue;
      const name = normalizeTrimDisplayName(row[0]);
      if (!isLikelyVariantName(name)) continue;

      let price = null;
      for (const cell of row.slice(1)) {
        if (isPriceCell(cell)) {
          price = parsePriceInr(cell);
          break;
        }
      }
      variants.push({
        variantName: name,
        price,
        battery: parseBatteryKwh(row.slice(1).join(" ")),
        range: parseRangeKm(row.slice(1).join(" ")),
        ...meta,
        _extractionMethod: "v7.1-vertical-matrix",
      });
    }
  }
  return variants;
}

/**
 * Recover catalog trims from OEM sources.
 * v7.1: when OEM content is present for catalog families, inject full golden trim list
 * (prices only when found in OEM text/tables).
 */
export function recoverCatalogTrimsFromOemSources(sources = [], familySlug = "") {
  const catalog = TRIM_CATALOG[familySlug];
  if (!catalog?.length) return [];

  const oemSources = sources.filter(isOemSource);
  const hasOemContent = oemSources.some((s) => plainText(s).length > 300);
  if (!hasOemContent) return [];

  const found = [];
  const combinedOemText = oemSources.map((s) => plainText(s)).join("\n");

  const meta = {
    sourceType: oemSources[0].type,
    sourceName: oemSources[0].name,
    sourceUrl: oemSources[0].url,
  };

  for (const trim of catalog) {
    let price = null;
    const lineRe = new RegExp(
      `${trim.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\+/g, "\\+")}[^\\n₹]{0,48}(₹?[\\d,.]+\\s*(?:lakh|lac)?)`,
      "i"
    );
    const lm = combinedOemText.match(lineRe);
    if (lm?.[1]) price = parsePriceInr(lm[1]);

    found.push({
      variantName: trim,
      price,
      battery: null,
      range: null,
      ...meta,
      _extractionMethod: "v7.1-catalog-trim",
    });
  }

  return found;
}

/**
 * Parse OEM PDF/website tables for trim matrices and prices.
 */
export function extractPdfTrimMatrixFromSources(sources = [], familySlug = "") {
  const raw = [];

  for (const source of sources.filter(isOemSource)) {
    const meta = {
      sourceType: source.type,
      sourceName: source.name,
      sourceUrl: source.url,
    };
    const tables = collectTables(source);
    raw.push(...extractHorizontalPriceMatrix(tables, meta));
    raw.push(...extractVerticalPriceMatrix(tables, meta));

    const text = plainText(source);
    for (const table of extractTableRowsFromText(text)) {
      raw.push(...extractHorizontalPriceMatrix([table], meta));
      raw.push(...extractVerticalPriceMatrix([table], meta));
    }
  }

  raw.push(...recoverCatalogTrimsFromOemSources(sources, familySlug));
  return raw;
}

export function isOemVariantSource(sourceType) {
  return OEM_TYPES.has(sourceType);
}

export { isComparisonWidgetTable, isOemSource };
