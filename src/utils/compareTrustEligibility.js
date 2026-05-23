/**
 * When to show recommendation-doubt affordance — avoid over-triggering.
 */

import { buildCompareScoreInsight } from "./compareConfidence.js";
import {
  scoreRecommendationMaturity,
  RECOMMENDATION_MATURITY_STATUS,
} from "../ops/recommendationMaturityOps.js";

const MATURE_STATUSES = new Set([
  RECOMMENDATION_MATURITY_STATUS.MATURE,
  RECOMMENDATION_MATURITY_STATUS.TRUSTED,
]);

/**
 * @param {object} recommended — highlighted compare vehicle
 */
export function shouldShowRecommendationDoubt(recommended) {
  if (!recommended) return false;

  const maturity = scoreRecommendationMaturity(recommended);
  const insight = buildCompareScoreInsight(recommended);

  const maturityBelowMature = !MATURE_STATUSES.has(maturity.status);
  const confidenceNotHigh = insight.confidence !== "high";
  const volatilityElevated = (maturity.trustVolatility ?? 0) >= 40;

  if (!maturityBelowMature && !confidenceNotHigh && !volatilityElevated) {
    return false;
  }

  return maturityBelowMature || confidenceNotHigh || volatilityElevated;
}
