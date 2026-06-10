/**
 * EVSavari Score Engine v1 — deterministic weights and market benchmarks.
 * All scores are 0–100; no LLM involvement.
 */

export const SCORE_ENGINE_VERSION = 1;

/** Weights for overall composite (must sum to 1 when all present). */
export const OVERALL_WEIGHTS = Object.freeze({
  range: 0.14,
  charging: 0.12,
  performance: 0.1,
  feature: 0.1,
  safety: 0.12,
  value: 0.18,
  family: 0.08,
  city: 0.08,
  highway: 0.08,
});

/** Value score internal weights. */
export const VALUE_COMPONENT_WEIGHTS = Object.freeze({
  price: 0.35,
  range: 0.25,
  features: 0.2,
  charging: 0.2,
});

/** Family score internal weights. */
export const FAMILY_COMPONENT_WEIGHTS = Object.freeze({
  bootSpace: 0.25,
  safety: 0.3,
  features: 0.25,
  comfort: 0.2,
});

/** City score internal weights. */
export const CITY_COMPONENT_WEIGHTS = Object.freeze({
  efficiency: 0.35,
  dimensions: 0.25,
  charging: 0.4,
});

/** Highway score internal weights. */
export const HIGHWAY_COMPONENT_WEIGHTS = Object.freeze({
  range: 0.4,
  charging: 0.35,
  performance: 0.25,
});

/** Variant recommendation blend weights. */
export const VARIANT_RECOMMEND_WEIGHTS = Object.freeze({
  value: 0.35,
  longRange: 0.25,
  fastCharge: 0.2,
  feature: 0.2,
});

/** Feature boolean point contributions (max ~100 with base). */
export const FEATURE_POINTS = Object.freeze({
  adas: 18,
  sunroof: 10,
  ventilatedSeats: 12,
  camera360: 14,
  connectedCar: 10,
  v2l: 12,
  v2v: 8,
});

export const FEATURE_BASE_SCORE = 28;

/** Grade thresholds (inclusive lower bound). */
export const GRADE_THRESHOLDS = Object.freeze([
  { grade: "A+", min: 90 },
  { grade: "A", min: 80 },
  { grade: "B+", min: 70 },
  { grade: "B", min: 60 },
  { grade: "C", min: 0 },
]);

/** Indian EV market normalization ranges. */
export const MARKET_BENCHMARKS = Object.freeze({
  claimedRangeKm: { min: 140, max: 580, excellent: 520 },
  batteryCapacityKwh: { min: 18, max: 78 },
  efficiencyKmPerKwh: { min: 4.2, max: 8.5 },
  dcChargingKw: { min: 30, max: 240 },
  acChargingKw: { min: 3.3, max: 22 },
  dcChargingTimeMinutes: { min: 18, max: 75, invert: true },
  acChargingTimeHours: { min: 4, max: 12, invert: true },
  powerPs: { min: 40, max: 400 },
  torqueNm: { min: 90, max: 650 },
  startingPriceInr: { min: 700000, max: 5500000, invert: true },
  bootSpaceL: { min: 200, max: 550 },
  lengthMm: { min: 3600, max: 4800, invert: true },
  widthMm: { min: 1650, max: 1950, invert: true },
  ncapRating: { min: 0, max: 5 },
  airbags: { min: 2, max: 8 },
});

/** Category ranking definitions. */
export const CATEGORY_DEFINITIONS = Object.freeze({
  family: {
    id: "family",
    label: "Best Family EV",
    scoreKey: "family",
    description: "Boot space, safety, features, and comfort for family use.",
  },
  city: {
    id: "city",
    label: "Best City EV",
    scoreKey: "city",
    description: "Efficiency, compact dimensions, and home charging practicality.",
  },
  highway: {
    id: "highway",
    label: "Best Highway EV",
    scoreKey: "highway",
    description: "Range, fast charging, and performance for long trips.",
  },
  value: {
    id: "value",
    label: "Best Value EV",
    scoreKey: "value",
    description: "Price-to-capability balance across range, features, and charging.",
  },
  premium: {
    id: "premium",
    label: "Best Premium EV",
    scoreKey: "premium",
    description: "High-end features, performance, and brand positioning.",
  },
  budget: {
    id: "budget",
    label: "Best Budget EV",
    scoreKey: "budget",
    description: "Strong capability at the lowest entry price.",
  },
});
