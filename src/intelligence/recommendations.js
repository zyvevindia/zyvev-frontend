import { enrichFamiliesWithIntelligence } from "./familyIntelligence.js";
import { getBestForLabel } from "./scoringEngine.js";
import { isPresent } from "./governance.js";

/**
 * @typedef {object} RecommendationPriorities
 * @property {number} [city] 0-5
 * @property {number} [highway] 0-5
 * @property {number} [family] 0-5
 * @property {number} [charging] 0-5
 * @property {number} [budget] 0-5
 * @property {number} [performance] 0-5
 */

const PRIORITY_KEYS = [
  "city",
  "highway",
  "family",
  "charging",
  "budget",
  "performance",
];

/**
 * Rule-based recommendation — transparent weighted scoring.
 * @param {object[]} families — model family DTOs
 * @param {RecommendationPriorities} priorities
 * @param {{ limit?: number }} [opts]
 */
export function recommendFamilies(families, priorities = {}, opts = {}) {
  const limit = opts.limit ?? 5;
  const weights = normalizePriorities(priorities);
  const enriched = enrichFamiliesWithIntelligence(families);

  const scored = enriched
    .map((family) => {
      const result = scoreFamilyForPriorities(family, weights);
      if (result.score <= 0 && !result.hasSignal) return null;
      return {
        family,
        score: result.score,
        reasons: result.reasons,
        tradeoffs: result.tradeoffs,
        bestFor: getBestForLabel(family.evScores),
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit);
}

function normalizePriorities(priorities) {
  const out = {};
  let total = 0;
  for (const key of PRIORITY_KEYS) {
    const v = Math.max(0, Math.min(5, Number(priorities[key]) || 0));
    out[key] = v;
    total += v;
  }
  if (total === 0) {
    out.city = 3;
    out.budget = 2;
    total = 5;
  }
  for (const key of PRIORITY_KEYS) {
    out[key] = out[key] / total;
  }
  return out;
}

function scoreFamilyForPriorities(family, weights) {
  const sub = family.evScores?.subScores || {};
  const reasons = [];
  const tradeoffs = [];
  let score = 0;
  let hasSignal = false;

  if (weights.city > 0 && isPresent(sub.cityUsability)) {
    score += sub.cityUsability * weights.city;
    hasSignal = true;
    if (sub.cityUsability >= 75) {
      reasons.push("Strong city commuting score");
    }
  }

  if (weights.highway > 0 && isPresent(sub.highwayUsability)) {
    score += sub.highwayUsability * weights.highway;
    hasSignal = true;
    if (sub.highwayUsability >= 75) {
      reasons.push("Comfortable for highway legs");
    } else if (sub.highwayUsability < 55) {
      tradeoffs.push("Highway trips may need more charging stops");
    }
  }

  if (weights.family > 0 && isPresent(sub.practicality)) {
    score += sub.practicality * weights.family;
    hasSignal = true;
    if (sub.practicality >= 72) {
      reasons.push("Good family practicality signals");
    }
  }

  if (weights.charging > 0 && isPresent(sub.chargingConvenience)) {
    score += sub.chargingConvenience * weights.charging;
    hasSignal = true;
    if (sub.chargingConvenience >= 78) {
      reasons.push("Convenient charging profile");
    }
  }

  if (weights.budget > 0 && isPresent(sub.ownershipAffordability)) {
    score += sub.ownershipAffordability * weights.budget;
    hasSignal = true;
    if (sub.ownershipAffordability >= 75) {
      reasons.push("Indicative ownership costs are competitive");
    }
  }

  if (weights.performance > 0) {
    const highway = sub.highwayUsability ?? 0;
    const tech = sub.technologyFeatures ?? 0;
    const perfBlend = (highway + tech) / 2;
    if (perfBlend > 0) {
      score += perfBlend * weights.performance;
      hasSignal = true;
    }
  }

  const catalog = family.catalogMeta?.compareValueScore;
  if (isPresent(catalog)) {
    score += Number(catalog) * 0.05;
    hasSignal = true;
  }

  if (!reasons.length && family.evScores?.composite != null) {
    reasons.push(
      `Balanced EVSavari composite score (${family.evScores.composite}/100)`
    );
  }

  return {
    score: Math.round(score * 10) / 10,
    reasons: reasons.slice(0, 3),
    tradeoffs: tradeoffs.slice(0, 2),
    hasSignal,
  };
}

export const DEFAULT_RECOMMENDATION_PRIORITIES = Object.freeze({
  city: 4,
  highway: 2,
  family: 2,
  charging: 3,
  budget: 3,
  performance: 1,
});
