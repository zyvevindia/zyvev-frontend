/**
 * Buyer fit engine constants.
 *
 * Fit tiers reuse Score 2.0 qualitative tiers — no numeric scores or rankings.
 */

import { SCORE_TIERS } from "../score2/constants.js";
import { BUYER_ARCHETYPE_IDS } from "./constants.js";

/** @typedef {typeof SCORE_TIERS[keyof typeof SCORE_TIERS]} FitTier */
export const FIT_TIERS = SCORE_TIERS;

/** @typedef {"high"|"medium"|"low"} FitConfidence */
export const FIT_CONFIDENCE = Object.freeze({
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low",
});

/**
 * Primary score/persona dimensions per buyer archetype.
 *
 * @typedef {"score"|"persona"} FitDimensionKind
 * @typedef {{ kind: FitDimensionKind, key: string, label: string }} FitDimensionRef
 */

/** @type {Record<string, FitDimensionRef[]>} */
export const ARCHETYPE_PRIMARY_DIMENSIONS = Object.freeze({
  [BUYER_ARCHETYPE_IDS.CITY_COMMUTER]: Object.freeze([
    { kind: "score", key: "ownership", label: "Ownership economics" },
    { kind: "score", key: "value", label: "Purchase value" },
    { kind: "persona", key: "cityBuyer", label: "City usability" },
  ]),
  [BUYER_ARCHETYPE_IDS.FAMILY_BUYER]: Object.freeze([
    { kind: "score", key: "family", label: "Family practicality" },
    { kind: "score", key: "service", label: "Service support" },
  ]),
  [BUYER_ARCHETYPE_IDS.HIGHWAY_TRAVELLER]: Object.freeze([
    { kind: "score", key: "highway", label: "Highway capability" },
    { kind: "score", key: "charging", label: "Charging practicality" },
  ]),
  [BUYER_ARCHETYPE_IDS.APARTMENT_OWNER]: Object.freeze([
    { kind: "score", key: "charging", label: "Charging practicality" },
    { kind: "score", key: "ownership", label: "Ownership economics" },
  ]),
  [BUYER_ARCHETYPE_IDS.BUDGET_BUYER]: Object.freeze([
    { kind: "score", key: "value", label: "Purchase value" },
    { kind: "score", key: "ownership", label: "Ownership economics" },
  ]),
  [BUYER_ARCHETYPE_IDS.PREMIUM_BUYER]: Object.freeze([
    { kind: "persona", key: "premiumBuyer", label: "Premium appeal" },
    { kind: "score", key: "highway", label: "Highway capability" },
  ]),
  [BUYER_ARCHETYPE_IDS.FIRST_TIME_EV_BUYER]: Object.freeze([
    { kind: "score", key: "ownership", label: "Ownership ease" },
    { kind: "score", key: "service", label: "Service support" },
    { kind: "score", key: "value", label: "Purchase value" },
  ]),
});

/** @type {Record<string, keyof import("../score2/types.js").RecommendationProfile>} */
export const ARCHETYPE_PERSONA_CONSTRAINTS = Object.freeze({
  [BUYER_ARCHETYPE_IDS.CITY_COMMUTER]: "cityBuyer",
  [BUYER_ARCHETYPE_IDS.FAMILY_BUYER]: "familyBuyer",
  [BUYER_ARCHETYPE_IDS.HIGHWAY_TRAVELLER]: "highwayBuyer",
  [BUYER_ARCHETYPE_IDS.BUDGET_BUYER]: "budgetBuyer",
  [BUYER_ARCHETYPE_IDS.PREMIUM_BUYER]: "premiumBuyer",
  [BUYER_ARCHETYPE_IDS.FIRST_TIME_EV_BUYER]: "cityBuyer",
});

/** @type {ReadonlyArray<FitTier>} */
export const FIT_TIER_ORDER = Object.freeze([
  FIT_TIERS.INSUFFICIENT,
  FIT_TIERS.LIMITED,
  FIT_TIERS.MODERATE,
  FIT_TIERS.GOOD,
  FIT_TIERS.EXCELLENT,
]);
