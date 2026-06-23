import {
  BUYER_ARCHETYPE_IDS,
  NEED_LEVELS,
} from "./constants.js";

/** @type {import("./types.js").BuyerArchetype[]} */
export const BUYER_ARCHETYPES = Object.freeze([
  Object.freeze({
    id: BUYER_ARCHETYPE_IDS.CITY_COMMUTER,
    title: "City Commuter",
    description:
      "Urban-focused buyers with predictable daily routes who prioritise low running costs and easy home charging.",
    dailyKmRange: Object.freeze({ min: 20, max: 60, unit: "km" }),
    budgetRange: Object.freeze({ minLakh: 10, maxLakh: 20 }),
    familyNeed: NEED_LEVELS.LOW,
    highwayFrequency: NEED_LEVELS.LOW,
    chargingSituation: "Home charging preferred",
    priority: "Running cost",
  }),
  Object.freeze({
    id: BUYER_ARCHETYPE_IDS.FAMILY_BUYER,
    title: "Family Buyer",
    description:
      "Households balancing school runs, errands, and occasional trips who need practical space and predictable ownership.",
    dailyKmRange: Object.freeze({ min: 30, max: 80, unit: "km" }),
    budgetRange: Object.freeze({ minLakh: 15, maxLakh: 30 }),
    familyNeed: NEED_LEVELS.HIGH,
    highwayFrequency: NEED_LEVELS.MODERATE,
    chargingSituation: "Home or society charging helpful",
    priority: "Practicality",
  }),
  Object.freeze({
    id: BUYER_ARCHETYPE_IDS.HIGHWAY_TRAVELLER,
    title: "Highway Traveller",
    description:
      "Drivers covering long distances regularly who need dependable range, fast charging access, and confident highway usability.",
    dailyKmRange: Object.freeze({ min: 50, max: 120, unit: "km" }),
    budgetRange: null,
    familyNeed: NEED_LEVELS.MODERATE,
    highwayFrequency: NEED_LEVELS.HIGH,
    chargingSituation: "Fast public charging on routes",
    priority: "Range + charging",
  }),
  Object.freeze({
    id: BUYER_ARCHETYPE_IDS.APARTMENT_OWNER,
    title: "Apartment Owner",
    description:
      "Buyers in apartments or societies where home charging is limited and public or workplace charging must fill the gap.",
    dailyKmRange: Object.freeze({ min: 20, max: 70, unit: "km" }),
    budgetRange: null,
    familyNeed: NEED_LEVELS.MODERATE,
    highwayFrequency: NEED_LEVELS.LOW,
    chargingSituation: "Limited home charging; public charging reliance",
    priority: "Charging convenience",
  }),
  Object.freeze({
    id: BUYER_ARCHETYPE_IDS.BUDGET_BUYER,
    title: "Budget Buyer",
    description:
      "Value-conscious shoppers focused on purchase price, running costs, and sensible ownership without overspending.",
    dailyKmRange: Object.freeze({ min: 20, max: 60, unit: "km" }),
    budgetRange: Object.freeze({ minLakh: 10, maxLakh: 18 }),
    familyNeed: NEED_LEVELS.LOW,
    highwayFrequency: NEED_LEVELS.LOW,
    chargingSituation: "Affordable charging access preferred",
    priority: "Purchase value",
  }),
  Object.freeze({
    id: BUYER_ARCHETYPE_IDS.PREMIUM_BUYER,
    title: "Premium Buyer",
    description:
      "Buyers seeking luxury, performance, and refinement who accept higher purchase prices for a premium experience.",
    dailyKmRange: Object.freeze({ min: 30, max: 100, unit: "km" }),
    budgetRange: Object.freeze({ minLakh: 30, maxLakh: 30, openEnded: true }),
    familyNeed: NEED_LEVELS.MODERATE,
    highwayFrequency: NEED_LEVELS.MODERATE,
    chargingSituation: "Home charging plus premium ownership experience",
    priority: "Luxury + performance",
  }),
  Object.freeze({
    id: BUYER_ARCHETYPE_IDS.FIRST_TIME_EV_BUYER,
    title: "First-time EV Buyer",
    description:
      "New to electric ownership and looking for straightforward charging, service support, and a gentle learning curve.",
    dailyKmRange: Object.freeze({ min: 20, max: 60, unit: "km" }),
    budgetRange: Object.freeze({ minLakh: 10, maxLakh: 25 }),
    familyNeed: NEED_LEVELS.MODERATE,
    highwayFrequency: NEED_LEVELS.LOW,
    chargingSituation: "Simple charging setup preferred",
    priority: "Ease of ownership",
  }),
]);
