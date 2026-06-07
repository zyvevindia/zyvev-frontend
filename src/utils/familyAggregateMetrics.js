import { formatChargingDurationNumber } from "./formatChargingDuration.js";
import {
  formatIndianPriceCompact,
  formatLakhAmount,
} from "./formatIndianPrice.js";

const KW_TO_BHP = 1.341;

function finiteNumbers(values = []) {
  return values.filter((n) => Number.isFinite(n) && n > 0);
}

function parseKwhFromText(raw) {
  if (raw == null || raw === "") return null;
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return raw > 0 ? raw : null;
  }
  const match = String(raw).match(/(\d+(?:\.\d+)?)\s*kwh/i);
  if (match) return Number(match[1]);
  const num = Number(String(raw).replace(/[^\d.]/g, ""));
  return Number.isFinite(num) && num > 0 && num <= 200 ? num : null;
}

function parseMinutesValue(value) {
  if (value == null || value === "") return null;
  if (typeof value === "number" && Number.isFinite(value)) {
    return value > 0 ? value : null;
  }
  const s = String(value);
  const range = s.match(/(\d+(?:\.\d+)?)\s*[-–]\s*(\d+(?:\.\d+)?)\s*min/i);
  if (range) {
    return Math.min(Number(range[1]), Number(range[2]));
  }
  const single = s.match(/(\d+(?:\.\d+)?)\s*min/i);
  if (single) return Number(single[1]);
  return null;
}

function parseAcHoursValue(value) {
  if (value == null || value === "") return null;
  if (typeof value === "number" && Number.isFinite(value)) {
    return value > 0 ? value : null;
  }
  const s = String(value);
  const hrs = s.match(/(\d+(?:\.\d+)?)\s*h(?:r|our)?s?/i);
  if (hrs) return Number(hrs[1]);
  return null;
}

function parseKwValue(value) {
  if (value == null || value === "") return null;
  if (typeof value === "number" && Number.isFinite(value)) {
    return value > 0 ? value : null;
  }
  const match = String(value).match(/(\d+(?:\.\d+)?)\s*kw/i);
  if (match) return Number(match[1]);
  return null;
}

function parseBootSpaceLiters(variant) {
  const specs = variant?.specifications || {};
  const meta = variant?.catalogMeta || {};
  const candidates = [
    specs.bootSpace,
    specs.bootSpaceL,
    meta.dimensions?.bootSpace,
    meta.dimensions?.bootSpaceL,
  ];
  for (const raw of candidates) {
    if (raw == null || raw === "") continue;
    if (typeof raw === "number" && Number.isFinite(raw) && raw > 0) {
      return raw;
    }
    const match = String(raw).match(/(\d+(?:\.\d+)?)\s*l/i);
    if (match) return Number(match[1]);
  }
  return null;
}

/**
 * Normalized numeric metrics for one variant (runtime catalog only).
 * @param {object} variant
 * @param {object | null} familyFallback
 */
export function extractVariantMetricValues(
  variant,
  familyFallback = null
) {
  const specs = variant?.specifications || {};
  const familySpecs = familyFallback?.specifications || {};
  const meta = variant?.catalogMeta || {};
  const perf = meta.performance || {};
  const intel = meta.chargingIntelligence || {};
  const prac = meta.chargingPracticality || {};
  const chargingMeta = variant?.chargingMeta || {};

  const price =
    Number(variant?.price ?? variant?.startingPrice ?? 0) || 0;

  const rangeKm =
    Number(
      variant?.range ??
        specs.range ??
        familySpecs.range ??
        meta.claimedRangeKm
    ) || 0;

  const batteryKwh =
    parseKwhFromText(variant?.battery) ||
    parseKwhFromText(specs.batteryPack) ||
    parseKwhFromText(familySpecs.batteryPack) ||
    parseKwhFromText(meta.compareSpecs?.batteryKwh) ||
    null;

  let powerBhp =
    Number(perf.powerBhp) ||
    Number(specs.powerBhp) ||
    null;

  if (!powerBhp) {
    const kw =
      Number(perf.powerKw) ||
      Number(specs.powerKw) ||
      parseKwValue(variant?.power);
    if (kw > 0) powerBhp = Math.round(kw * KW_TO_BHP);
  }

  if (!powerBhp) {
    const powerText =
      specs.power ||
      specs.motorPower ||
      variant?.power ||
      "";
    const bhpMatch = String(powerText).match(/(\d+(?:\.\d+)?)\s*bhp/i);
    if (bhpMatch) powerBhp = Number(bhpMatch[1]);
  }

  const dcKw =
    parseKwValue(intel.dcKw) ||
    parseKwValue(chargingMeta.dcKw) ||
    null;

  const dcMinutes =
    parseMinutesValue(intel.dcTime10to80Minutes) ||
    parseMinutesValue(prac.dcTime10to80Minutes) ||
    parseMinutesValue(intel.dcTime20to80Minutes) ||
    parseMinutesValue(prac.dcTime20to80Minutes) ||
    parseMinutesValue(chargingMeta.dcTime10to80Minutes) ||
    parseMinutesValue(chargingMeta.dcTime20to80Minutes) ||
    parseMinutesValue(variant?.chargingTime) ||
    parseMinutesValue(specs.chargingTime) ||
    null;

  const acKw =
    parseKwValue(intel.acKw) ||
    parseKwValue(chargingMeta.acKw) ||
    null;

  const acHours =
    parseAcHoursValue(prac.acFullChargeHours) ||
    parseAcHoursValue(intel.acTime0to100Hours) ||
    parseAcHoursValue(chargingMeta.acTime0to100Hours) ||
    parseAcHoursValue(meta.chargingSummary) ||
    null;

  const chargingText =
    variant?.chargingTime ||
    specs.chargingTime ||
    familySpecs.chargingTime ||
    "";

  const dcKwFromText = parseKwValue(chargingText.match(/(\d+(?:\.\d+)?)\s*kW\s*DC/i)?.[0]);
  const acKwFromText = parseKwValue(chargingText.match(/(\d+(?:\.\d+)?)\s*kW\s*AC/i)?.[0]);
  const dcMinutesFromText = parseMinutesValue(chargingText);
  const acHoursFromText = parseAcHoursValue(chargingText);

  return {
    price,
    rangeKm,
    batteryKwh,
    powerBhp,
    dcKw: dcKw || dcKwFromText,
    dcMinutes: dcMinutes || dcMinutesFromText,
    acKw: acKw || acKwFromText,
    acHours: acHours || acHoursFromText,
    bootSpaceL: parseBootSpaceLiters(variant),
  };
}

function formatNumericRange(values, unit, formatValue = (n) => String(n)) {
  const nums = finiteNumbers(values);
  if (!nums.length) return null;

  const min = Math.min(...nums);
  const max = Math.max(...nums);

  if (Math.abs(min - max) < 0.001) {
    return `${formatValue(min)} ${unit}`.trim();
  }

  return `${formatValue(min)} – ${formatValue(max)} ${unit}`.trim();
}

export function formatIndianPriceRange(minInr, maxInr) {
  const min = finiteNumbers([minInr])[0];
  const max = finiteNumbers([maxInr])[0];
  if (!min && !max) return null;
  if (!max || min === max) {
    return formatIndianPriceCompact(min || max);
  }
  const minLabel = formatLakhAmount(min, { decimals: 1 });
  const maxLabel = formatLakhAmount(max, { decimals: 1 });
  return `₹${minLabel} – ${maxLabel}`;
}

export function formatVariantDcChargingDisplay(values) {
  const { dcKw, dcMinutes } = values;
  const parts = [];
  if (dcKw) parts.push(`${formatChargingDurationNumber(dcKw)} kW`);
  if (dcMinutes != null) {
    parts.push(`${Math.round(dcMinutes)} min`);
  }
  return parts.length ? parts.join(" • ") : null;
}

export function formatVariantAcChargingDisplay(values) {
  const { acKw, acHours } = values;
  const parts = [];
  if (acKw) parts.push(`${formatChargingDurationNumber(acKw)} kW`);
  if (acHours != null) {
    const hrs = formatChargingDurationNumber(acHours);
    if (hrs) parts.push(`${hrs} hrs`);
  }
  return parts.length ? parts.join(" • ") : null;
}

export function formatVariantPowerDisplay(values) {
  const bhp = values?.powerBhp;
  if (!bhp) return null;
  return `${Math.round(bhp)} bhp`;
}

function aggregateChargingTimeRange(values, field) {
  return formatNumericRange(
    values.map((v) => v[field]),
    "hrs",
    formatChargingDurationNumber
  );
}

function aggregateDcTimeRange(values) {
  const minutes = finiteNumbers(values.map((v) => v.dcMinutes));
  if (!minutes.length) return null;
  const min = Math.min(...minutes);
  const max = Math.max(...minutes);
  if (min === max) return `${Math.round(min)} min`;
  return `${Math.round(min)} – ${Math.round(max)} min`;
}

/**
 * Aggregate family-level metrics across visible variants.
 * @param {object[]} variants
 * @param {object | null} familyFallback
 */
export function buildFamilyAggregateMetrics(
  variants = [],
  familyFallback = null
) {
  if (!variants.length) return null;

  const rows = variants.map((v) =>
    extractVariantMetricValues(v, familyFallback)
  );

  const prices = finiteNumbers(rows.map((r) => r.price));
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const maxPrice = prices.length ? Math.max(...prices) : 0;

  return {
    minPrice,
    maxPrice,
    priceLabel: formatIndianPriceRange(minPrice, maxPrice),
    rangeLabel: formatNumericRange(
      rows.map((r) => r.rangeKm),
      "km",
      (n) => Math.round(n)
    ),
    batteryLabel: formatNumericRange(
      rows.map((r) => r.batteryKwh),
      "kWh",
      formatChargingDurationNumber
    ),
    powerLabel: formatNumericRange(
      rows.map((r) => r.powerBhp),
      "bhp",
      (n) => Math.round(n)
    ),
    chargingAcLabel: aggregateChargingTimeRange(rows, "acHours"),
    chargingDcLabel: aggregateDcTimeRange(rows),
    bootSpaceLabel: formatNumericRange(
      rows.map((r) => r.bootSpaceL),
      "L",
      (n) => Math.round(n)
    ),
  };
}

/**
 * Variant-specific labels for key specifications (single trim).
 */
export function buildVariantDetailMetrics(
  variant,
  familyFallback = null
) {
  const values = extractVariantMetricValues(variant, familyFallback);
  const price = values.price;

  return {
    minPrice: price,
    maxPrice: price,
    priceLabel: price > 0 ? formatIndianPriceCompact(price) : null,
    rangeLabel:
      values.rangeKm > 0 ? `${Math.round(values.rangeKm)} km` : null,
    batteryLabel:
      values.batteryKwh != null
        ? `${formatChargingDurationNumber(values.batteryKwh)} kWh`
        : null,
    powerLabel: formatVariantPowerDisplay(values),
    chargingAcLabel: formatVariantAcChargingDisplay(values),
    chargingDcLabel: formatVariantDcChargingDisplay(values),
    bootSpaceLabel:
      values.bootSpaceL != null
        ? `${Math.round(values.bootSpaceL)} L`
        : null,
  };
}
