import { OVERALL_WEIGHTS, SCORE_ENGINE_VERSION } from "./scoreWeights.js";
import {
  clampScore,
  weightedAverage,
  scoreToGrade,
} from "./scoreNormalization.js";
import { buildVehicleBreakdown } from "./scoreBreakdown.js";
import { buildScoreExplanation } from "./scoreExplanations.js";
import {
  scoreVariants,
  enrichSignalsFromVariants,
} from "./variantScoring.js";

/**
 * Compute overall composite from breakdown dimension scores.
 * @param {object} breakdown
 * @returns {number|null}
 */
export function computeOverallScore(breakdown) {
  const components = {};
  for (const key of Object.keys(OVERALL_WEIGHTS)) {
    components[key] = breakdown[key]?.score ?? null;
  }
  return weightedAverage(components, OVERALL_WEIGHTS);
}

/**
 * Score a vehicle from normalized signals + optional variants.
 * @param {object} signals
 * @param {object} options
 * @returns {object}
 */
export function scoreVehicleFromSignals(signals, options = {}) {
  const variants = options.variants || signals.variants || [];
  const enriched = enrichSignalsFromVariants(variants, signals);
  const breakdown = buildVehicleBreakdown(enriched);
  const overallScore = computeOverallScore(breakdown);
  const grade = scoreToGrade(overallScore);
  const explanation = buildScoreExplanation(breakdown, overallScore);
  const variantsResult = scoreVariants(variants, enriched);

  const coreScoreCount = Object.keys(OVERALL_WEIGHTS).filter(
    (k) => breakdown[k]?.score != null
  ).length;

  return {
    version: SCORE_ENGINE_VERSION,
    overall: {
      score: overallScore,
      grade,
    },
    breakdown: Object.fromEntries(
      Object.entries(breakdown).map(([key, row]) => [
        key,
        {
          score: row.score,
          signals: row.signals,
          explanation: explanation.dimensionExplanations[key] || null,
        },
      ])
    ),
    explanation: {
      summary: explanation.summary,
      strengths: explanation.strengths,
      weaknesses: explanation.weaknesses,
      increases: explanation.increases,
      decreases: explanation.decreases,
    },
    variants: variantsResult,
    hasData: coreScoreCount >= 3 || overallScore != null,
    dataCoverage: {
      dimensionsPresent: coreScoreCount,
      dimensionsTotal: Object.keys(OVERALL_WEIGHTS).length,
      variantCount: variants.length,
    },
  };
}
