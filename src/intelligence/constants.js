/**
 * Configurable assumptions for ownership / charging estimates.
 * City-specific rates can override these in a future release.
 */

export const OWNERSHIP_ASSUMPTIONS = Object.freeze({
  /** Typical home AC tariff (₹/kWh) — indicative */
  electricityRateHomeInr: 8,
  /** Typical public DC tariff (₹/kWh) — indicative */
  electricityRateDcInr: 18,
  /** Blended rate used for monthly cost when split unknown */
  electricityRateBlendedInr: 10,
  /** Assumed monthly driving for cost estimates */
  monthlyKm: 1200,
  /** Fallback efficiency when battery size unknown (km per kWh) */
  defaultEfficiencyKmPerKwh: 6.5,
  /** Petrol hatchback running cost (₹/km) for savings comparison */
  petrolCostPerKmInr: 7.5,
  /** Service interval fallback when OEM data missing */
  defaultServiceIntervalKm: 10000,
  defaultServiceIntervalMonths: 12,
});

/** Real-world efficiency derating for conservative ₹/km upper band */
export const OWNERSHIP_COST_CONSERVATIVE_EFFICIENCY_FACTOR = 0.865;

/** Ownership cost score label tiers (score is 0–100, higher is better) */
export const OWNERSHIP_COST_LABELS = Object.freeze([
  { min: 80, label: "Excellent ownership cost" },
  { min: 65, label: "Good ownership cost" },
  { min: 50, label: "Moderate ownership cost" },
  { min: 0, label: "Higher ownership cost" },
]);

/** Charging practicality score label tiers (score is 0–100, higher is better) */
export const CHARGING_PRACTICALITY_LABELS = Object.freeze([
  { min: 80, label: "Convenient charging" },
  { min: 65, label: "Good charging experience" },
  { min: 50, label: "Moderate charging experience" },
  { min: 0, label: "Slower charging experience" },
]);

/** Planning assumptions for estimating charge times from battery + kW */
export const CHARGING_PRACTICALITY_ASSUMPTIONS = Object.freeze({
  acChargingEfficiency: 0.9,
  dcChargingEfficiency: 0.85,
  /** SOC window for DC 10–80% sessions */
  dcSocWindow: 0.7,
  acScoreWeight: 0.42,
  dcScoreWeight: 0.58,
});

export const RANGE_CONFIDENCE_THRESHOLDS = Object.freeze({
  highMinScore: 80,
  mediumMinScore: 55,
});

/** Real-world range as fraction of claimed when only OEM range exists */
export const REAL_WORLD_RANGE_FACTORS = Object.freeze({
  min: 0.72,
  max: 0.88,
});

/** City driving typically retains more of usable range vs claim */
export const RANGE_CITY_FACTORS = Object.freeze({
  min: 0.78,
  max: 0.92,
});

/** Highway driving — higher speeds, more auxiliary load */
export const RANGE_HIGHWAY_FACTORS = Object.freeze({
  min: 0.58,
  max: 0.72,
});

export const RANGE_ESTIMATE_METHODS = Object.freeze({
  CATALOG_BAND: "catalog_band",
  EFFICIENCY_MODEL: "efficiency_model",
  OEM_ONLY: "oem_only",
  CURATED_OVERRIDE: "curated_override",
});

export const SEASONAL_RANGE_NOTES = Object.freeze([
  "Monsoon and heavy rain can reduce range — plan extra buffer.",
  "Summer AC use may lower real-world range vs mild weather.",
  "Cold mornings can temporarily reduce efficiency until battery warms.",
]);

export const OWNERSHIP_DEGRADATION_NOTE =
  "Battery capacity gradually reduces with age and cycles — OEM warranty covers defined thresholds; exact degradation varies by use and climate.";

export const OWNERSHIP_SAVINGS_DISCLAIMER =
  "Savings vs petrol are indicative based on assumed driving and fuel prices — not a guaranteed financial outcome.";

export const OWNERSHIP_ESTIMATE_DISCLAIMER =
  "All ownership costs shown are planning estimates. Confirm on-road price, insurance, and electricity tariff in your city.";

export const CHARGING_SPEED_CATEGORY = Object.freeze({
  ULTRA: "ultra",
  FAST: "fast",
  MODERATE: "moderate",
  SLOW: "slow",
});

export const CONFIDENCE_LEVELS = Object.freeze({
  HIGH: "high",
  MEDIUM: "medium",
  ESTIMATED: "estimated",
});

export const RANGE_SOURCES = Object.freeze({
  OEM_CLAIMED: "oem_claimed",
  INTERNAL_ESTIMATE: "internal_estimate",
  CATALOG: "catalog",
  REAL_WORLD_TESTED: "real_world_tested",
  COMMUNITY_VERIFIED: "community_verified",
});

/** Freshness / review staleness thresholds (days) — deterministic ops rules */
export const FRESHNESS_THRESHOLDS = Object.freeze({
  freshDays: 30,
  recentlyVerifiedDays: 90,
  needsReviewDays: 120,
  potentiallyStaleDays: 180,
  priceUpdateRecentDays: 14,
  specChangeRecentDays: 30,
});

export const REVIEW_PRIORITY = Object.freeze({
  LOW: "low",
  NORMAL: "normal",
  HIGH: "high",
  URGENT: "urgent",
});

export const VERIFICATION_STATUS = Object.freeze({
  UNREVIEWED: "unreviewed",
  IN_REVIEW: "in_review",
  VERIFIED: "verified",
  NEEDS_REVERIFY: "needs_reverify",
});
