import {
  CHARGING_SPEED_TAXONOMY,
  CHARGING_SPEED_LABELS,
  RANGE_CATEGORY_TAXONOMY,
  RANGE_CATEGORY_LABELS,
  BATTERY_CAPACITY_TAXONOMY,
  PRICE_BAND_TAXONOMY,
  SUITABILITY_TAXONOMY,
  FEATURE_TAXONOMY,
  FEATURE_LABELS,
} from "./taxonomy.js";
import { isFastChargingFamily } from "./familyIntelligence.js";
import { SUITABILITY_LEVEL } from "./suitabilityInsights.js";

/**
 * @typedef {object} IntelligenceFilterDef
 * @property {string} id
 * @property {string} group
 * @property {string} label
 * @property {string} [description]
 * @property {(family: object) => boolean} match
 * @property {boolean} [urlDefault] — show in primary chip row
 */

function insightLevel(family, id) {
  return family?.evIntelligence?.suitability?.insights?.find(
    (i) => i.id === id
  )?.level;
}

function strongOrGood(level) {
  return level === SUITABILITY_LEVEL.STRONG || level === SUITABILITY_LEVEL.GOOD;
}

function suitMeta(family, key, min = 70) {
  const v = family?.catalogMeta?.suitabilityScores?.[key];
  return v != null && Number(v) >= min;
}

/** @type {IntelligenceFilterDef[]} */
export const INTELLIGENCE_FILTER_DEFINITIONS = [
  {
    id: "city_friendly",
    group: "use_case",
    label: "City commuting",
    urlDefault: true,
    match: (f) =>
      suitMeta(f, "city") ||
      strongOrGood(insightLevel(f, "city_commute")),
  },
  {
    id: "highway_friendly",
    group: "use_case",
    label: "Highway trips",
    urlDefault: true,
    match: (f) =>
      suitMeta(f, "highway") ||
      strongOrGood(insightLevel(f, "highway")),
  },
  {
    id: "apartment_friendly",
    group: "use_case",
    label: "Apartment living",
    urlDefault: true,
    match: (f) =>
      strongOrGood(insightLevel(f, "apartment")) ||
      f?.taxonomyTags?.homeCharging === true,
  },
  {
    id: "family_friendly",
    group: "use_case",
    label: "Family-friendly",
    urlDefault: true,
    match: (f) =>
      suitMeta(f, "family") ||
      strongOrGood(insightLevel(f, "family")),
  },
  {
    id: "charging_ultra",
    group: "charging",
    label: CHARGING_SPEED_LABELS[CHARGING_SPEED_TAXONOMY.ULTRA],
    match: (f) =>
      f?.taxonomyTags?.chargingSpeed === CHARGING_SPEED_TAXONOMY.ULTRA,
  },
  {
    id: "charging_fast",
    group: "charging",
    label: "Fast DC charging",
    urlDefault: true,
    match: (f) => isFastChargingFamily(f),
  },
  {
    id: "connector_ccs2",
    group: "charging",
    label: "CCS2",
    match: (f) => f?.taxonomyTags?.connector === "CCS2",
  },
  {
    id: "connector_type2",
    group: "charging",
    label: "Type 2",
    match: (f) => f?.taxonomyTags?.connector === "Type 2",
  },
  {
    id: "home_charging",
    group: "charging",
    label: "Home charging",
    match: (f) => f?.taxonomyTags?.homeCharging === true,
  },
  {
    id: "range_long",
    group: "range",
    label: RANGE_CATEGORY_LABELS[RANGE_CATEGORY_TAXONOMY.LONG],
    match: (f) =>
      f?.taxonomyTags?.rangeCategory === RANGE_CATEGORY_TAXONOMY.LONG ||
      f?.taxonomyTags?.rangeCategory === RANGE_CATEGORY_TAXONOMY.EXTRA_LONG,
  },
  {
    id: "range_extra_long",
    group: "range",
    label: RANGE_CATEGORY_LABELS[RANGE_CATEGORY_TAXONOMY.EXTRA_LONG],
    match: (f) =>
      f?.taxonomyTags?.rangeCategory === RANGE_CATEGORY_TAXONOMY.EXTRA_LONG,
  },
  {
    id: "battery_large",
    group: "battery",
    label: "Large battery (50+ kWh)",
    match: (f) =>
      f?.taxonomyTags?.batteryCategory === BATTERY_CAPACITY_TAXONOMY.LARGE,
  },
  {
    id: "price_under_15",
    group: "budget",
    label: "Under ₹15 lakh",
    urlDefault: true,
    match: (f) =>
      f?.taxonomyTags?.priceBand === PRICE_BAND_TAXONOMY.UNDER_15,
  },
  {
    id: "ownership_affordable",
    group: "budget",
    label: "Lower running cost",
    match: (f) =>
      (f?.evScores?.subScores?.ownershipAffordability ?? 0) >= 70,
  },
  {
    id: "feature_adas",
    group: "features",
    label: FEATURE_LABELS[FEATURE_TAXONOMY.ADAS],
    match: (f) => f?.taxonomyTags?.adas === true,
  },
  {
    id: "feature_v2l",
    group: "features",
    label: FEATURE_LABELS[FEATURE_TAXONOMY.V2L],
    match: (f) => f?.taxonomyTags?.v2l === true,
  },
  {
    id: "feature_thermal",
    group: "features",
    label: FEATURE_LABELS[FEATURE_TAXONOMY.THERMAL_MGMT],
    match: (f) => f?.taxonomyTags?.thermalMgmt === true,
  },
  {
    id: "feature_ota",
    group: "features",
    label: FEATURE_LABELS[FEATURE_TAXONOMY.OTA],
    match: (f) => f?.taxonomyTags?.ota === true,
  },
];

export const FILTER_GROUPS = Object.freeze([
  { id: "use_case", label: "Use case" },
  { id: "charging", label: "Charging" },
  { id: "range", label: "Range" },
  { id: "budget", label: "Budget" },
  { id: "features", label: "Features" },
]);

const FILTER_BY_ID = new Map(
  INTELLIGENCE_FILTER_DEFINITIONS.map((f) => [f.id, f])
);

export function getFilterDefinition(id) {
  return FILTER_BY_ID.get(id) || null;
}

export function getPrimaryFilters() {
  return INTELLIGENCE_FILTER_DEFINITIONS.filter((f) => f.urlDefault);
}

export function getSecondaryFilters() {
  return INTELLIGENCE_FILTER_DEFINITIONS.filter((f) => !f.urlDefault);
}
