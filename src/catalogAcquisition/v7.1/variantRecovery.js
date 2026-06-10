/**
 * v7.1 — orchestrate variant count + price recovery.
 */

import { EVIDENCE_SOURCE_TYPE } from "../constants.js";
import { extractVariantsFromSources, mergeVariantSources } from "../v7/variantMatrixIntelligence.js";
import { extractPdfTrimMatrixFromSources } from "./pdfTrimMatrix.js";
import { mergeOemMatrixVariants, sanitizeVariantPrices } from "./variantPriceRecovery.js";
import { normalizeVariantKey } from "../v6/variantReconciliation.js";
import { TRIM_CATALOG, hasTrimCatalog } from "./trimCatalog.js";
import { normalizeTrimDisplayName, normalizeVariantListNames } from "./trimNameNormalization.js";

function variantScore(v) {
  return [v.price?.confidence, v.battery?.confidence, v.range?.confidence]
    .filter(Number.isFinite)
    .reduce((s, c, _, arr) => s + c / arr.length, 0);
}

/**
 * Exact-key dedupe for catalog families — avoids fuzzy merge dropping distinct trims.
 */
export function dedupeVariantsByExactKey(variants = []) {
  const byKey = new Map();
  for (const v of variants) {
    const name = normalizeTrimDisplayName(String(v.variantName?.value ?? v.variantName ?? ""));
    if (!name) continue;
    const key = normalizeVariantKey(name);
    if (!key) continue;
    const normalized = {
      ...v,
      variantName: v.variantName?.value != null ? { ...v.variantName, value: name } : name,
    };
    const prev = byKey.get(key);
    if (!prev || variantScore(normalized) > variantScore(prev)) byKey.set(key, normalized);
  }
  return [...byKey.values()];
}

/**
 * Keep only catalog-listed trims for known families (prevents variant count inflation).
 */
export function filterToCatalogTrims(variants = [], familySlug = "") {
  const catalog = TRIM_CATALOG[familySlug];
  if (!catalog?.length) return variants;
  const allowed = new Set(catalog.map((t) => normalizeVariantKey(t)));
  return variants.filter((v) => {
    const name = normalizeTrimDisplayName(String(v.variantName?.value ?? v.variantName ?? ""));
    return allowed.has(normalizeVariantKey(name));
  });
}

/**
 * Final variant list — catalog families use exact dedupe; others use v6 reconcile.
 */
export function finalizeVariantsV71(variants = [], familySlug = "", reconcileVariants) {
  const normalized = normalizeVariantListNames(variants);
  if (hasTrimCatalog(familySlug)) {
    return dedupeVariantsByExactKey(filterToCatalogTrims(normalized, familySlug));
  }
  return reconcileVariants(normalized);
}

function filterOemSources(sources = []) {
  return sources.filter(
    (s) =>
      s.type === EVIDENCE_SOURCE_TYPE.OEM_PDF ||
      s.type === EVIDENCE_SOURCE_TYPE.OEM_WEBSITE
  );
}

/**
 * Extract variants using v7 base (OEM sources only) + v7.1 PDF/trim matrix boost.
 */
export function extractVariantsV71(sources = [], familySlug = "") {
  const sourceSlice = hasTrimCatalog(familySlug) ? filterOemSources(sources) : sources;
  const baseMatrix = extractVariantsFromSources(sourceSlice);
  const pdfMatrix = extractPdfTrimMatrixFromSources(sources, familySlug);

  const pdfDrafts = pdfMatrix.map((row) => ({
    variantName: row.variantName,
    price: row.price,
    battery: row.battery,
    range: row.range,
    _sourceType: row.sourceType,
    _extractionMethod: row._extractionMethod,
    _priceSource: row.price ? "oem" : null,
  }));

  return normalizeVariantListNames(mergeOemMatrixVariants(baseMatrix, pdfDrafts));
}

/**
 * Merge matrix + LLM variants with v7.1 OEM price rules.
 */
export function mergeVariantsV71(matrixVariants = [], llmVariants = []) {
  const merged = mergeVariantSources(matrixVariants, llmVariants);
  return sanitizeVariantPrices(normalizeVariantListNames(merged));
}
