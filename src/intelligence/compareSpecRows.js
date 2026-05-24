import { ensureArray, safeSlice } from "../utils/compareArrayUtils.js";
import { formatIndianPriceCompact } from "../utils/formatIndianPrice.js";
import { formatRangeConfidenceLabel } from "./rangeConfidence.js";
import { formatIntelligenceValue, isPresent } from "./governance.js";
import { withVehicleIntelligence } from "./buildVehicleIntelligence.js";

/**
 * @typedef {'max' | 'min' | 'best_value' | 'none'} CompareHighlightMode
 */

/**
 * @typedef {object} CompareSpecRow
 * @property {string} id
 * @property {string} label
 * @property {string} [group]
 * @property {(car: object) => string|number|null} getRaw
 * @property {(car: object) => boolean} [isAvailable]
 * @property {CompareHighlightMode} [highlightMode]
 * @property {boolean} [estimated]
 */

function ensureIntel(car) {
  if (car?.evIntelligence) return car.evIntelligence;
  return null;
}

/** @type {CompareSpecRow[]} */
export const CORE_COMPARE_ROWS = [
  {
    id: "price",
    label: "Starting Price",
    group: "pricing",
    getRaw: (car) => car.startingPrice || car.price || 0,
    highlightMode: "best_value",
  },
  {
    id: "claimed_range",
    label: "Claimed range (ARAI)",
    group: "range",
    getRaw: (car) => {
      const intel = ensureIntel(car);
      const v = intel?.range?.claimedRangeKm;
      if (isPresent(v)) return v;
      return car.specifications?.range || car.range || null;
    },
    isAvailable: (car) =>
      isPresent(ensureIntel(car)?.range?.claimedRangeKm) ||
      isPresent(car.specifications?.range),
    highlightMode: "max",
  },
  {
    id: "real_world_range",
    label: "Est. real-world range",
    group: "range",
    estimated: true,
    getRaw: (car) => {
      const rw = ensureIntel(car)?.range?.estimatedRealWorldKm;
      if (!rw) return null;
      return `${rw.min}–${rw.max} km`;
    },
    isAvailable: (car) =>
      Boolean(ensureIntel(car)?.range?.estimatedRealWorldKm),
    highlightMode: "max",
  },
  {
    id: "range_confidence",
    label: "Range confidence",
    group: "range",
    getRaw: (car) => {
      const r = ensureIntel(car)?.range;
      if (!r?.hasData) return null;
      return formatRangeConfidenceLabel(r);
    },
    isAvailable: (car) => Boolean(ensureIntel(car)?.range?.hasData),
    highlightMode: "none",
  },
  {
    id: "dc_charging",
    label: "DC fast charge (10–80%)",
    group: "charging",
    getRaw: (car) => ensureIntel(car)?.charging?.dcFastChargingTime || null,
    isAvailable: (car) =>
      isPresent(ensureIntel(car)?.charging?.dcFastChargingTime),
    highlightMode: "min",
  },
  {
    id: "charging_speed",
    label: "Charging speed category",
    group: "charging",
    getRaw: (car) =>
      ensureIntel(car)?.charging?.speedCategoryLabel || null,
    isAvailable: (car) =>
      isPresent(ensureIntel(car)?.charging?.speedCategoryLabel),
    highlightMode: "none",
  },
  {
    id: "connector",
    label: "Connector / socket",
    group: "charging",
    getRaw: (car) => ensureIntel(car)?.charging?.connectorType || null,
    isAvailable: (car) =>
      isPresent(ensureIntel(car)?.charging?.connectorType),
    highlightMode: "none",
  },
  {
    id: "charging_convenience",
    label: "Charging convenience",
    group: "charging",
    estimated: true,
    getRaw: (car) => {
      const score = ensureIntel(car)?.charging?.convenienceScore;
      if (!isPresent(score)) return null;
      return `${score}/100`;
    },
    isAvailable: (car) =>
      isPresent(ensureIntel(car)?.charging?.convenienceScore),
    highlightMode: "max",
  },
  {
    id: "monthly_charging_cost",
    label: "Est. monthly charging cost",
    group: "ownership",
    estimated: true,
    getRaw: (car) => {
      const v = ensureIntel(car)?.ownership?.monthlyChargingCostInr;
      if (!isPresent(v)) return null;
      return v;
    },
    isAvailable: (car) =>
      isPresent(ensureIntel(car)?.ownership?.monthlyChargingCostInr),
    highlightMode: "min",
  },
  {
    id: "petrol_savings",
    label: "Est. yearly savings vs petrol",
    group: "ownership",
    estimated: true,
    getRaw: (car) => {
      const v =
        ensureIntel(car)?.ownership?.savingsVsPetrolYearlyInr;
      if (!isPresent(v)) return null;
      return v;
    },
    isAvailable: (car) =>
      isPresent(ensureIntel(car)?.ownership?.savingsVsPetrolYearlyInr),
    highlightMode: "max",
  },
  {
    id: "battery_warranty",
    label: "Battery warranty",
    group: "ownership",
    getRaw: (car) => {
      const w = ensureIntel(car)?.ownership?.batteryWarranty;
      if (!w?.available) return null;
      const parts = [];
      if (isPresent(w.years)) parts.push(`${w.years} years`);
      if (isPresent(w.km)) {
        parts.push(`${Number(w.km).toLocaleString("en-IN")} km`);
      }
      return parts.join(" / ") || null;
    },
    isAvailable: (car) =>
      Boolean(ensureIntel(car)?.ownership?.batteryWarranty?.available),
    highlightMode: "none",
  },
  {
    id: "battery_pack",
    label: "Battery pack",
    group: "specs",
    getRaw: (car) => car.specifications?.batteryPack || null,
    isAvailable: (car) => isPresent(car.specifications?.batteryPack),
    highlightMode: "none",
  },
  {
    id: "ac_charging",
    label: "AC charging",
    group: "charging",
    getRaw: (car) => {
      const ac = ensureIntel(car)?.charging?.acChargingTime;
      if (isPresent(ac)) return ac;
      return car.specifications?.chargingTime || null;
    },
    isAvailable: (car) =>
      isPresent(ensureIntel(car)?.charging?.acChargingTime) ||
      isPresent(car.specifications?.chargingTime),
    highlightMode: "none",
  },
  {
    id: "top_speed",
    label: "Top speed",
    group: "specs",
    getRaw: (car) => car.specifications?.topSpeed || null,
    isAvailable: (car) => isPresent(car.specifications?.topSpeed),
    highlightMode: "none",
  },
  {
    id: "feature_highlights",
    label: "Feature highlights",
    group: "features",
    getRaw: (car) => {
      const h = ensureArray(ensureIntel(car)?.features?.highlights, {
        label: "features.highlights",
        subsystem: "compare-spec",
      });
      return h.length ? safeSlice(h, 0, 4, { subsystem: "compare-spec" }).join(" · ") : null;
    },
    isAvailable: (car) =>
      ensureArray(ensureIntel(car)?.features?.highlights, {
        label: "features.highlights",
        subsystem: "compare-spec",
      }).length > 0,
    highlightMode: "none",
  },
];

/**
 * Rows visible when at least one car in the set has data.
 * @param {object[]} cars — must already have evIntelligence attached
 * @param {CompareSpecRow[]} [rows]
 */
export function getActiveCompareRows(cars, rows = CORE_COMPARE_ROWS) {
  if (!cars?.length) return [];

  return rows.filter((row) => {
    if (row.isAvailable) {
      return cars.some((car) => row.isAvailable(car));
    }
    return cars.some((car) => isPresent(row.getRaw(car)));
  });
}

export function formatCompareCellValue(raw, row) {
  if (!isPresent(raw)) return "—";
  if (row.id === "price") {
    return formatIndianPriceCompact(Number(raw) || 0);
  }
  if (row.id === "monthly_charging_cost" || row.id === "petrol_savings") {
    const formatted = formatIntelligenceValue(raw, {
      suffix: "",
      estimated: row.estimated,
    });
    return `₹${formatted.display}${row.estimated ? "*" : ""}`;
  }
  if (typeof raw === "number" && row.id === "claimed_range") {
    return `${raw} km`;
  }
  return String(raw);
}

/**
 * @returns {string|null} car._id of highlighted column
 */
export function getCompareHighlightWinnerId(cars, row) {
  const mode = row.highlightMode || "none";
  if (mode === "none" || !cars.length) return null;

  if (mode === "best_value") {
    let best = cars[0];
    let bestScore =
      (best.startingPrice || 1) /
      (best.specifications?.range || best.range || 1);
    for (const c of cars) {
      const meta = c.catalogMeta;
      const catalogScore = meta?.compareValueScore;
      const score =
        catalogScore != null
          ? -catalogScore
          : (c.startingPrice || 1) /
            (c.specifications?.range || c.range || 1);
      if (score < bestScore) {
        best = c;
        bestScore = score;
      }
    }
    return best._id;
  }

  const numericValues = cars.map((car) => {
    const raw = row.getRaw(car);
    if (row.id === "real_world_range" && typeof raw === "string") {
      const match = raw.match(/(\d+)\s*–\s*(\d+)/);
      return match ? Number(match[2]) : null;
    }
    if (row.id === "charging_convenience" && typeof raw === "string") {
      const match = raw.match(/(\d+)/);
      return match ? Number(match[1]) : null;
    }
    if (row.id === "dc_charging") {
      const mins = car.evIntelligence?.charging?.dcMinutes;
      return isPresent(mins) ? Number(mins) : null;
    }
    return typeof raw === "number" ? raw : null;
  });

  if (numericValues.every((v) => v == null)) return null;

  const target =
    mode === "max"
      ? Math.max(...numericValues.filter((v) => v != null))
      : Math.min(...numericValues.filter((v) => v != null));

  const idx = numericValues.findIndex((v) => v === target);
  return idx >= 0 ? cars[idx]._id : null;
}

/** Small LRU-ish cache — avoids repeated intelligence rebuilds when compare list unchanged. */
const COMPARE_INTEL_CACHE = new Map();
const COMPARE_INTEL_CACHE_MAX = 48;

function compareCarsSignature(cars) {
  return ensureArray(cars)
    .map((c) =>
      [
        c?._id,
        c?.slug,
        c?.startingPrice ?? c?.price,
        c?.specifications?.range ?? c?.range,
        c?.catalogMeta?.catalogUpdatedAt,
        c?.catalogMeta?.priceLastUpdated,
      ].join(":")
    )
    .join("|");
}

export function attachIntelligenceToCompareCars(cars) {
  const list = ensureArray(cars);
  const sig = compareCarsSignature(list);
  if (sig && COMPARE_INTEL_CACHE.has(sig)) {
    return COMPARE_INTEL_CACHE.get(sig);
  }
  const enriched = list.map((c) => withVehicleIntelligence(c));
  if (sig) {
    while (COMPARE_INTEL_CACHE.size >= COMPARE_INTEL_CACHE_MAX) {
      const oldest = COMPARE_INTEL_CACHE.keys().next().value;
      COMPARE_INTEL_CACHE.delete(oldest);
    }
    COMPARE_INTEL_CACHE.set(sig, enriched);
  }
  return enriched;
}
