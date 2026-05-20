/**
 * Central EV intelligence taxonomy — single source of labels/ids for
 * filters, SEO, compare, recommendations, and analytics.
 */

export const TAXONOMY_VERSION = 1;

/** @enum {string} */
export const CHARGING_SPEED_TAXONOMY = Object.freeze({
  ULTRA: "ultra",
  FAST: "fast",
  MODERATE: "moderate",
  SLOW: "slow",
});

export const CHARGING_SPEED_LABELS = Object.freeze({
  [CHARGING_SPEED_TAXONOMY.ULTRA]: "Ultra-fast DC",
  [CHARGING_SPEED_TAXONOMY.FAST]: "Fast DC",
  [CHARGING_SPEED_TAXONOMY.MODERATE]: "Moderate DC",
  [CHARGING_SPEED_TAXONOMY.SLOW]: "Slower DC",
});

export const CONNECTOR_TAXONOMY = Object.freeze({
  CCS2: "CCS2",
  TYPE_2: "Type 2",
  CHADEMO: "CHAdeMO",
  GBT: "GB/T",
});

export const RANGE_CATEGORY_TAXONOMY = Object.freeze({
  SHORT: "short",
  MEDIUM: "medium",
  LONG: "long",
  EXTRA_LONG: "extra_long",
});

export const RANGE_CATEGORY_BOUNDS_KM = Object.freeze({
  [RANGE_CATEGORY_TAXONOMY.SHORT]: { max: 249 },
  [RANGE_CATEGORY_TAXONOMY.MEDIUM]: { min: 250, max: 349 },
  [RANGE_CATEGORY_TAXONOMY.LONG]: { min: 350, max: 449 },
  [RANGE_CATEGORY_TAXONOMY.EXTRA_LONG]: { min: 450 },
});

export const RANGE_CATEGORY_LABELS = Object.freeze({
  [RANGE_CATEGORY_TAXONOMY.SHORT]: "Under 250 km (claimed)",
  [RANGE_CATEGORY_TAXONOMY.MEDIUM]: "250–349 km",
  [RANGE_CATEGORY_TAXONOMY.LONG]: "350–449 km",
  [RANGE_CATEGORY_TAXONOMY.EXTRA_LONG]: "450 km+",
});

export const BATTERY_CAPACITY_TAXONOMY = Object.freeze({
  SMALL: "small",
  MEDIUM: "medium",
  LARGE: "large",
});

export const BATTERY_CAPACITY_BOUNDS_KWH = Object.freeze({
  [BATTERY_CAPACITY_TAXONOMY.SMALL]: { max: 35 },
  [BATTERY_CAPACITY_TAXONOMY.MEDIUM]: { min: 35, max: 50 },
  [BATTERY_CAPACITY_TAXONOMY.LARGE]: { min: 50 },
});

export const PRICE_BAND_TAXONOMY = Object.freeze({
  UNDER_15: "under_15",
  MID: "mid",
  PREMIUM: "premium",
});

export const PRICE_BAND_INR = Object.freeze({
  [PRICE_BAND_TAXONOMY.UNDER_15]: { max: 1500000 },
  [PRICE_BAND_TAXONOMY.MID]: { min: 1500000, max: 2500000 },
  [PRICE_BAND_TAXONOMY.PREMIUM]: { min: 2500000 },
});

export const SUITABILITY_TAXONOMY = Object.freeze({
  CITY: "city",
  HIGHWAY: "highway",
  APARTMENT: "apartment",
  FAMILY: "family",
  LONG_DISTANCE: "long_distance",
});

export const SUITABILITY_LABELS = Object.freeze({
  [SUITABILITY_TAXONOMY.CITY]: "City commuting",
  [SUITABILITY_TAXONOMY.HIGHWAY]: "Highway driving",
  [SUITABILITY_TAXONOMY.APARTMENT]: "Apartment living",
  [SUITABILITY_TAXONOMY.FAMILY]: "Family-friendly",
  [SUITABILITY_TAXONOMY.LONG_DISTANCE]: "Long-distance",
});

export const FEATURE_TAXONOMY = Object.freeze({
  ADAS: "adas",
  V2L: "v2l",
  THERMAL_MGMT: "thermal_mgmt",
  OTA: "ota",
  CONNECTED: "connected",
  FAST_DC: "fast_dc",
});

export const FEATURE_LABELS = Object.freeze({
  [FEATURE_TAXONOMY.ADAS]: "ADAS support",
  [FEATURE_TAXONOMY.V2L]: "V2L (vehicle-to-load)",
  [FEATURE_TAXONOMY.THERMAL_MGMT]: "Battery thermal management",
  [FEATURE_TAXONOMY.OTA]: "OTA updates",
  [FEATURE_TAXONOMY.CONNECTED]: "Connected car",
  [FEATURE_TAXONOMY.FAST_DC]: "DC fast charging",
});

export const BODY_TYPE_TAXONOMY = Object.freeze({
  SUV: "suv",
  HATCHBACK: "hatchback",
  SEDAN: "sedan",
  MPV: "mpv",
});

export function classifyRangeCategory(claimedKm) {
  const km = Number(claimedKm) || 0;
  if (km <= 0) return null;
  if (km < 250) return RANGE_CATEGORY_TAXONOMY.SHORT;
  if (km < 350) return RANGE_CATEGORY_TAXONOMY.MEDIUM;
  if (km < 450) return RANGE_CATEGORY_TAXONOMY.LONG;
  return RANGE_CATEGORY_TAXONOMY.EXTRA_LONG;
}

export function classifyBatteryCapacity(kwh) {
  const n = Number(kwh) || 0;
  if (n <= 0) return null;
  if (n < 35) return BATTERY_CAPACITY_TAXONOMY.SMALL;
  if (n < 50) return BATTERY_CAPACITY_TAXONOMY.MEDIUM;
  return BATTERY_CAPACITY_TAXONOMY.LARGE;
}

export function classifyPriceBand(priceInr) {
  const p = Number(priceInr) || 0;
  if (p <= 0) return null;
  if (p < PRICE_BAND_INR[PRICE_BAND_TAXONOMY.UNDER_15].max) {
    return PRICE_BAND_TAXONOMY.UNDER_15;
  }
  if (p < PRICE_BAND_INR[PRICE_BAND_TAXONOMY.PREMIUM].min) {
    return PRICE_BAND_TAXONOMY.MID;
  }
  return PRICE_BAND_TAXONOMY.PREMIUM;
}
