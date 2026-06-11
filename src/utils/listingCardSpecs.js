import {
  extractVariantMetricValues,
} from "./familyAggregateMetrics.js";
import { formatChargingDurationNumber } from "./formatChargingDuration.js";

function finitePositive(values = []) {
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

function resolveVariantRows(car) {
  if (!car) return { rows: [], fallback: null };

  const fallback = car.defaultVariant || car;
  const variants =
    Array.isArray(car.variants) && car.variants.length > 0
      ? car.variants
      : [fallback];

  return {
    rows: variants.map((variant) =>
      extractVariantMetricValues(variant, fallback)
    ),
    fallback,
  };
}

/**
 * Buyer-facing spec chips for listing cards (family max range/battery, min DC time).
 * @param {object} car — family listing card or single variant
 * @returns {{ rangeLabel: string|null, batteryLabel: string|null, chargingLabel: string|null }}
 */
export function pickListingCardSpecChips(car) {
  const { rows, fallback } = resolveVariantRows(car);

  const ranges = finitePositive(rows.map((row) => row.rangeKm));
  const batteries = finitePositive(rows.map((row) => row.batteryKwh));
  const dcMinutes = finitePositive(rows.map((row) => row.dcMinutes));

  const maxRange =
    ranges.length > 0
      ? Math.max(...ranges)
      : Number(
          car?.range ??
            car?.maxRange ??
            car?.specifications?.range ??
            fallback?.range ??
            fallback?.specifications?.range ??
            0
        ) || null;

  const maxBattery =
    batteries.length > 0
      ? Math.max(...batteries)
      : parseKwhFromText(car?.battery) ||
        parseKwhFromText(car?.specifications?.batteryPack) ||
        parseKwhFromText(fallback?.battery) ||
        parseKwhFromText(fallback?.specifications?.batteryPack) ||
        null;

  const minDcMinutes =
    dcMinutes.length > 0 ? Math.min(...dcMinutes) : null;

  return {
    rangeLabel:
      maxRange != null && maxRange > 0
        ? `Up to ${Math.round(maxRange)} km`
        : null,
    batteryLabel:
      maxBattery != null
        ? `Up to ${formatChargingDurationNumber(maxBattery)} kWh`
        : null,
    chargingLabel:
      minDcMinutes != null
        ? `${Math.round(minDcMinutes)} min`
        : null,
  };
}
