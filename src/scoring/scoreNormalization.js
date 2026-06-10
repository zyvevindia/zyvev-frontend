import { GRADE_THRESHOLDS, MARKET_BENCHMARKS } from "./scoreWeights.js";

const MIN_SCORE = 0;
const MAX_SCORE = 100;

/**
 * Clamp and round to integer 0–100.
 * @param {number|null|undefined} value
 * @returns {number|null}
 */
export function clampScore(value) {
  if (value == null || !Number.isFinite(Number(value))) return null;
  return Math.round(Math.min(MAX_SCORE, Math.max(MIN_SCORE, Number(value))));
}

/**
 * Linear normalize value into 0–100 using benchmark min/max.
 * @param {number|null|undefined} value
 * @param {string} benchmarkKey
 * @returns {number|null}
 */
export function normalizeToScore(value, benchmarkKey) {
  if (value == null || !Number.isFinite(Number(value))) return null;
  const bench = MARKET_BENCHMARKS[benchmarkKey];
  if (!bench) return null;

  const num = Number(value);
  const { min, max, invert } = bench;
  if (!Number.isFinite(min) || !Number.isFinite(max) || max <= min) return null;

  let ratio = (num - min) / (max - min);
  ratio = Math.min(1, Math.max(0, ratio));
  if (invert) ratio = 1 - ratio;

  return clampScore(ratio * 100);
}

/**
 * Weighted average of present scores (re-normalizes weights).
 * @param {Record<string, number|null|undefined>} components
 * @param {Record<string, number>} weights
 * @returns {number|null}
 */
export function weightedAverage(components, weights) {
  let totalWeight = 0;
  let weighted = 0;

  for (const [key, weight] of Object.entries(weights)) {
    const val = components[key];
    if (val == null || !Number.isFinite(val)) continue;
    weighted += val * weight;
    totalWeight += weight;
  }

  if (totalWeight <= 0) return null;
  return clampScore(weighted / totalWeight);
}

/**
 * Simple average of present numeric values.
 * @param {Array<number|null|undefined>} values
 * @returns {number|null}
 */
export function averagePresent(values) {
  const nums = (values || []).filter(
    (v) => v != null && Number.isFinite(Number(v))
  );
  if (!nums.length) return null;
  return clampScore(nums.reduce((a, b) => a + Number(b), 0) / nums.length);
}

/**
 * Map composite score to letter grade.
 * @param {number|null|undefined} score
 * @returns {string|null}
 */
export function scoreToGrade(score) {
  if (score == null || !Number.isFinite(Number(score))) return null;
  const n = Number(score);
  for (const row of GRADE_THRESHOLDS) {
    if (n >= row.min) return row.grade;
  }
  return "C";
}

/**
 * Compute km/kWh efficiency when range and battery are known.
 * @param {number|null|undefined} rangeKm
 * @param {number|null|undefined} batteryKwh
 * @returns {number|null}
 */
export function computeEfficiencyKmPerKwh(rangeKm, batteryKwh) {
  const range = Number(rangeKm);
  const battery = Number(batteryKwh);
  if (!Number.isFinite(range) || !Number.isFinite(battery) || battery <= 0) {
    return null;
  }
  return range / battery;
}

/**
 * Derive premium positioning score (price tier + capability).
 * @param {object} breakdownScores keyed dimension scores
 * @param {number|null|undefined} startingPrice
 * @returns {number|null}
 */
export function computePremiumScore(breakdownScores, startingPrice) {
  const priceScore = normalizeToScore(startingPrice, "startingPriceInr");
  const invertedPrice =
    priceScore != null ? clampScore(100 - priceScore) : null;

  return weightedAverage(
    {
      priceTier: invertedPrice,
      feature: breakdownScores.feature,
      performance: breakdownScores.performance,
      safety: breakdownScores.safety,
    },
    { priceTier: 0.25, feature: 0.3, performance: 0.25, safety: 0.2 }
  );
}

/**
 * Derive budget EV score (value + low price emphasis).
 * @param {number|null|undefined} valueScore
 * @param {number|null|undefined} startingPrice
 * @returns {number|null}
 */
export function computeBudgetScore(valueScore, startingPrice) {
  const priceScore = normalizeToScore(startingPrice, "startingPriceInr");
  return weightedAverage(
    { value: valueScore, price: priceScore },
    { value: 0.55, price: 0.45 }
  );
}
