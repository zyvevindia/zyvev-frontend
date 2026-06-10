/**
 * v7.1 — family-level prices derived only from validated OEM variant prices.
 */

import { EVIDENCE_FIELD_STATUS } from "../constants.js";
import { parsePriceInr } from "../v7/numericNormalization.js";

const REASONABLE_EV_PRICE_MIN = 600_000;
const REASONABLE_EV_PRICE_MAX = 6_000_000;

function validOemPrices(variants = []) {
  return variants
    .filter((v) => {
      const src = v._sourceType || v.sourceType;
      const price = parsePriceInr(v.price?.value ?? v.price);
      if (!Number.isFinite(price)) return false;
      return v._priceSource === "oem" || src === "OEM_PDF" || src === "OEM_WEBSITE";
    })
    .map((v) => parsePriceInr(v.price?.value ?? v.price))
    .filter((p) => Number.isFinite(p) && p >= REASONABLE_EV_PRICE_MIN && p <= REASONABLE_EV_PRICE_MAX);
}

/**
 * Override family pricing fields from OEM-validated variant price list.
 */
export function deriveFamilyPricingFromOemVariants(mergedFields = {}, variants = []) {
  const prices = validOemPrices(variants);
  if (!prices.length) return mergedFields;

  const out = { ...mergedFields };
  const minP = Math.min(...prices);
  const maxP = Math.max(...prices);

  const apply = (key, value) => {
    out[key] = {
      fieldName: key,
      value,
      confidence: prices.length >= 2 ? 92 : 85,
      status: EVIDENCE_FIELD_STATUS.AGREEMENT,
      manualReview: false,
      sources: [{ extractionMethod: "v7.1-oem-family-pricing", sourceType: "OEM_VARIANT_DERIVED" }],
      sourceValues: [{ value }],
    };
  };

  apply("startingPrice", minP);
  apply("topVariantPrice", maxP);
  apply("exShowroomPrice", minP);
  return out;
}

/**
 * Suppress loose-text price evidence when OEM variant prices exist.
 */
export function suppressLooseTextPricing(mergedFields = {}, variants = []) {
  const prices = validOemPrices(variants);
  if (prices.length < 2) return mergedFields;

  const out = { ...mergedFields };
  for (const key of ["startingPrice", "topVariantPrice", "exShowroomPrice"]) {
    const entry = out[key];
    if (!entry) continue;
    const fromOem = (entry.sources || []).some(
      (s) =>
        s.extractionMethod?.includes("v7.1-oem") ||
        s.sourceType === "OEM_VARIANT_DERIVED"
    );
    if (!fromOem && entry.value != null) {
      const expected = key === "topVariantPrice" ? Math.max(...prices) : Math.min(...prices);
      const parsed = parsePriceInr(entry.value);
      if (parsed !== expected) {
        out[key] = {
          ...entry,
          value: expected,
          status: EVIDENCE_FIELD_STATUS.AGREEMENT,
          manualReview: false,
          confidence: 91,
          correctedBy: "v7.1-oem-family-pricing",
        };
      }
    }
  }
  return out;
}
