/** @typedef {import("./types.js").PersonaContext} PersonaContext */

export const PERSONA_LIMITS = Object.freeze({
  maxPersonas: 5,
});

/** ₹30 lakh — premium price tier threshold */
export const PREMIUM_PRICE_THRESHOLD_INR = 3_000_000;

/**
 * @typedef {Object} PersonaRule
 * @property {string} id
 * @property {(ctx: PersonaContext) => boolean} when
 * @property {string} label
 * @property {number} [priority]
 * @property {string} [group] Mutually exclusive labels in the same group
 */

/** @type {PersonaRule[]} */
export const PERSONA_RULES = [
  {
    id: "premium-score",
    priority: 100,
    when: (ctx) => ctx.premiumScore != null && ctx.premiumScore > 80,
    label: "Premium EV",
  },
  {
    id: "premium-price",
    priority: 100,
    when: (ctx) =>
      ctx.startingPrice != null &&
      ctx.startingPrice > PREMIUM_PRICE_THRESHOLD_INR,
    label: "Premium EV",
  },
  {
    id: "highway-strong",
    priority: 99,
    when: (ctx) => ctx.highwayScore != null && ctx.highwayScore > 80,
    label: "Highway EV",
  },
  {
    id: "highway-capable",
    priority: 98,
    when: (ctx) =>
      ctx.highwayPersonaScore != null &&
      ctx.highwayPersonaScore > 80 &&
      ctx.highwayPlanningRangeKm != null &&
      ctx.highwayPlanningRangeKm >= 180 &&
      !(
        (ctx.premiumScore != null && ctx.premiumScore > 80) ||
        (ctx.startingPrice != null &&
          ctx.startingPrice > PREMIUM_PRICE_THRESHOLD_INR)
      ),
    label: "Highway EV",
  },
  {
    id: "long-distance",
    priority: 97,
    when: (ctx) =>
      ctx.highwayConfidenceScore != null &&
      ctx.highwayConfidenceScore > 80,
    label: "Long-distance EV",
  },
  {
    id: "first-ev",
    priority: 95,
    when: (ctx) => ctx.overallScore != null && ctx.overallScore > 80,
    label: "First EV",
  },
  {
    id: "first-ev-capable",
    priority: 94,
    when: (ctx) =>
      ctx.overallScore != null &&
      ctx.overallScore >= 55 &&
      ctx.highwayPersonaScore != null &&
      ctx.highwayPersonaScore > 80 &&
      ctx.chargingPracticalityScore != null &&
      ctx.chargingPracticalityScore >= 80,
    label: "First EV",
  },
  {
    id: "fast-charging",
    priority: 93,
    when: (ctx) =>
      ctx.chargingPracticalityScore != null &&
      ctx.chargingPracticalityScore > 80 &&
      ((ctx.premiumScore != null && ctx.premiumScore > 80) ||
        (ctx.startingPrice != null &&
          ctx.startingPrice > PREMIUM_PRICE_THRESHOLD_INR)),
    label: "Fast-charging EV",
  },
  {
    id: "city-strong",
    group: "city",
    priority: 92,
    when: (ctx) => ctx.cityScore != null && ctx.cityScore > 80,
    label: "City EV",
  },
  {
    id: "city-apartment",
    group: "city",
    priority: 91,
    when: (ctx) =>
      ctx.cityScore != null &&
      ctx.cityScore >= 65 &&
      ctx.apartmentScore != null &&
      ctx.apartmentScore >= 75 &&
      ctx.highwayPlanningRangeKm != null &&
      ctx.highwayPlanningRangeKm < 220,
    label: "City EV",
  },
  {
    id: "city-compact",
    group: "city",
    priority: 90,
    when: (ctx) =>
      ctx.apartmentScore != null &&
      ctx.apartmentScore >= 75 &&
      ctx.highwayPlanningRangeKm != null &&
      ctx.highwayPlanningRangeKm < 180 &&
      ctx.chargingPracticalityScore != null &&
      ctx.chargingPracticalityScore >= 85,
    label: "City EV",
  },
  {
    id: "apartment",
    priority: 89,
    when: (ctx) =>
      ctx.apartmentScore != null &&
      ctx.apartmentScore >= 75 &&
      ctx.highwayPlanningRangeKm != null &&
      ctx.highwayPlanningRangeKm < 250,
    label: "Apartment EV",
  },
  {
    id: "value",
    priority: 88,
    when: (ctx) => ctx.valueScore != null && ctx.valueScore > 75,
    label: "Value EV",
  },
  {
    id: "value-ownership",
    priority: 87,
    when: (ctx) =>
      ctx.ownershipCostScore != null &&
      ctx.ownershipCostScore > 80 &&
      ctx.highwayPersonaScore != null &&
      ctx.highwayPersonaScore <= 80,
    label: "Value EV",
  },
];
