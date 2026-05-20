import { isPresent } from "./governance.js";

/**
 * Central intelligence validation — prevents broken compare / scoring.
 */

const REQUIRED_COMPARE_PATHS = [
  (c) => c?._id || c?.slug,
  (c) => c?.name,
];

/**
 * @param {object} car
 */
export function validateVehicleForIntelligence(car) {
  const issues = [];
  const warnings = [];

  if (!car || typeof car !== "object") {
    return { valid: false, issues: ["missing_vehicle"], warnings: [] };
  }

  if (!isPresent(car.slug) && !isPresent(car._id)) {
    issues.push("missing_identity");
  }

  const hasRange =
    isPresent(car.specifications?.range) ||
    isPresent(car.range) ||
    isPresent(car.catalogMeta?.claimedRangeKm);

  const hasPrice =
    Number(car.startingPrice ?? car.price) > 0;

  if (!hasRange) warnings.push("missing_range");
  if (!hasPrice) warnings.push("missing_price");

  return {
    valid: issues.length === 0,
    issues,
    warnings,
    hasMinimalData: hasRange || hasPrice,
  };
}

/**
 * @param {object|null} bundle from buildVehicleIntelligence
 */
export function auditIntelligenceBundle(bundle) {
  if (!bundle) {
    return {
      complete: false,
      partial: false,
      missing: ["all"],
      available: [],
      warnings: ["no_intelligence_bundle"],
    };
  }

  const sections = {
    range: bundle.range?.hasData,
    charging: bundle.charging?.hasData,
    ownership: bundle.ownership?.hasData,
    features: bundle.features?.hasData,
    suitability: bundle.suitability?.hasData,
    chargingPracticality: bundle.chargingPracticality?.hasData,
  };

  const available = Object.entries(sections)
    .filter(([, ok]) => ok)
    .map(([k]) => k);

  const missing = Object.entries(sections)
    .filter(([, ok]) => !ok)
    .map(([k]) => k);

  const warnings = [];
  if (bundle.range?.hasData && !bundle.range?.estimatedRealWorldKm) {
    warnings.push("range_missing_real_world_band");
  }
  if (
    bundle.ownership?.hasData &&
    bundle.ownership?.estimated &&
    !bundle.ownership?.disclaimer
  ) {
    warnings.push("ownership_missing_disclaimer");
  }

  return {
    complete: missing.length === 0,
    partial: available.length > 0 && missing.length > 0,
    missing,
    available,
    warnings,
  };
}

/**
 * @param {object[]} cars
 */
export function validateCompareSet(cars = []) {
  if (!Array.isArray(cars) || cars.length < 2) {
    return { safe: false, reason: "insufficient_vehicles" };
  }

  for (const car of cars) {
    for (const check of REQUIRED_COMPARE_PATHS) {
      if (!check(car)) {
        return { safe: false, reason: "incomplete_vehicle_identity" };
      }
    }
  }

  return { safe: true, reason: null };
}

/**
 * Safe display value — never throws, never fabricates.
 */
export function safeIntelligenceDisplay(value, fallback = "—") {
  if (!isPresent(value)) return fallback;
  return value;
}

/**
 * Whether a compare spec row should render for this car set.
 */
export function rowHasComparableData(cars, getRaw) {
  return (cars || []).some((c) => isPresent(getRaw(c)));
}
