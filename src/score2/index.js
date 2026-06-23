/**
 * EVSavari Score 2.0 — Renaissance foundation (Phase 14A.1).
 *
 * This module defines the architecture for decision-oriented vehicle guidance.
 * It is intentionally separate from legacy scoring (`src/scoring/`) and EV
 * Intelligence (`src/intelligence/`). Nothing here is wired into UI yet.
 *
 * ---
 * Four independent layers
 * ---
 *
 * **Score** (`EvSavariScore`)
 * Qualitative tiers across overall, ownership, charging, highway, family, service, and value.
 * Scores answer "how capable is this EV for this concern?" — they are not ratings.
 * No stars, percentages, 10-point scales, or rank ordinals.
 *
 * **Recommendation** (`RecommendationProfile`)
 * Persona-fit guidance for city, family, highway, budget, and premium buyers.
 * Answers "should someone with this intent shortlist this vehicle?"
 * Independent from score tiers — a strong highway score does not auto-set highwayBuyer.
 *
 * **Confidence** (`ConfidenceProfile`)
 * Trust labels (`verified`, `editorial`, `estimated`) per score dimension.
 * Answers "how much should I trust this guidance?"
 * Separate from both score magnitude and recommendation fit.
 *
 * **Explanation** (`ScoreExplanation`)
 * Narrative strengths, weaknesses, bestFor, avoidIf, and summary copy.
 * Answers "why?" — derived from score and recommendation layers but stored distinctly
 * so editorial tone can evolve without rewriting underlying tiers.
 *
 * ---
 * Composition
 * ---
 *
 * `VehicleScoreProfile` bundles all four layers for one catalog vehicle family.
 * Use `getVehicleScoreProfile()` / `listVehicleScoreProfiles()` to read profiles
 * once the registry is populated in later phases.
 *
 * @module score2
 */

export {
  SCORE_TIERS,
  RECOMMENDATION_FIT,
  CONFIDENCE_LEVELS,
  SCORE_DIMENSIONS,
  RECOMMENDATION_PERSONAS,
  CONFIDENCE_DIMENSIONS,
  EXPLANATION_LIST_FIELDS,
  SCORE2_MODULE_VERSION,
  SCORE2_REGISTRY_STATUS,
} from "./constants.js";

export {
  getVehicleScoreProfile,
  listVehicleScoreProfiles,
} from "./scoreRegistry.js";

export { getVehicleScoreProfileAsync } from "./getVehicleScoreProfileAsync.js";

export { buildVehicleScoreProfile } from "./buildVehicleScoreProfile.js";
export { loadIntelligenceCarForSlug } from "./loadIntelligenceCar.js";
export { applyCalibration, FAMILY_GOOD_MINIMUM_SLUGS, isMicroEv } from "./calibrationRules.js";
export { enrichProfileExplanation } from "./enrichProfileExplanation.js";
export {
  buildStrengths,
  buildWeaknesses,
  buildBestFor,
  buildAvoidIf,
  buildSummary,
} from "./explanationBuilders.js";
export { buildNarrativeSummary } from "./buildNarrativeSummary.js";
export { buildPersonaNarratives } from "./buildPersonaNarratives.js";
export { buildConfidenceNarratives } from "./buildConfidenceNarratives.js";
