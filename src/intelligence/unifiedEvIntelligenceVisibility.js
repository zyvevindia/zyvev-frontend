import { buildRecommendationEngine } from "../intelligence/buildRecommendationEngine.js";
import { buildScoreExplanation } from "../intelligence/buildScoreExplanation.js";
import { buildPersonas } from "../intelligence/buildPersonas.js";
import { buildEvSavariVerdict } from "../intelligence/buildEvSavariVerdict.js";
import { buildOwnershipCostScore } from "../intelligence/buildOwnershipCostScore.js";
import { buildChargingPracticalityScore } from "../intelligence/buildChargingPracticalityScore.js";
import { buildHighwayConfidenceScore } from "../intelligence/buildHighwayConfidenceScore.js";
import { buildFamilyScore } from "../intelligence/buildFamilyScore.js";
import { buildServiceNetworkScore } from "../intelligence/buildServiceNetworkScore.js";
import { hasEvIntelligenceScore } from "../components/car/EvIntelligenceScorePanel.jsx";

function hasBestFor(vehicle) {
  return (buildRecommendationEngine(vehicle).bestFor || []).length > 0;
}

function hasPersonas(vehicle) {
  return (buildPersonas(vehicle).personas || []).length > 0;
}

function hasStrengths(vehicle) {
  return (buildScoreExplanation(vehicle).strengths || []).length > 0;
}

function hasWeaknesses(vehicle) {
  return (buildScoreExplanation(vehicle).weaknesses || []).length > 0;
}

function hasAvoidFor(vehicle) {
  return (buildRecommendationEngine(vehicle).avoidFor || []).length > 0;
}

/** Whether UnifiedEvIntelligenceSection has advisor cards beyond the score panel. */
export function vehicleHasUnifiedEvIntelligenceCards(vehicle) {
  if (!vehicle) return false;

  const verdict = buildEvSavariVerdict(vehicle);

  return (
    hasBestFor(vehicle) ||
    hasPersonas(vehicle) ||
    hasStrengths(vehicle) ||
    hasWeaknesses(vehicle) ||
    hasAvoidFor(vehicle) ||
    Boolean(buildOwnershipCostScore(vehicle)) ||
    Boolean(buildChargingPracticalityScore(vehicle)) ||
    Boolean(buildHighwayConfidenceScore(vehicle)) ||
    Boolean(buildFamilyScore(vehicle)) ||
    Boolean(buildServiceNetworkScore(vehicle)) ||
    Boolean(verdict?.headline || verdict?.summary)
  );
}

/** Whether the unified EV Intelligence block should render (score + cards). */
export function vehicleHasUnifiedEvIntelligence(vehicle, evSavariScores = null) {
  if (!vehicle) return false;
  return (
    hasEvIntelligenceScore(vehicle, evSavariScores) ||
    vehicleHasUnifiedEvIntelligenceCards(vehicle)
  );
}
