/**
 * Build assistant recommendations from buyer journey output.
 *
 * Read-only consumption of Buyer Journey, Score 2.0, and Compare Intelligence.
 */

import { getVehicleComparisonProfile } from "../compareIntelligence/comparisonRegistry.js";
import { selectAssistantHeadline } from "./buildHeadlineVariations.js";
import { selectAssistantSummary } from "./buildSummaryVariations.js";
import { buildAssistantComparePairSlug } from "./comparePairSlug.js";

/** @typedef {import("./types.js").AssistantRecommendation} AssistantRecommendation */
/** @typedef {import("../buyerJourney/types.js").BuyerJourneyResult} BuyerJourneyResult */
/** @typedef {import("../buyerJourney/types.js").BuyerJourneyVehicleMatch} BuyerJourneyVehicleMatch */

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
 * @param {BuyerJourneyVehicleMatch} match
 * @param {string} baseHeadline
 * @param {string} baseSummary
 * @returns {{ headline: string, summary: string }}
 */
function applyNarrativeVariations(match, baseHeadline, baseSummary) {
  const archetypeId = match.anchorArchetypeId || "";
  const fitTier = match.anchorFitTier || "";

  return {
    headline: selectAssistantHeadline({
      vehicleSlug: match.vehicleSlug,
      archetypeId,
      fitTier,
      fallback: baseHeadline,
    }),
    summary: selectAssistantSummary({
      vehicleSlug: match.vehicleSlug,
      archetypeId,
      fitTier,
      vehicleName: match.vehicleName,
      fallback: baseSummary,
    }),
  };
}

/**
 * @param {BuyerJourneyVehicleMatch} match
 * @param {BuyerJourneyResult} journey
 * @param {"strongMatches"|"goodAlternatives"|"worthConsidering"|"weakFits"} bucket
 * @returns {AssistantRecommendation|null}
 */
function buildRecommendationForMatch(match, journey, bucket) {
  if (!match?.vehicleSlug) return null;

  const explanation = journey.explanations[match.vehicleSlug];
  const whyMatches = dedupeLines([
    ...(explanation?.strengths || []),
    ...(explanation?.summary
      ? [explanation.summary.split(".")[0]?.trim()].filter(Boolean)
      : []),
  ]).slice(0, 4);

  const tradeOffs = dedupeLines(explanation?.tradeOffs || []).slice(0, 3);

  const baseHeadline =
    explanation?.headline ||
    `Relevant ${bucket === "strongMatches" ? "strong" : "alternative"} fit for your brief`;
  const baseSummary =
    explanation?.summary ||
    `${match.vehicleName} aligns with your stated buyer priorities.`;

  const narrative = applyNarrativeVariations(match, baseHeadline, baseSummary);

  return {
    vehicleSlug: match.vehicleSlug,
    vehicleName: match.vehicleName,
    headline: narrative.headline,
    summary: narrative.summary,
    whyMatches,
    tradeOffs,
    confidence: explanation?.confidence || "Medium",
    bucket,
  };
}

/**
 * @param {BuyerJourneyResult|null} journey
 * @returns {AssistantRecommendation[]}
 */
export function buildAssistantRecommendations(journey) {
  if (!journey?.recommendations) return [];

  /** @type {AssistantRecommendation[]} */
  const recommendations = [];

  const bucketEntries = [
    ["strongMatches", journey.recommendations.strongMatches],
    ["goodAlternatives", journey.recommendations.goodAlternatives],
    ["worthConsidering", journey.recommendations.worthConsidering],
    ["weakFits", journey.recommendations.weakFits],
  ];

  for (const [bucket, matches] of bucketEntries) {
    for (const match of matches) {
      const recommendation = buildRecommendationForMatch(
        match,
        journey,
        /** @type {"strongMatches"|"goodAlternatives"|"worthConsidering"|"weakFits"} */ (
          bucket
        )
      );
      if (recommendation) recommendations.push(recommendation);
    }
  }

  const strongSlugs = journey.recommendations.strongMatches
    .slice(0, 2)
    .map((match) => match.vehicleSlug);

  if (strongSlugs.length === 2) {
    const compareSlug = buildAssistantComparePairSlug(
      strongSlugs[0],
      strongSlugs[1]
    );
    const comparison = compareSlug
      ? getVehicleComparisonProfile(strongSlugs[0], strongSlugs[1])
      : null;

    if (comparison?.tradeOffAnalysis?.tradeOffs?.length) {
      for (const recommendation of recommendations.slice(0, 2)) {
        recommendation.tradeOffs = dedupeLines([
          ...recommendation.tradeOffs,
          ...comparison.tradeOffAnalysis.tradeOffs.slice(0, 2),
        ]).slice(0, 4);
      }
    }
  }

  return recommendations;
}

/**
 * @param {BuyerJourneyResult|null} journey
 * @returns {AssistantRecommendation|null}
 */
export function buildPrimaryAssistantRecommendation(journey) {
  const recommendations = buildAssistantRecommendations(journey);
  return recommendations.find((item) => item.bucket === "strongMatches") || recommendations[0] || null;
}

/**
 * @param {BuyerJourneyResult|null} journey
 * @returns {Record<string, AssistantRecommendation[]>}
 */
export function groupAssistantRecommendationsByBucket(journey) {
  const recommendations = buildAssistantRecommendations(journey);

  return {
    strongMatches: recommendations.filter((item) => item.bucket === "strongMatches"),
    goodAlternatives: recommendations.filter(
      (item) => item.bucket === "goodAlternatives"
    ),
    worthConsidering: recommendations.filter(
      (item) => item.bucket === "worthConsidering"
    ),
    weakFits: recommendations.filter((item) => item.bucket === "weakFits"),
  };
}
