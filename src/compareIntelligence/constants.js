/**
 * Compare Intelligence constants.
 *
 * Dimensions and labels are buyer-centric — not specification tables or rankings.
 */

import { BUYER_ARCHETYPE_IDS } from "../recommendations/constants.js";

/** @typedef {import("./types.js").DimensionOutcome} DimensionOutcome */

export const COMPARE_INTELLIGENCE_MODULE_VERSION = "1.0.0-alpha";

export const DIMENSION_OUTCOMES = Object.freeze({
  ADVANTAGE: "advantage",
  TIE: "tie",
  TRADE_OFF: "tradeOff",
});

/**
 * Buyer-centric comparison dimensions.
 *
 * @typedef {"score"|"persona"|"archetypeFit"} ComparisonDimensionKind
 * @typedef {{
 *   key: string,
 *   label: string,
 *   kind: ComparisonDimensionKind,
 *   scoreKey?: string,
 *   personaKey?: string,
 *   archetypeKey?: keyof import("../recommendations/buildVehicleRecommendationProfiles.js").VehicleRecommendationProfileMap,
 *   advantagePhrase: string,
 * }} ComparisonDimensionDef
 */

/** @type {ComparisonDimensionDef[]} */
export const COMPARISON_DIMENSIONS = Object.freeze([
  {
    key: "ownership",
    label: "Ownership economics",
    kind: "score",
    scoreKey: "ownership",
    advantagePhrase: "stronger ownership economics",
  },
  {
    key: "charging",
    label: "Charging practicality",
    kind: "score",
    scoreKey: "charging",
    advantagePhrase: "more practical charging",
  },
  {
    key: "highway",
    label: "Highway capability",
    kind: "score",
    scoreKey: "highway",
    archetypeKey: "highwayTraveller",
    advantagePhrase: "stronger highway capability",
  },
  {
    key: "family",
    label: "Family practicality",
    kind: "score",
    scoreKey: "family",
    archetypeKey: "familyBuyer",
    advantagePhrase: "stronger family practicality",
  },
  {
    key: "service",
    label: "Service support",
    kind: "score",
    scoreKey: "service",
    advantagePhrase: "broader service support",
  },
  {
    key: "value",
    label: "Purchase value",
    kind: "score",
    scoreKey: "value",
    archetypeKey: "budgetBuyer",
    advantagePhrase: "better purchase value",
  },
  {
    key: "premium",
    label: "Premium appeal",
    kind: "persona",
    personaKey: "premiumBuyer",
    archetypeKey: "premiumBuyer",
    advantagePhrase: "stronger premium appeal",
  },
  {
    key: "city",
    label: "City suitability",
    kind: "persona",
    personaKey: "cityBuyer",
    archetypeKey: "cityCommuter",
    advantagePhrase: "stronger city suitability",
  },
]);

/**
 * Archetype comparison uses fit profiles with optional score/persona emphasis.
 *
 * @typedef {{
 *   archetypeId: string,
 *   profileKey: keyof import("../recommendations/buildVehicleRecommendationProfiles.js").VehicleRecommendationProfileMap,
 *   title: string,
 *   emphasis?: { kind: "score"|"persona", key: string },
 * }} ArchetypeComparisonDef
 */

/** @type {ArchetypeComparisonDef[]} */
export const ARCHETYPE_COMPARISON_DEFS = Object.freeze([
  {
    archetypeId: BUYER_ARCHETYPE_IDS.CITY_COMMUTER,
    profileKey: "cityCommuter",
    title: "City Commuter",
    emphasis: { kind: "persona", key: "cityBuyer" },
  },
  {
    archetypeId: BUYER_ARCHETYPE_IDS.FAMILY_BUYER,
    profileKey: "familyBuyer",
    title: "Family Buyer",
  },
  {
    archetypeId: BUYER_ARCHETYPE_IDS.HIGHWAY_TRAVELLER,
    profileKey: "highwayTraveller",
    title: "Highway Traveller",
    emphasis: { kind: "score", key: "highway" },
  },
  {
    archetypeId: BUYER_ARCHETYPE_IDS.APARTMENT_OWNER,
    profileKey: "apartmentOwner",
    title: "Apartment Owner",
    emphasis: { kind: "score", key: "charging" },
  },
  {
    archetypeId: BUYER_ARCHETYPE_IDS.BUDGET_BUYER,
    profileKey: "budgetBuyer",
    title: "Budget Buyer",
    emphasis: { kind: "score", key: "value" },
  },
  {
    archetypeId: BUYER_ARCHETYPE_IDS.PREMIUM_BUYER,
    profileKey: "premiumBuyer",
    title: "Premium Buyer",
    emphasis: { kind: "persona", key: "premiumBuyer" },
  },
  {
    archetypeId: BUYER_ARCHETYPE_IDS.FIRST_TIME_EV_BUYER,
    profileKey: "firstTimeEvBuyer",
    title: "First-time EV Buyer",
    emphasis: { kind: "score", key: "ownership" },
  },
]);

/** @type {Record<string, string>} */
export const KNOWN_VEHICLE_NAMES = Object.freeze({
  "tata-nexon-ev": "Nexon EV",
  "tata-curvv-ev": "Curvv EV",
  "tata-tiago-ev": "Tiago EV",
  "mg-comet-ev": "Comet EV",
  "byd-seal": "BYD Seal",
  "mahindra-be-6": "BE 6",
  "hyundai-ioniq-5": "Ioniq 5",
});

/** @type {Record<string, string>} */
export const DIMENSION_ADVANTAGE_LABELS = Object.freeze(
  Object.fromEntries(
    COMPARISON_DIMENSIONS.map((dimension) => [
      dimension.key,
      dimension.advantagePhrase,
    ])
  )
);

/** @type {ReadonlyArray<DimensionOutcome>} */
export const DIMENSION_OUTCOME_LIST = Object.freeze([
  DIMENSION_OUTCOMES.ADVANTAGE,
  DIMENSION_OUTCOMES.TIE,
  DIMENSION_OUTCOMES.TRADE_OFF,
]);
