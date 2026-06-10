/**
 * v7 — variant matrix extraction from PDF/HTML tables.
 */

import { confField } from "../confidence.js";
import { EVIDENCE_SOURCE_TYPE } from "../constants.js";
import { extractTableRowsFromText, detectVariantMatrixFromText } from "../acquisition/parsePdf.js";
import { extractHtmlTables } from "./structuredTableParsing.js";
import { normalizeVariantKey } from "../v6/variantReconciliation.js";
import { parsePriceInr, parseBatteryKwh, parseRangeKm } from "./numericNormalization.js";

const TRIM_TOKENS =
  /^(creative|fearless|empowered|punch|smart|exclusive|excite|essence|executive|play|adventure|accomplished|savvy|sharp|super|style|select|pro|max|plus|dynamic|superior|premium|special|edition|pack|signature|fearless)(\s*\+)?/i;

const TRIM_WORD_RE =
  /\b(creative|fearless|empowered|punch|smart|exclusive|excite|essence|executive|play|adventure|accomplished|savvy|sharp|super|style|select|pro|max|plus|dynamic|superior|premium|special|edition|pack|signature|one|three|awd|mr|lr)\b/i;

function isValidVariantName(name = "") {
  const n = String(name).trim();
  if (n.length < 2 || n.length > 42) return false;
  if (/[<>]|class=|data-|http|\.com|icon-|Rs\.|Lakh|section|div|span|tbody|comparewith/i.test(n)) return false;
  if (/^(variant|trim|model|price|battery|range|spec|rating|fuel)/i.test(n)) return false;
  if (/^\d+$/.test(n)) return false;
  return true;
}

function isLikelyVariantName(name = "") {
  const n = String(name).trim();
  if (!isValidVariantName(n)) return false;
  return (
    TRIM_TOKENS.test(n) ||
    /\+/.test(n) ||
    /\b(MR|LR|Pro|Plus|Max|Edition)\b/i.test(n) ||
    /\d{1,3}\s*kwh/i.test(n) ||
    (n.split(/\s+/).length <= 4 && TRIM_WORD_RE.test(n))
  );
}

function stripModelPrefix(name = "") {
  let n = String(name).trim();
  n = n.replace(
    /^(?:byd|tata|mahindra|mg|hyundai|kia|citroen|mercedes|bmw|volvo)\s+[\w\s-]+?\s+(?=[A-Za-z])/i,
    ""
  );
  n = n.replace(
    /^(?:nexon|curvv|punch|tiago|atto\s*3|be\s*6|xev\s*9e|windsor|zs|creta|harrier)\s*(?:ev|electric)?\s+/i,
    ""
  );
  return n.trim() || String(name).trim();
}

function canonicalVariantName(name = "") {
  const stripped = stripModelPrefix(String(name));
  return stripped
    .replace(/\s+/g, " ")
    .replace(/\s*\+\s*/g, "+")
    .replace(/\bEv\b/g, "EV")
    .trim();
}

function parseVariantRow(cells = []) {
  if (!cells.length) return null;
  const name = canonicalVariantName(cells[0]);
  if (!isLikelyVariantName(name)) return null;

  let price = null;
  let battery = null;
  let range = null;

  for (const cell of cells.slice(1)) {
    const c = String(cell);
    if (!price && /₹|lakh|lac|rs\.?/i.test(c)) price = parsePriceInr(c);
    else if (!price && /^\s*[\d,.]+\s*$/.test(c) && Number(c.replace(/,/g, "")) >= 100_000) {
      price = parsePriceInr(c);
    }
    if (!battery) battery = parseBatteryKwh(c);
    if (!range) range = parseRangeKm(c);
  }

  return {
    variantName: name,
    price,
    battery,
    range,
    rawCells: cells.slice(1),
  };
}

function extractVariantsFromTables(tables = [], sourceMeta = {}) {
  const variants = [];
  for (const table of tables) {
    const header = (table[0] || []).join(" ").toLowerCase();
    const variantCol =
      /variant|trim|grade|version|pack|persona/i.test(header) ||
      table.some((row) => isLikelyVariantName(row[0]));

    if (!variantCol) continue;

    const startIdx = /variant|trim|grade|version/i.test(header) ? 1 : 0;
    for (let i = startIdx; i < table.length; i++) {
      const parsed = parseVariantRow(table[i]);
      if (parsed) variants.push({ ...parsed, ...sourceMeta });
    }
  }
  return variants;
}

function extractVariantsFromTextPatterns(text = "", sourceMeta = {}) {
  const variants = [];
  const lines = String(text).split(/\r?\n/);
  for (const line of lines) {
    if (line.length > 120 || /[<>]/.test(line)) continue;
    const priceMatch = line.match(
      /^([A-Za-z0-9+.\s]{2,36}?)\s+₹?\s*([\d,.]+(?:\.\d+)?)\s*(?:lakh|lac)?/i
    );
    const candidate = canonicalVariantName(priceMatch?.[1] || "");
    if (priceMatch && isLikelyVariantName(candidate)) {
      variants.push({
        variantName: candidate,
        price: parsePriceInr(priceMatch[2] + (/\blakh|lac/i.test(line) ? " lakh" : "")),
        battery: parseBatteryKwh(line),
        range: parseRangeKm(line),
        ...sourceMeta,
      });
    }
  }
  return variants;
}

function variantRowToDraft(v, confidence = 88) {
  return {
    variantName: canonicalVariantName(v.variantName),
    price: confField(v.price, v.price ? confidence : 0),
    battery: confField(v.battery, v.battery ? confidence - 3 : 0),
    range: confField(v.range, v.range ? confidence - 3 : 0),
    charging: confField(null, 0),
    _sourceType: v.sourceType,
    _extractionMethod: "v7-variant-matrix",
  };
}

function dedupeVariantsByKey(variants = []) {
  const byKey = new Map();
  const tierScore = (v) => {
    let s = 50;
    if (v.sourceType === EVIDENCE_SOURCE_TYPE.OEM_PDF) s += 50;
    else if (v.sourceType === EVIDENCE_SOURCE_TYPE.OEM_WEBSITE) s += 35;
    else if (v.sourceType === EVIDENCE_SOURCE_TYPE.TRUSTED_REFERENCE) s += 20;
    if (v.price) s += 10;
    if (v.battery) s += 5;
    if (v.range) s += 5;
    return s;
  };

  for (const v of variants) {
    const key = normalizeVariantKey(v.variantName);
    if (!key) continue;
    const prev = byKey.get(key);
    if (!prev || tierScore(v) > tierScore(prev)) {
      byKey.set(key, v);
    }
  }
  return [...byKey.values()];
}

/**
 * Extract variant rows from all acquisition sources.
 */
export function extractVariantsFromSources(sources = []) {
  const raw = [];

  for (const source of sources) {
    if (!source?.content) continue;
    const meta = {
      sourceType: source.type,
      sourceName: source.name,
      sourceUrl: source.url,
    };

    const tables = source.content.includes("<")
      ? [...extractHtmlTables(source.content), ...extractTableRowsFromText(stripText(source.content))]
      : extractTableRowsFromText(source.content);

    if (source.pdfParse?.variantMatrix?.length) {
      for (const v of source.pdfParse.variantMatrix) {
        raw.push({
          variantName: canonicalVariantName(v.variantName),
          price: parsePriceInr(v.rawCells?.find((c) => /lakh|₹|\d{6}/i.test(c))),
          battery: parseBatteryKwh(v.rawCells?.join(" ")),
          range: parseRangeKm(v.rawCells?.join(" ")),
          ...meta,
        });
      }
    }

    raw.push(...extractVariantsFromTables(tables, meta));
    const plainText = source.content.includes("<") ? stripText(source.content) : source.content;

    raw.push(...detectVariantMatrixFromText(plainText).map((v) => ({
      variantName: canonicalVariantName(v.variantName),
      price: parsePriceInr(v.rawCells?.join(" ")),
      battery: parseBatteryKwh(v.rawCells?.join(" ")),
      range: parseRangeKm(v.rawCells?.join(" ")),
      ...meta,
    })));
    raw.push(...extractVariantsFromTextPatterns(plainText, meta));
  }

  const filtered = dedupeVariantsByKey(raw).filter((v) => {
    const name = canonicalVariantName(v.variantName);
    if (!isLikelyVariantName(name)) return false;
    if (!v.price && !v.battery && !v.range) return false;
    return true;
  });

  return filtered.map((v) => variantRowToDraft({ ...v, variantName: canonicalVariantName(v.variantName) }, 90));
}

function stripText(html) {
  return String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, "\n")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Merge matrix variants with LLM variants — matrix wins on name collision.
 */
export function mergeVariantSources(matrixVariants = [], llmVariants = []) {
  const byKey = new Map();

  for (const v of llmVariants || []) {
    const rawName = String(v.variantName?.value ?? v.variantName ?? "").trim();
    if (!rawName || !isValidVariantName(rawName)) continue;
    const name = canonicalVariantName(rawName);
    const key = normalizeVariantKey(name);
    if (!key) continue;
    const normalized = {
      ...v,
      variantName: v.variantName?.value != null ? { ...v.variantName, value: name } : name,
    };
    byKey.set(key, normalized);
  }

  for (const v of matrixVariants || []) {
    const name = canonicalVariantName(String(v.variantName?.value ?? v.variantName ?? "").trim());
    if (!isLikelyVariantName(name)) continue;
    const key = normalizeVariantKey(name);
    if (!key) continue;
    const prev = byKey.get(key);
    const sourceType = v._sourceType;
    if (sourceType === EVIDENCE_SOURCE_TYPE.TRUSTED_REFERENCE && !prev) continue;
    const score = (v.price?.confidence || 0) + (v._extractionMethod === "v7-variant-matrix" ? 20 : 0);
    const prevScore = (prev?.price?.confidence || 0) + (prev?._extractionMethod === "v7-variant-matrix" ? 20 : 0);
    const normalized = {
      ...v,
      variantName: v.variantName?.value != null ? { ...v.variantName, value: name } : name,
    };
    if (!prev || score >= prevScore) byKey.set(key, normalized);
  }

  return [...byKey.values()];
}

export { canonicalVariantName, isLikelyVariantName };
