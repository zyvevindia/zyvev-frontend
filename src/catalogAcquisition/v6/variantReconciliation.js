/**
 * v6 — variant name normalization and deduplication before gate checks.
 */

import { variantNameSimilarity } from "../benchmark/compareUtils.js";

/**
 * Normalize variant names for fuzzy matching.
 * "Empowered Plus LR" ↔ "Empowered+ LR"
 */
export function normalizeVariantKey(name = "") {
  return String(name)
    .toLowerCase()
    .replace(/\+/g, " plus ")
    .replace(/\bplus\b/g, "plus")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function variantKeySimilarity(a, b) {
  const ka = normalizeVariantKey(a);
  const kb = normalizeVariantKey(b);
  if (!ka || !kb) return 0;
  if (ka === kb) return 1;
  return variantNameSimilarity(ka, kb);
}

function variantScore(v) {
  return [v.price?.confidence, v.battery?.confidence, v.range?.confidence]
    .filter(Number.isFinite)
    .reduce((s, c, _, arr) => s + c / arr.length, 0);
}

/**
 * Deduplicate and merge variants with similar names.
 * @param {object[]} variants
 * @param {{ similarityThreshold?: number }} opts
 */
export function reconcileVariants(variants = [], opts = {}) {
  const threshold = opts.similarityThreshold ?? 0.72;
  const input = (variants || []).filter((v) => String(v.variantName?.value ?? v.variantName ?? "").trim());
  if (!input.length) return [];

  const clusters = [];

  for (const v of input) {
    const name = String(v.variantName?.value ?? v.variantName ?? "").trim();
    let placed = false;

    for (const cluster of clusters) {
      const sim = variantKeySimilarity(name, cluster.canonicalName);
      if (sim >= threshold) {
        cluster.members.push(v);
        if (variantScore(v) > cluster.bestScore) {
          cluster.best = v;
          cluster.bestScore = variantScore(v);
          cluster.canonicalName = name;
        }
        placed = true;
        break;
      }
    }

    if (!placed) {
      clusters.push({
        canonicalName: name,
        best: v,
        bestScore: variantScore(v),
        members: [v],
      });
    }
  }

  return clusters.map((c) => ({
    ...c.best,
    variantName: c.best.variantName?.value != null
      ? { ...c.best.variantName, value: c.canonicalName }
      : c.canonicalName,
    _v6Reconciled: c.members.length > 1,
    _v6MergedCount: c.members.length,
  }));
}

/**
 * Match extracted variants to golden variants for benchmark reconciliation.
 */
export function matchVariantsToGolden(extractedVariants = [], goldenVariants = []) {
  const extracted = reconcileVariants(extractedVariants);
  const matches = [];
  const used = new Set();

  for (const gv of goldenVariants) {
    let bestIdx = -1;
    let bestSim = 0;
    extracted.forEach((ev, idx) => {
      if (used.has(idx)) return;
      const name = ev.variantName?.value ?? ev.variantName;
      const sim = variantKeySimilarity(gv.variantName, name);
      if (sim > bestSim) {
        bestSim = sim;
        bestIdx = idx;
      }
    });
    if (bestSim >= 0.5 && bestIdx >= 0) {
      used.add(bestIdx);
      matches.push({ golden: gv, extracted: extracted[bestIdx], similarity: bestSim, matched: true });
    } else {
      matches.push({ golden: gv, extracted: null, similarity: 0, matched: false });
    }
  }

  return {
    matches,
    matchedCount: matches.filter((m) => m.matched).length,
    goldenCount: goldenVariants.length,
    extractedCount: extracted.length,
    countMatch: extracted.length === goldenVariants.length,
    reconciledVariants: extracted,
  };
}
