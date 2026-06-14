import { formatChargingDurationNumber } from "../utils/formatChargingDuration.js";
import { formatLakhAmount } from "../utils/formatIndianPrice.js";
import {
  extractVariantMetricValues,
} from "../utils/familyAggregateMetrics.js";
import { buildRangeConfidence, formatRangeBand } from "./rangeConfidence.js";

function finiteNumbers(values = []) {
  return values.filter((n) => Number.isFinite(n) && n > 0);
}

function formatHeroPriceRange(minInr, maxInr) {
  const prices = finiteNumbers([minInr, maxInr]);
  if (!prices.length) return null;

  const min = Math.min(...prices);
  const max = Math.max(...prices);

  const formatLakhValue = (inr) =>
    formatLakhAmount(inr, { maxDecimals: 2 })?.replace(/\s*Lakh$/i, "") ||
    null;

  if (Math.abs(min - max) < 1) {
    const single = formatLakhValue(min);
    return single ? `₹${single} lakh` : null;
  }

  const minLabel = formatLakhValue(min);
  const maxLabel = formatLakhValue(max);
  if (!minLabel || !maxLabel) return null;

  return `₹${minLabel}–${maxLabel} lakh`;
}

function formatNumericHeroRange(values, unit, formatValue = (n) => String(n)) {
  const nums = finiteNumbers(values);
  if (!nums.length) return null;

  const min = Math.min(...nums);
  const max = Math.max(...nums);

  if (Math.abs(min - max) < 0.001) {
    return `${formatValue(min)} ${unit}`.trim();
  }

  return `${formatValue(min)}–${formatValue(max)} ${unit}`.trim();
}

function formatHeroDcChargingRange(values) {
  const minutes = finiteNumbers(values.map((row) => row.dcMinutes));
  if (!minutes.length) return null;

  const min = Math.min(...minutes);
  const max = Math.max(...minutes);

  if (min === max) return `${Math.round(min)} min`;
  return `${Math.round(min)}–${Math.round(max)} min`;
}

/**
 * @param {object} variant
 * @returns {{ min: number, max: number } | null}
 */
function extractVariantRealWorldBand(variant) {
  const direct =
    variant?.realWorldRangeKm ||
    variant?.catalogMeta?.realWorldRangeKm ||
    variant?.range?.realWorldKm ||
    null;

  const min = Number(direct?.min);
  const max = Number(direct?.max);
  if (Number.isFinite(min) && Number.isFinite(max) && min > 0 && max > 0) {
    return { min, max };
  }

  const single =
    typeof direct === "number" ? direct : Number(direct);
  if (Number.isFinite(single) && single > 0) {
    return { min: single, max: single };
  }

  const estimated = buildRangeConfidence(variant)?.estimatedRealWorldKm;
  const estMin = Number(estimated?.min);
  const estMax = Number(estimated?.max);
  if (
    Number.isFinite(estMin) &&
    Number.isFinite(estMax) &&
    estMin > 0 &&
    estMax > 0
  ) {
    return { min: estMin, max: estMax };
  }

  return null;
}

function aggregateRealWorldRangeLabel(variants = []) {
  const bands = variants
    .map(extractVariantRealWorldBand)
    .filter(Boolean);

  if (!bands.length) return null;

  const min = Math.min(...bands.map((band) => band.min));
  const max = Math.max(...bands.map((band) => band.max));

  return formatRangeBand({ min: Math.round(min), max: Math.round(max) });
}

/**
 * Resolve all model variants — never collapse to the selected trim alone.
 * @param {object|null|undefined} vehicle
 * @returns {object[]}
 */
export function resolveHeroSummaryVariants(vehicle) {
  if (!vehicle || typeof vehicle !== "object") return [];

  if (Array.isArray(vehicle.variants) && vehicle.variants.length > 0) {
    return vehicle.variants;
  }

  return [vehicle];
}

/**
 * Build model-level hero summary ranges across every available variant.
 * @param {object|null|undefined} vehicle
 * @returns {{
 *   priceRange: string|null,
 *   realWorldRange: string|null,
 *   batteryRange: string|null,
 *   powerRange: string|null,
 *   chargingRange: string|null,
 *   variantCount: number,
 *   minPriceInr: number|null,
 * }}
 */
export function buildHeroSummary(vehicle) {
  const variants = resolveHeroSummaryVariants(vehicle);
  const familyFallback =
    vehicle?.defaultVariant ||
    vehicle?.familyFallback ||
    variants[0] ||
    vehicle;

  const rows = variants.map((variant) =>
    extractVariantMetricValues(variant, familyFallback)
  );

  const prices = finiteNumbers(rows.map((row) => row.price));
  const priceRange = prices.length
    ? formatHeroPriceRange(Math.min(...prices), Math.max(...prices))
    : null;

  return {
    priceRange,
    realWorldRange: aggregateRealWorldRangeLabel(variants),
    batteryRange: formatNumericHeroRange(
      rows.map((row) => row.batteryKwh),
      "kWh",
      formatChargingDurationNumber
    ),
    powerRange: formatNumericHeroRange(
      rows.map((row) => row.powerBhp),
      "bhp",
      (n) => Math.round(n)
    ),
    chargingRange: formatHeroDcChargingRange(rows),
    variantCount: variants.length,
    minPriceInr: prices.length ? Math.min(...prices) : null,
  };
}
