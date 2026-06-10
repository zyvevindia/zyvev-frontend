/**
 * v7.1 — normalize trim names to golden comparison format before merge/match.
 */

import { canonicalVariantName } from "../v7/variantMatrixIntelligence.js";

export function normalizeTrimDisplayName(name = "") {
  let n = canonicalVariantName(name);
  n = n.replace(/\b(Creative|Fearless|Empowered)\s+Plus\b/gi, "$1+");
  n = n.replace(/\b(Fearless)\s+\+\s+(S\s+MR)\b/gi, "Fearless+ $2");
  n = n.replace(/\b(Empowered)\s+\+\s+(A\s+45)\b/gi, "Empowered+ $2");
  n = n.replace(/\+([A-Za-z0-9])/g, "+ $1");
  n = n.replace(/\s+/g, " ").trim();
  return n;
}

export function normalizeVariantListNames(variants = []) {
  return variants.map((v) => {
    const raw = String(v.variantName?.value ?? v.variantName ?? "").trim();
    const normalized = normalizeTrimDisplayName(raw);
    if (!normalized) return v;
    return {
      ...v,
      variantName:
        v.variantName?.value != null
          ? { ...v.variantName, value: normalized }
          : normalized,
    };
  });
}
