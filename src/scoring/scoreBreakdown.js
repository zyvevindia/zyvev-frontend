import {
  FEATURE_BASE_SCORE,
  FEATURE_POINTS,
  VALUE_COMPONENT_WEIGHTS,
  FAMILY_COMPONENT_WEIGHTS,
  CITY_COMPONENT_WEIGHTS,
  HIGHWAY_COMPONENT_WEIGHTS,
} from "./scoreWeights.js";
import {
  clampScore,
  normalizeToScore,
  weightedAverage,
  averagePresent,
  computeEfficiencyKmPerKwh,
  computePremiumScore,
  computeBudgetScore,
} from "./scoreNormalization.js";

function isTruthyFeature(value) {
  if (value === true) return true;
  if (value === false || value == null) return false;
  if (typeof value === "string") {
    const v = value.trim().toLowerCase();
    return v === "yes" || v === "true" || v === "standard" || v === "available";
  }
  return Boolean(value);
}

function parseBootSpaceL(input) {
  if (input == null) return null;
  if (typeof input === "number" && Number.isFinite(input)) return input;
  const match = String(input).match(/([\d.]+)/);
  return match ? Number(match[1]) : null;
}

/**
 * Score boolean feature bundle.
 * @param {object} features
 * @returns {number|null}
 */
export function computeFeatureScore(features = {}) {
  const keys = Object.keys(FEATURE_POINTS);
  const present = keys.filter((k) => features[k] !== undefined);
  if (!present.length) return null;

  let score = FEATURE_BASE_SCORE;
  let counted = 0;
  for (const key of keys) {
    if (features[key] === undefined) continue;
    counted += 1;
    if (isTruthyFeature(features[key])) {
      score += FEATURE_POINTS[key];
    }
  }
  if (counted === 0) return null;
  return clampScore(Math.min(100, score));
}

/**
 * Range score from claimed range, battery, and efficiency.
 * @param {object} signals
 * @returns {{ score: number|null, signals: object }}
 */
export function computeRangeBreakdown(signals) {
  const rangeScore = normalizeToScore(signals.claimedRangeKm, "claimedRangeKm");
  const batteryScore = normalizeToScore(
    signals.batteryCapacityKwh,
    "batteryCapacityKwh"
  );
  const efficiency = computeEfficiencyKmPerKwh(
    signals.claimedRangeKm,
    signals.batteryCapacityKwh
  );
  const efficiencyScore = normalizeToScore(efficiency, "efficiencyKmPerKwh");

  const score = weightedAverage(
    { range: rangeScore, battery: batteryScore, efficiency: efficiencyScore },
    { range: 0.45, battery: 0.25, efficiency: 0.3 }
  );

  return {
    score,
    signals: {
      claimedRangeKm: signals.claimedRangeKm ?? null,
      batteryCapacityKwh: signals.batteryCapacityKwh ?? null,
      efficiencyKmPerKwh: efficiency,
    },
  };
}

/**
 * Charging score from DC/AC kW and charge times.
 * @param {object} signals
 * @returns {{ score: number|null, signals: object }}
 */
export function computeChargingBreakdown(signals) {
  const dcKwScore = normalizeToScore(signals.dcChargingKw, "dcChargingKw");
  const acKwScore = normalizeToScore(signals.acChargingKw, "acChargingKw");
  const dcTimeScore = normalizeToScore(
    signals.dcChargingTimeMinutes,
    "dcChargingTimeMinutes"
  );
  const acTimeScore = normalizeToScore(
    signals.acChargingTimeHours,
    "acChargingTimeHours"
  );

  const score = weightedAverage(
    {
      dcKw: dcKwScore,
      acKw: acKwScore,
      dcTime: dcTimeScore,
      acTime: acTimeScore,
    },
    { dcKw: 0.35, acKw: 0.2, dcTime: 0.3, acTime: 0.15 }
  );

  return {
    score,
    signals: {
      dcChargingKw: signals.dcChargingKw ?? null,
      acChargingKw: signals.acChargingKw ?? null,
      dcChargingTimeMinutes: signals.dcChargingTimeMinutes ?? null,
      acChargingTimeHours: signals.acChargingTimeHours ?? null,
    },
  };
}

/**
 * Performance score from power and torque.
 * @param {object} signals
 * @returns {{ score: number|null, signals: object }}
 */
export function computePerformanceBreakdown(signals) {
  const powerScore = normalizeToScore(signals.powerPs, "powerPs");
  const torqueScore = normalizeToScore(signals.torqueNm, "torqueNm");

  const score = weightedAverage(
    { power: powerScore, torque: torqueScore },
    { power: 0.55, torque: 0.45 }
  );

  return {
    score,
    signals: {
      powerPs: signals.powerPs ?? null,
      torqueNm: signals.torqueNm ?? null,
    },
  };
}

/**
 * Safety score from NCAP, airbags, and ADAS.
 * @param {object} signals
 * @returns {{ score: number|null, signals: object }}
 */
export function computeSafetyBreakdown(signals) {
  const ncapScore =
    signals.ncapRating != null
      ? clampScore((Number(signals.ncapRating) / 5) * 100)
      : null;
  const airbagScore = normalizeToScore(signals.airbags, "airbags");
  const adasScore = isTruthyFeature(signals.adas) ? 85 : signals.adas === false ? 35 : null;

  const score = weightedAverage(
    { ncap: ncapScore, airbags: airbagScore, adas: adasScore },
    { ncap: 0.45, airbags: 0.3, adas: 0.25 }
  );

  return {
    score,
    signals: {
      ncapRating: signals.ncapRating ?? null,
      airbags: signals.airbags ?? null,
      adas: signals.adas ?? null,
    },
  };
}

/**
 * Value score from price, range, features, charging.
 * @param {object} signals
 * @param {object} partialScores precomputed dimension scores
 * @returns {{ score: number|null, signals: object }}
 */
export function computeValueBreakdown(signals, partialScores = {}) {
  const priceScore = normalizeToScore(signals.startingPrice, "startingPriceInr");
  const rangeScore = partialScores.range ?? null;
  const featureScore = partialScores.feature ?? null;
  const chargingScore = partialScores.charging ?? null;

  const score = weightedAverage(
    {
      price: priceScore,
      range: rangeScore,
      features: featureScore,
      charging: chargingScore,
    },
    VALUE_COMPONENT_WEIGHTS
  );

  return {
    score,
    signals: {
      startingPrice: signals.startingPrice ?? null,
      rangeScore,
      featureScore,
      chargingScore,
    },
  };
}

/**
 * Family suitability score.
 * @param {object} signals
 * @param {object} partialScores
 * @returns {{ score: number|null, signals: object }}
 */
export function computeFamilyBreakdown(signals, partialScores = {}) {
  const bootSpaceL = parseBootSpaceL(signals.bootSpaceL);
  const bootScore = normalizeToScore(bootSpaceL, "bootSpaceL");
  const safetyScore = partialScores.safety ?? null;
  const featureScore = partialScores.feature ?? null;
  const comfortScore = averagePresent([
    isTruthyFeature(signals.ventilatedSeats) ? 82 : signals.ventilatedSeats === false ? 48 : null,
    isTruthyFeature(signals.sunroof) ? 78 : signals.sunroof === false ? 50 : null,
    bootScore,
  ]);

  const score = weightedAverage(
    {
      bootSpace: bootScore,
      safety: safetyScore,
      features: featureScore,
      comfort: comfortScore,
    },
    FAMILY_COMPONENT_WEIGHTS
  );

  return {
    score,
    signals: {
      bootSpaceL,
      safetyScore,
      featureScore,
      comfortScore,
    },
  };
}

/**
 * City usability score.
 * @param {object} signals
 * @param {object} partialScores
 * @returns {{ score: number|null, signals: object }}
 */
export function computeCityBreakdown(signals, partialScores = {}) {
  const efficiency = computeEfficiencyKmPerKwh(
    signals.claimedRangeKm,
    signals.batteryCapacityKwh
  );
  const efficiencyScore = normalizeToScore(efficiency, "efficiencyKmPerKwh");
  const lengthScore = normalizeToScore(signals.lengthMm, "lengthMm");
  const widthScore = normalizeToScore(signals.widthMm, "widthMm");
  const dimensionScore = averagePresent([lengthScore, widthScore]);
  const chargingScore = partialScores.charging ?? null;

  const score = weightedAverage(
    {
      efficiency: efficiencyScore,
      dimensions: dimensionScore,
      charging: chargingScore,
    },
    CITY_COMPONENT_WEIGHTS
  );

  return {
    score,
    signals: {
      efficiencyKmPerKwh: efficiency,
      lengthMm: signals.lengthMm ?? null,
      widthMm: signals.widthMm ?? null,
    },
  };
}

/**
 * Highway usability score.
 * @param {object} signals
 * @param {object} partialScores
 * @returns {{ score: number|null, signals: object }}
 */
export function computeHighwayBreakdown(signals, partialScores = {}) {
  const rangeScore = partialScores.range ?? null;
  const chargingScore = partialScores.charging ?? null;
  const performanceScore = partialScores.performance ?? null;

  const score = weightedAverage(
    { range: rangeScore, charging: chargingScore, performance: performanceScore },
    HIGHWAY_COMPONENT_WEIGHTS
  );

  return {
    score,
    signals: {
      rangeScore,
      chargingScore,
      performanceScore,
    },
  };
}

/**
 * Build full vehicle breakdown object.
 * @param {object} signals normalized scoring signals
 * @returns {object}
 */
export function buildVehicleBreakdown(signals) {
  const features = signals.features || {};
  const featureScore = computeFeatureScore(features);

  const range = computeRangeBreakdown(signals);
  const charging = computeChargingBreakdown(signals);
  const performance = computePerformanceBreakdown(signals);
  const safety = computeSafetyBreakdown({ ...signals, adas: signals.adas ?? features.adas });

  const partial = {
    range: range.score,
    charging: charging.score,
    performance: performance.score,
    feature: featureScore,
    safety: safety.score,
  };

  const value = computeValueBreakdown(signals, partial);
  const family = computeFamilyBreakdown(signals, partial);
  const city = computeCityBreakdown(signals, partial);
  const highway = computeHighwayBreakdown(signals, partial);

  const breakdownScores = {
    range: range.score,
    charging: charging.score,
    performance: performance.score,
    feature: featureScore,
    safety: safety.score,
    value: value.score,
    family: family.score,
    city: city.score,
    highway: highway.score,
  };

  const premium = computePremiumScore(breakdownScores, signals.startingPrice);
  const budget = computeBudgetScore(value.score, signals.startingPrice);

  return {
    range: { score: range.score, signals: range.signals },
    charging: { score: charging.score, signals: charging.signals },
    performance: { score: performance.score, signals: performance.signals },
    feature: { score: featureScore, signals: { ...features } },
    safety: { score: safety.score, signals: safety.signals },
    value: { score: value.score, signals: value.signals },
    family: { score: family.score, signals: family.signals },
    city: { score: city.score, signals: city.signals },
    highway: { score: highway.score, signals: highway.signals },
    premium: { score: premium, signals: { startingPrice: signals.startingPrice ?? null } },
    budget: { score: budget, signals: { startingPrice: signals.startingPrice ?? null } },
  };
}
