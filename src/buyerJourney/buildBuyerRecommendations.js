/**
 * Buyer recommendation engine.
 *
 * Reads recommendation profiles and archetype fits read-only.
 * Uses compare intelligence for contextual alternatives — no rankings.
 */

import { TIER1_MODEL_FAMILY_SLUGS } from "../data/tier1ModelFamilies.js";
import { getVehicleRecommendationProfiles } from "../recommendations/recommendationProfileRegistry.js";
import { getArchetypeFit } from "../recommendations/fitRegistry.js";
import { getBuyerArchetype } from "../recommendations/archetypeRegistry.js";
import { BUYER_ARCHETYPE_IDS } from "../recommendations/constants.js";
import { FIT_TIERS } from "../recommendations/fitConstants.js";
import { profileKeyForArchetypeId } from "../recommendations/buildVehicleRecommendationProfiles.js";
import { loadIntelligenceCarForSlug } from "../score2/loadIntelligenceCar.js";
import { getVehicleScoreProfile } from "../score2/scoreRegistry.js";
import { tierRank } from "../score2/scoreTierMapping.js";
import { resolveVehicleName } from "../compareIntelligence/resolveVehicleName.js";
import { getVehicleComparisonProfile } from "../compareIntelligence/comparisonRegistry.js";
import {
  BUDGET_RANGES,
  BUYER_PRIORITIES,
  FAMILY_SIZES,
  USAGE_PATTERNS,
} from "./constants.js";
import {
  resolveAnchorArchetype,
  resolveBuyerArchetypes,
} from "./resolveBuyerArchetypes.js";

/** @typedef {import("./types.js").BuyerJourneyInput} BuyerJourneyInput */
/** @typedef {import("./types.js").BuyerRecommendationBuckets} BuyerRecommendationBuckets */
/** @typedef {import("./types.js").BuyerJourneyVehicleMatch} BuyerJourneyVehicleMatch */
/** @typedef {import("../recommendations/fitConstants.js").FitTier} FitTier */

/**
 * @param {FitTier|null|undefined} left
 * @param {FitTier|null|undefined} right
 * @returns {FitTier}
 */
function maxTier(left, right) {
  if (!left) return right || FIT_TIERS.INSUFFICIENT;
  if (!right) return left;
  return tierRank(left) >= tierRank(right) ? left : right;
}

/**
 * @param {FitTier|null|undefined} left
 * @param {FitTier|null|undefined} right
 * @returns {FitTier}
 */
function minTier(left, right) {
  if (!left) return right || FIT_TIERS.INSUFFICIENT;
  if (!right) return left;
  return tierRank(left) <= tierRank(right) ? left : right;
}

/**
 * @param {FitTier|null|undefined} tier
 * @param {FitTier} floor
 * @returns {boolean}
 */
function isAtLeast(tier, floor) {
  return tierRank(tier || FIT_TIERS.INSUFFICIENT) >= tierRank(floor);
}

/**
 * @param {FitTier|null|undefined} tier
 * @returns {boolean}
 */
function isLimitedOrInsufficient(tier) {
  return tierRank(tier || FIT_TIERS.INSUFFICIENT) <= tierRank(FIT_TIERS.LIMITED);
}

/**
 * @param {string} slug
 * @returns {string}
 */
function vehicleNameForSlug(slug) {
  const scoreProfile = getVehicleScoreProfile(slug);
  const intelligence = loadIntelligenceCarForSlug(slug);
  return resolveVehicleName(
    slug,
    scoreProfile,
    intelligence?.intelligenceCar || null
  );
}

/**
 * @param {string} slug
 * @param {string[]} archetypeIds
 * @returns {{ tiers: FitTier[], matchedArchetypeIds: string[] }}
 */
function collectArchetypeFits(slug, archetypeIds = []) {
  /** @type {FitTier[]} */
  const tiers = [];
  /** @type {string[]} */
  const matchedArchetypeIds = [];

  for (const archetypeId of archetypeIds) {
    const fit = getArchetypeFit(archetypeId, slug);
    if (!fit) continue;
    tiers.push(fit.fitTier);
    matchedArchetypeIds.push(archetypeId);
  }

  return { tiers, matchedArchetypeIds };
}

/**
 * @param {string} slug
 * @param {import("./types.js").BuyerJourneyInput} input
 * @param {string[]} primaryArchetypes
 * @param {string} anchorArchetypeId
 * @returns {boolean}
 */
function passesTopFitAlignment(slug, input, primaryArchetypes, anchorArchetypeId) {
  const bundle = getVehicleRecommendationProfiles(slug);
  if (!bundle?.topFits?.length) return false;

  const topTitles = bundle.topFits.map((fit) => fit.title);
  const anchorTitle = getBuyerArchetype(anchorArchetypeId)?.title;

  if (!anchorTitle || !topTitles.includes(anchorTitle)) {
    return false;
  }

  if (input.usagePattern === USAGE_PATTERNS.CITY) {
    return (
      topTitles.includes("City Commuter") && topTitles.includes("Budget Buyer")
    );
  }

  if (
    input.usagePattern === USAGE_PATTERNS.MIXED &&
    (input.familySize === FAMILY_SIZES.FAMILY ||
      input.familySize === FAMILY_SIZES.LARGE_FAMILY)
  ) {
    return (
      topTitles.includes("Family Buyer") &&
      topTitles.includes("Highway Traveller")
    );
  }

  if (
    input.usagePattern === USAGE_PATTERNS.HIGHWAY &&
    input.priority === BUYER_PRIORITIES.PREMIUM_EXPERIENCE
  ) {
    return (
      topTitles.includes("Premium Buyer") &&
      bundle.weakFits.some((fit) => fit.title === "Budget Buyer")
    );
  }

  const primaryTitles = primaryArchetypes
    .map((archetypeId) => getBuyerArchetype(archetypeId)?.title)
    .filter(Boolean);

  return primaryTitles.some((title) => topTitles.includes(title));
}

/**
 * @param {string} slug
 * @param {import("./types.js").BuyerJourneyInput} input
 * @returns {boolean}
 */
function passesBudgetBandGate(slug, input) {
  const budgetFit = getArchetypeFit(BUYER_ARCHETYPE_IDS.BUDGET_BUYER, slug);
  const premiumFit = getArchetypeFit(BUYER_ARCHETYPE_IDS.PREMIUM_BUYER, slug);

  if (input.budgetRange === BUDGET_RANGES.RANGE_10_15L) {
    return isAtLeast(budgetFit?.fitTier, FIT_TIERS.GOOD);
  }

  if (input.budgetRange === BUDGET_RANGES.RANGE_15_20L) {
    return (
      isAtLeast(budgetFit?.fitTier, FIT_TIERS.MODERATE) &&
      isLimitedOrInsufficient(premiumFit?.fitTier)
    );
  }

  if (input.budgetRange === BUDGET_RANGES.RANGE_30L_PLUS) {
    return isAtLeast(premiumFit?.fitTier, FIT_TIERS.GOOD);
  }

  return true;
}

/**
 * @param {string} slug
 * @param {string} anchorArchetypeId
 * @param {string[]} strongMatchSlugs
 * @returns {boolean}
 */
function isContextualAlternative(slug, anchorArchetypeId, strongMatchSlugs = []) {
  if (!strongMatchSlugs.length) return false;

  for (const strongSlug of strongMatchSlugs) {
    const comparison = getVehicleComparisonProfile(strongSlug, slug);
    if (!comparison) continue;

    const anchorOutcome = comparison.archetypeComparisons.find(
      (outcome) => outcome.archetypeId === anchorArchetypeId
    );

    if (
      anchorOutcome &&
      anchorOutcome.preferredVehicle !== "tie" &&
      (anchorOutcome.preferredVehicle === comparison.secondaryVehicle.name ||
        anchorOutcome.preferredVehicle === comparison.secondaryVehicle.slug)
    ) {
      return true;
    }
  }

  return false;
}

/**
 * @param {BuyerJourneyVehicleMatch} left
 * @param {BuyerJourneyVehicleMatch} right
 * @returns {number}
 */
function compareMatchesAlphabetically(left, right) {
  return left.vehicleName.localeCompare(right.vehicleName, "en", {
    sensitivity: "base",
  });
}

/**
 * @param {{
 *   slug: string,
 *   input: BuyerJourneyInput,
 *   primaryArchetypes: string[],
 *   secondaryArchetypes: string[],
 *   anchorArchetypeId: string,
 *   strongMatchSlugs?: string[],
 * }} params
 * @returns {{ bucket: keyof BuyerRecommendationBuckets, match: BuyerJourneyVehicleMatch|null }}
 */
function classifyVehicle({
  slug,
  input,
  primaryArchetypes,
  secondaryArchetypes,
  anchorArchetypeId,
  strongMatchSlugs = [],
}) {
  const scoreProfile = getVehicleScoreProfile(slug);
  if (!scoreProfile) {
    return { bucket: "weakFits", match: null };
  }

  const primary = collectArchetypeFits(slug, primaryArchetypes);
  const secondary = collectArchetypeFits(slug, secondaryArchetypes);
  const anchorFit = getArchetypeFit(anchorArchetypeId, slug);

  if (!anchorFit || !primary.tiers.length) {
    return { bucket: "weakFits", match: null };
  }

  const bestPrimary = primary.tiers.reduce(maxTier);
  const worstPrimary = primary.tiers.reduce(minTier);
  const bestSecondary = secondary.tiers.reduce(
    (acc, tier) => maxTier(acc, tier),
    FIT_TIERS.INSUFFICIENT
  );

  /** @type {BuyerJourneyVehicleMatch} */
  const match = {
    vehicleSlug: slug,
    vehicleName: vehicleNameForSlug(slug),
    anchorFitTier: anchorFit.fitTier,
    anchorArchetypeId,
    matchedArchetypeIds: [
      ...new Set([...primary.matchedArchetypeIds, ...secondary.matchedArchetypeIds]),
    ],
  };

  if (
    isAtLeast(anchorFit.fitTier, FIT_TIERS.GOOD) &&
    isAtLeast(bestPrimary, FIT_TIERS.GOOD) &&
    !isLimitedOrInsufficient(worstPrimary) &&
    passesTopFitAlignment(slug, input, primaryArchetypes, anchorArchetypeId) &&
    passesBudgetBandGate(slug, input)
  ) {
    return { bucket: "strongMatches", match };
  }

  if (
    (isAtLeast(anchorFit.fitTier, FIT_TIERS.MODERATE) ||
      isAtLeast(bestPrimary, FIT_TIERS.MODERATE)) &&
    passesBudgetBandGate(slug, input)
  ) {
    return { bucket: "goodAlternatives", match };
  }

  if (
    isAtLeast(bestSecondary, FIT_TIERS.MODERATE) ||
    isContextualAlternative(slug, anchorArchetypeId, strongMatchSlugs)
  ) {
    return { bucket: "worthConsidering", match };
  }

  if (
    isLimitedOrInsufficient(anchorFit.fitTier) &&
    isLimitedOrInsufficient(bestPrimary) &&
    isLimitedOrInsufficient(bestSecondary)
  ) {
    return { bucket: "weakFits", match };
  }

  if (isLimitedOrInsufficient(anchorFit.fitTier)) {
    return { bucket: "weakFits", match };
  }

  return { bucket: "worthConsidering", match };
}

/**
 * @param {BuyerJourneyInput} input
 * @returns {BuyerRecommendationBuckets}
 */
export function buildBuyerRecommendations(input) {
  const resolved = resolveBuyerArchetypes(input);
  const anchorArchetypeId = resolveAnchorArchetype(
    input,
    resolved.primaryArchetypes
  );

  /** @type {BuyerRecommendationBuckets} */
  const buckets = {
    strongMatches: [],
    goodAlternatives: [],
    worthConsidering: [],
    weakFits: [],
  };

  /** @type {string[]} */
  const strongMatchSlugs = [];

  for (const slug of TIER1_MODEL_FAMILY_SLUGS) {
    const firstPass = classifyVehicle({
      slug,
      input,
      primaryArchetypes: resolved.primaryArchetypes,
      secondaryArchetypes: resolved.secondaryArchetypes,
      anchorArchetypeId,
    });

    if (firstPass.bucket === "strongMatches" && firstPass.match) {
      strongMatchSlugs.push(slug);
    }
  }

  for (const slug of TIER1_MODEL_FAMILY_SLUGS) {
    const result = classifyVehicle({
      slug,
      input,
      primaryArchetypes: resolved.primaryArchetypes,
      secondaryArchetypes: resolved.secondaryArchetypes,
      anchorArchetypeId,
      strongMatchSlugs,
    });

    if (!result.match) continue;
    buckets[result.bucket].push(result.match);
  }

  buckets.strongMatches.sort(compareMatchesAlphabetically);
  buckets.goodAlternatives.sort(compareMatchesAlphabetically);
  buckets.worthConsidering.sort(compareMatchesAlphabetically);
  buckets.weakFits.sort(compareMatchesAlphabetically);

  return buckets;
}

/**
 * @param {string} slug
 * @param {string} archetypeId
 * @returns {import("../recommendations/buildBuyerRecommendationProfile.js").BuyerRecommendationProfile|null}
 */
export function getRecommendationProfileForArchetype(slug, archetypeId) {
  const bundle = getVehicleRecommendationProfiles(slug);
  if (!bundle?.profiles) return null;

  const profileKey = profileKeyForArchetypeId(archetypeId);
  if (!profileKey) return null;

  return bundle.profiles[profileKey] || null;
}
