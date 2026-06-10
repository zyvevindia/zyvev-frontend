import { VARIANT_RECOMMEND_WEIGHTS } from "./scoreWeights.js";
import {
  clampScore,
  normalizeToScore,
  weightedAverage,
} from "./scoreNormalization.js";
import { computeFeatureScore } from "./scoreBreakdown.js";
import { explainVariantPick } from "./scoreExplanations.js";

function variantFeatures(variant) {
  return variant?.features || {};
}

function variantSignals(variant) {
  const features = variantFeatures(variant);
  return {
    startingPrice: variant.priceInr ?? variant.price ?? variant.startingPrice,
    claimedRangeKm: variant.rangeKm ?? variant.range,
    batteryCapacityKwh: variant.batteryKwh ?? variant.batteryCapacityKwh,
    dcChargingKw: variant.dcChargingKw,
    acChargingKw: variant.acChargingKw,
    dcChargingTimeMinutes: variant.dcChargingTimeMinutes,
    features,
  };
}

/**
 * Score a single variant across four buyer-facing dimensions.
 * @param {object} variant
 * @param {object} vehicleSignals fallback vehicle-level signals
 * @returns {object}
 */
export function scoreVariant(variant, vehicleSignals = {}) {
  const signals = {
    ...vehicleSignals,
    ...variantSignals(variant),
  };

  const valueScore = weightedAverage(
    {
      price: normalizeToScore(signals.startingPrice, "startingPriceInr"),
      range: normalizeToScore(signals.claimedRangeKm, "claimedRangeKm"),
      features: computeFeatureScore(signals.features),
      charging: normalizeToScore(signals.dcChargingKw, "dcChargingKw"),
    },
    { price: 0.35, range: 0.25, features: 0.2, charging: 0.2 }
  );

  const longRangeScore = normalizeToScore(signals.claimedRangeKm, "claimedRangeKm");
  const fastChargeScore = weightedAverage(
    {
      dcKw: normalizeToScore(signals.dcChargingKw, "dcChargingKw"),
      dcTime: normalizeToScore(signals.dcChargingTimeMinutes, "dcChargingTimeMinutes"),
    },
    { dcKw: 0.65, dcTime: 0.35 }
  );
  const featureScore = computeFeatureScore(signals.features);

  const recommendationScore = weightedAverage(
    {
      value: valueScore,
      longRange: longRangeScore,
      fastCharge: fastChargeScore,
      feature: featureScore,
    },
    VARIANT_RECOMMEND_WEIGHTS
  );

  return {
    variantName: variant.variantName || variant.name || variant.slug || "Variant",
    slug: variant.slug || variant.variantSlug || null,
    scores: {
      value: valueScore,
      longRange: longRangeScore,
      fastCharge: fastChargeScore,
      feature: featureScore,
      recommendation: recommendationScore,
    },
    signals: {
      priceInr: signals.startingPrice ?? null,
      rangeKm: signals.claimedRangeKm ?? null,
      batteryKwh: signals.batteryCapacityKwh ?? null,
      dcChargingKw: signals.dcChargingKw ?? null,
      acChargingKw: signals.acChargingKw ?? null,
    },
  };
}

function pickBest(variants, scoreKey, tieBreakKey) {
  const ranked = [...variants]
    .filter((v) => v.scores?.[scoreKey] != null)
    .sort((a, b) => {
      const diff = (b.scores[scoreKey] ?? 0) - (a.scores[scoreKey] ?? 0);
      if (diff !== 0) return diff;
      return (a.signals?.[tieBreakKey] ?? 0) - (b.signals?.[tieBreakKey] ?? 0);
    });
  return ranked[0] || null;
}

/**
 * Score all variants and determine role winners.
 * @param {object[]} variants
 * @param {object} vehicleSignals
 * @returns {object}
 */
export function scoreVariants(variants = [], vehicleSignals = {}) {
  const list = (variants || []).filter(Boolean);
  if (!list.length) {
    return {
      items: [],
      recommended: null,
      bestValue: null,
      longestRange: null,
      fastestCharging: null,
      hasData: false,
    };
  }

  const items = list.map((v) => scoreVariant(v, vehicleSignals));

  const recommended = pickBest(items, "recommendation", "priceInr");
  const bestValue = pickBest(items, "value", "priceInr");
  const longestRange = pickBest(items, "longRange", "priceInr");
  const fastestCharging = pickBest(items, "fastCharge", "priceInr");

  const wrap = (role, variant) =>
    variant
      ? {
          variantName: variant.variantName,
          slug: variant.slug,
          scores: variant.scores,
          signals: variant.signals,
          reason: explainVariantPick(role, variant),
        }
      : null;

  return {
    items,
    recommended: wrap("recommended", recommended),
    bestValue: wrap("bestValue", bestValue),
    longestRange: wrap("longestRange", longestRange),
    fastestCharging: wrap("fastestCharging", fastestCharging),
    hasData: items.some((v) => Object.values(v.scores).some((s) => s != null)),
  };
}

/**
 * Max-range and max-DC from variant list for vehicle-level signals.
 * @param {object[]} variants
 * @param {object} baseSignals
 * @returns {object}
 */
export function enrichSignalsFromVariants(variants = [], baseSignals = {}) {
  const list = (variants || []).filter(Boolean);
  if (!list.length) return baseSignals;

  let maxRange = baseSignals.claimedRangeKm;
  let maxDc = baseSignals.dcChargingKw;
  let minPrice = baseSignals.startingPrice;

  for (const v of list) {
    const range = v.rangeKm ?? v.range;
    const dc = v.dcChargingKw;
    const price = v.priceInr ?? v.price;
    if (range != null && (maxRange == null || range > maxRange)) maxRange = range;
    if (dc != null && (maxDc == null || dc > maxDc)) maxDc = dc;
    if (price != null && (minPrice == null || price < minPrice)) minPrice = price;
  }

  return {
    ...baseSignals,
    claimedRangeKm: maxRange ?? baseSignals.claimedRangeKm,
    dcChargingKw: maxDc ?? baseSignals.dcChargingKw,
    startingPrice: minPrice ?? baseSignals.startingPrice,
  };
}
