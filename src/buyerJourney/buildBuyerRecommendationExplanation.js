/**
 * Buyer recommendation explanations per vehicle.
 *
 * Narratives explain fit — they do not rank vehicles.
 */

import { getVehicleScoreProfile } from "../score2/scoreRegistry.js";
import { loadIntelligenceCarForSlug } from "../score2/loadIntelligenceCar.js";
import { resolveVehicleName } from "../compareIntelligence/resolveVehicleName.js";
import { getRecommendationProfileForArchetype } from "./buildBuyerRecommendations.js";
import { resolveAnchorArchetype } from "./resolveBuyerArchetypes.js";

/** @typedef {import("./types.js").BuyerJourneyInput} BuyerJourneyInput */
/** @typedef {import("./types.js").BuyerRecommendationExplanation} BuyerRecommendationExplanation */
/** @typedef {import("./types.js").BuyerJourneyVehicleMatch} BuyerJourneyVehicleMatch */

/**
 * @param {"high"|"medium"|"low"|null|undefined} confidence
 * @returns {"High"|"Medium"|"Low"}
 */
function formatConfidence(confidence) {
  if (confidence === "high") return "High";
  if (confidence === "low") return "Low";
  return "Medium";
}

/**
 * @param {string[]} lines
 * @returns {string[]}
 */
function dedupeLines(lines = []) {
  const seen = new Set();
  const result = [];

  for (const line of lines) {
    const cleaned = String(line || "").trim();
    if (!cleaned) continue;
    const key = cleaned.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(cleaned);
  }

  return result;
}

/**
 * @param {{
 *   input: BuyerJourneyInput,
 *   match: BuyerJourneyVehicleMatch,
 *   primaryArchetypes?: string[],
 * }} params
 * @returns {BuyerRecommendationExplanation|null}
 */
export function buildBuyerRecommendationExplanation({
  input,
  match,
  primaryArchetypes = [],
}) {
  if (!match?.vehicleSlug) return null;

  const anchorArchetypeId =
    match.anchorArchetypeId ||
    resolveAnchorArchetype(input, primaryArchetypes);

  const profile =
    getRecommendationProfileForArchetype(match.vehicleSlug, anchorArchetypeId) ||
    getRecommendationProfileForArchetype(
      match.vehicleSlug,
      match.matchedArchetypeIds[0]
    );

  const scoreProfile = getVehicleScoreProfile(match.vehicleSlug);
  const intelligence = loadIntelligenceCarForSlug(match.vehicleSlug);
  const vehicleName = resolveVehicleName(
    match.vehicleSlug,
    scoreProfile,
    intelligence?.intelligenceCar || null
  );

  if (!profile) {
    return {
      vehicleSlug: match.vehicleSlug,
      vehicleName,
      headline: "Workable option for this buyer profile.",
      summary: `${vehicleName} may suit some priorities in this journey, with trade-offs to review.`,
      strengths: [],
      tradeOffs: [],
      confidence: "Medium",
    };
  }

  /** @type {string[]} */
  const strengths = dedupeLines(profile.whyItFits).slice(0, 4);
  /** @type {string[]} */
  const tradeOffs = dedupeLines(profile.considerations).slice(0, 3);

  if (!strengths.length && scoreProfile?.explanation?.strengths?.length) {
    strengths.push(...scoreProfile.explanation.strengths.slice(0, 3));
  }

  if (!tradeOffs.length && scoreProfile?.explanation?.weaknesses?.length) {
    tradeOffs.push(...scoreProfile.explanation.weaknesses.slice(0, 2));
  }

  return {
    vehicleSlug: match.vehicleSlug,
    vehicleName,
    headline: profile.headline,
    summary: profile.summary,
    strengths,
    tradeOffs,
    confidence: formatConfidence(profile.confidence),
  };
}

/**
 * @param {{
 *   input: BuyerJourneyInput,
 *   matches: BuyerJourneyVehicleMatch[],
 *   primaryArchetypes?: string[],
 * }} params
 * @returns {Record<string, BuyerRecommendationExplanation>}
 */
export function buildBuyerRecommendationExplanations({
  input,
  matches = [],
  primaryArchetypes = [],
}) {
  /** @type {Record<string, BuyerRecommendationExplanation>} */
  const explanations = {};

  for (const match of matches) {
    const explanation = buildBuyerRecommendationExplanation({
      input,
      match,
      primaryArchetypes,
    });
    if (explanation) {
      explanations[match.vehicleSlug] = explanation;
    }
  }

  return explanations;
}
