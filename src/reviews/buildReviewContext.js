/**
 * Aggregate intelligence signals into a normalized review context.
 */

import {
  buildScoreExplanation,
  buildScoreExplanationContext,
} from "../intelligence/buildScoreExplanation.js";
import { buildRecommendationEngine } from "../intelligence/buildRecommendationEngine.js";
import { buildPersonas } from "../intelligence/buildPersonas.js";
import { buildEvSavariVerdict } from "../intelligence/buildEvSavariVerdict.js";
import { buildOwnershipCostScore } from "../intelligence/buildOwnershipCostScore.js";
import { buildChargingPracticalityScore } from "../intelligence/buildChargingPracticalityScore.js";
import { buildHighwayConfidenceScore } from "../intelligence/buildHighwayConfidenceScore.js";
import { buildFamilyScore } from "../intelligence/buildFamilyScore.js";
import { buildServiceNetworkScore } from "../intelligence/buildServiceNetworkScore.js";
import { normalizeInsightLabels } from "../utils/normalizeInsightLabels.js";
import { REVIEW_LIMITS } from "./constants.js";
import {
  resolveReviewConfidence,
  safeReviewBuild,
} from "./reviewBuilderUtils.js";
import { dedupeReviewItems } from "./reviewTextUtils.js";

/**
 * @typedef {Object} ReviewContext
 * @property {string[]} strengths
 * @property {string[]} weaknesses
 * @property {import("../intelligence/types.js").RecommendationEngineResult|null} recommendation
 * @property {import("../intelligence/types.js").PersonaEngineResult|null} personas
 * @property {import("../intelligence/types.js").OwnershipCostScoreResult|null} ownership
 * @property {import("../intelligence/types.js").ChargingPracticalityScoreResult|null} charging
 * @property {import("../intelligence/types.js").HighwayConfidenceScoreResult|null} highway
 * @property {import("../intelligence/types.js").FamilyScoreResult|null} family
 * @property {import("../intelligence/types.js").ServiceNetworkScoreResult|null} service
 * @property {import("../intelligence/types.js").EvSavariVerdictResult|null} verdict
 * @property {import("./types.js").ReviewConfidence} confidence
 */

const EMPTY_RECOMMENDATION = Object.freeze({ bestFor: [], avoidFor: [] });
const EMPTY_PERSONAS = Object.freeze({ personas: [] });
const EMPTY_VERDICT = Object.freeze({ headline: null, summary: null });

/**
 * @param {object|null|undefined} vehicle
 * @returns {ReviewContext}
 */
export function buildReviewContext(vehicle) {
  if (!vehicle || typeof vehicle !== "object") {
    return {
      strengths: [],
      weaknesses: [],
      recommendation: EMPTY_RECOMMENDATION,
      personas: EMPTY_PERSONAS,
      ownership: null,
      charging: null,
      highway: null,
      family: null,
      service: null,
      verdict: EMPTY_VERDICT,
      confidence: resolveReviewConfidence(vehicle),
    };
  }

  const explanation = safeReviewBuild(() => buildScoreExplanation(vehicle), {
    strengths: [],
    weaknesses: [],
    confidence: "",
  });

  const strengths = dedupeReviewItems(
    normalizeInsightLabels(explanation?.strengths),
    REVIEW_LIMITS.maxPros
  );
  const weaknesses = dedupeReviewItems(
    normalizeInsightLabels(explanation?.weaknesses),
    REVIEW_LIMITS.maxCons
  );

  return {
    strengths,
    weaknesses,
    recommendation: safeReviewBuild(
      () => buildRecommendationEngine(vehicle),
      EMPTY_RECOMMENDATION
    ),
    personas: safeReviewBuild(() => buildPersonas(vehicle), EMPTY_PERSONAS),
    ownership: safeReviewBuild(() => buildOwnershipCostScore(vehicle)),
    charging: safeReviewBuild(() => buildChargingPracticalityScore(vehicle)),
    highway: safeReviewBuild(() => buildHighwayConfidenceScore(vehicle)),
    family: safeReviewBuild(() => buildFamilyScore(vehicle)),
    service: safeReviewBuild(() => buildServiceNetworkScore(vehicle)),
    verdict: safeReviewBuild(() => buildEvSavariVerdict(vehicle), EMPTY_VERDICT),
    confidence: resolveReviewConfidence(vehicle),
  };
}
