/**
 * Structured recommendation explanation for a vehicle.
 */

import { FIT_CONFIDENCE } from "./fitConstants.js";
import { WHO_SHOULD_BUY_LABELS } from "./buildBuyerGuidance.js";

/** @typedef {import("./buildBuyerRecommendationProfile.js").BuyerRecommendationProfile} BuyerRecommendationProfile */
/** @typedef {import("./selectTopArchetypes.js").TopArchetypeSelection} TopArchetypeSelection */

/**
 * @typedef {{
 *   primaryRecommendation: string,
 *   supportingReasons: string[],
 *   tradeOffs: string[],
 *   confidenceStatement: string,
 * }} RecommendationExplanation
 */

/**
 * @param {string[]} phrases
 * @returns {string[]}
 */
function dedupePhrases(phrases = []) {
  const seen = new Set();
  const result = [];

  for (const phrase of phrases) {
    const cleaned = String(phrase || "").trim();
    if (!cleaned) continue;
    const key = cleaned.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(cleaned);
  }

  return result;
}

/**
 * @param {TopArchetypeSelection} selection
 * @returns {string}
 */
function buildPrimaryRecommendation(selection) {
  if (selection.topFits.length >= 2) {
    const labels = selection.topFits.slice(0, 2).map(
      (fit) =>
        WHO_SHOULD_BUY_LABELS[fit.archetypeId]?.toLowerCase() ||
        fit.title.toLowerCase()
    );

    return `Strong choice for ${labels[0]} and ${labels[1]}.`;
  }

  if (selection.topFits.length === 1) {
    const fit = selection.topFits[0];
    const headline = fit.profile?.headline || "";
    if (headline) {
      return headline.endsWith(".") ? headline : `${headline}.`;
    }

    const label =
      WHO_SHOULD_BUY_LABELS[fit.archetypeId]?.toLowerCase() ||
      fit.title.toLowerCase();

    return `Strong choice for ${label}.`;
  }

  if (selection.secondaryFits.length) {
    return `Workable option for ${selection.secondaryFits[0].title.toLowerCase()}.`;
  }

  return "Consider alternatives that better match your daily usage.";
}

/**
 * @param {BuyerRecommendationProfile[]} profiles
 * @param {TopArchetypeSelection} selection
 * @returns {string[]}
 */
function buildSupportingReasons(profiles, selection) {
  const phrases = [];

  for (const fit of selection.topFits) {
    phrases.push(...(fit.profile.whyItFits || []));
  }

  if (phrases.length < 2) {
    for (const fit of selection.secondaryFits.slice(0, 2)) {
      phrases.push(...(fit.profile.whyItFits || []).slice(0, 2));
    }
  }

  if (!phrases.length) {
    for (const profile of profiles) {
      phrases.push(...(profile.whyItFits || []).slice(0, 2));
    }
  }

  return dedupePhrases(phrases).slice(0, 4);
}

/**
 * @param {BuyerRecommendationProfile[]} profiles
 * @param {TopArchetypeSelection} selection
 * @returns {string[]}
 */
function buildTradeOffs(profiles, selection) {
  const phrases = [];

  for (const fit of selection.weakFits) {
    phrases.push(...(fit.profile.considerations || []));
  }

  for (const profile of profiles) {
    if (
      selection.weakFits.some((fit) => fit.archetypeId === profile.archetypeId)
    ) {
      continue;
    }

    for (const caution of profile.considerations || []) {
      if (/premium|highway|long-distance|purchase price|family/i.test(caution)) {
        phrases.push(caution);
      }
    }
  }

  return dedupePhrases(phrases).slice(0, 3);
}

/**
 * @param {BuyerRecommendationProfile[]} profiles
 * @returns {string}
 */
function buildConfidenceStatement(profiles) {
  const levels = profiles.map((profile) => profile.confidence);
  const lowCount = levels.filter((level) => level === FIT_CONFIDENCE.LOW).length;
  const highCount = levels.filter((level) => level === FIT_CONFIDENCE.HIGH).length;

  if (highCount >= Math.ceil(profiles.length * 0.6)) {
    return "Recommendation confidence is high because most supporting dimensions are verified or strongly supported.";
  }

  if (lowCount >= Math.ceil(profiles.length * 0.5)) {
    return "Recommendation confidence is low because several supporting dimensions rely on estimated values.";
  }

  return "Recommendation confidence is medium because some ownership dimensions rely on estimated values.";
}

/**
 * @param {BuyerRecommendationProfile[]} profiles
 * @param {TopArchetypeSelection} selection
 * @param {import("../score2/types.js").VehicleScoreProfile|null|undefined} [scoreProfile]
 * @param {object|null|undefined} [intelligenceCar]
 * @returns {RecommendationExplanation}
 */
export function buildRecommendationExplanation(
  profiles = [],
  selection,
  scoreProfile = null,
  intelligenceCar = null
) {
  void scoreProfile;
  void intelligenceCar;

  return {
    primaryRecommendation: buildPrimaryRecommendation(selection),
    supportingReasons: buildSupportingReasons(profiles, selection),
    tradeOffs: buildTradeOffs(profiles, selection),
    confidenceStatement: buildConfidenceStatement(profiles),
  };
}
