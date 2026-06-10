/**
 * v7.1 — variant prices from OEM PDF/website tables only.
 */

import { confField } from "../confidence.js";
import { EVIDENCE_SOURCE_TYPE } from "../constants.js";
import { normalizeVariantKey } from "../v6/variantReconciliation.js";
import { parsePriceInr } from "../v7/numericNormalization.js";
import { isLikelyVariantName } from "../v7/variantMatrixIntelligence.js";
import { isOemVariantSource } from "./pdfTrimMatrix.js";
import { normalizeTrimDisplayName } from "./trimNameNormalization.js";

const PRICE_CONFIDENCE = Object.freeze({
  [EVIDENCE_SOURCE_TYPE.OEM_PDF]: 94,
  [EVIDENCE_SOURCE_TYPE.OEM_WEBSITE]: 88,
});

function variantPriceScore(v) {
  const src = v._sourceType || v.sourceType;
  let score = 0;
  if (isOemVariantSource(src)) score += 100;
  if (v._extractionMethod?.includes("v7.1")) score += 15;
  if (v.price?.value != null || v.price != null) score += 20;
  score += v.price?.confidence || 0;
  return score;
}

/**
 * Strip prices from reference/LLM-reference variants; keep OEM-sourced prices.
 */
export function sanitizeVariantPrices(variants = []) {
  return variants.map((v) => {
    const src = v._sourceType || v.sourceType;
    const priceVal = v.price?.value ?? v.price;
    if (isOemVariantSource(src) && priceVal != null) {
      const conf = PRICE_CONFIDENCE[src] ?? 85;
      return {
        ...v,
        price: confField(parsePriceInr(priceVal), conf),
        _priceSource: "oem",
      };
    }
    if (!isOemVariantSource(src) && priceVal != null) {
      return {
        ...v,
        price: confField(null, 0),
        _priceStripped: true,
        _priceSource: null,
      };
    }
    return { ...v, _priceSource: isOemVariantSource(src) ? "oem" : null };
  });
}

/**
 * Merge OEM matrix variants with existing list — OEM price wins per trim key.
 */
export function mergeOemMatrixVariants(existing = [], oemMatrix = []) {
  const byKey = new Map();

  for (const v of existing) {
    const name = normalizeTrimDisplayName(String(v.variantName?.value ?? v.variantName ?? ""));
    if (!name || !isLikelyVariantName(name)) continue;
    const key = normalizeVariantKey(name);
    if (key) byKey.set(key, { ...v, variantName: v.variantName?.value != null ? { ...v.variantName, value: name } : name });
  }

  for (const row of oemMatrix) {
    const name = normalizeTrimDisplayName(row.variantName);
    if (!name || !isLikelyVariantName(name)) continue;
    const key = normalizeVariantKey(name);
    if (!key) continue;

    const draft = {
      variantName: name,
      price: confField(row.price, row.price ? (PRICE_CONFIDENCE[row.sourceType] ?? 88) : 0),
      battery: confField(row.battery, row.battery ? 85 : 0),
      range: confField(row.range, row.range ? 85 : 0),
      charging: confField(null, 0),
      _sourceType: row.sourceType,
      _extractionMethod: row._extractionMethod || "v7.1-oem-matrix",
      _priceSource: row.price ? "oem" : null,
    };

    const prev = byKey.get(key);
    if (!prev || variantPriceScore(draft) >= variantPriceScore(prev)) {
      byKey.set(key, draft);
    } else if (draft.price?.value != null && !prev.price?.value) {
      byKey.set(key, { ...prev, price: draft.price, _priceSource: "oem" });
    }
  }

  return [...byKey.values()];
}
