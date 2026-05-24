import { formatRangeBand } from "./rangeConfidence.js";
import { isPresent } from "./governance.js";
import { getConfidenceLabel } from "./trustMetadata.js";
import { formatFreshnessLabel } from "./freshnessMetadata.js";
import { ensureArray } from "../utils/compareArrayUtils.js";

/**
 * Trust-oriented compare summary — clarity over density.
 * @param {object[]} cars with evIntelligence
 */
export function buildCompareTrustSummary(cars = []) {
  const safeCars = ensureArray(cars, { label: "compareCars", subsystem: "compare-trust" });
  if (safeCars.length < 2) {
    return {
      hasData: false,
      rangeRows: [],
      ownershipRows: [],
      chargingRows: [],
      freshnessRows: [],
    };
  }

  const rangeRows = safeCars.map((car) => {
    const r = car.evIntelligence?.range;
    return {
      carId: car._id,
      carName: car.name,
      claimed: isPresent(r?.claimedRangeKm)
        ? `${r.claimedRangeKm} km (ARAI)`
        : "—",
      realWorld: r?.estimatedRealWorldKm
        ? formatRangeBand(r.estimatedRealWorldKm)
        : "—",
      highway: r?.highwayRangeKm
        ? formatRangeBand(r.highwayRangeKm)
        : "—",
      confidence: r?.hasData
        ? getConfidenceLabel(r.confidenceLevel)
        : "—",
      estimated: r?.estimated !== false,
    };
  });

  const ownershipRows = safeCars.map((car) => {
    const o = car.evIntelligence?.ownership;
    return {
      carId: car._id,
      carName: car.name,
      monthly: isPresent(o?.monthlyChargingCostInr)
        ? `~₹${o.monthlyChargingCostInr.toLocaleString("en-IN")}/mo`
        : "—",
      yearlyKwh: isPresent(o?.yearlyKwhEstimate)
        ? `~${o.yearlyKwhEstimate} kWh/yr`
        : "—",
      savings: isPresent(o?.savingsVsPetrolYearlyInr)
        ? `~₹${o.savingsVsPetrolYearlyInr.toLocaleString("en-IN")}/yr vs petrol`
        : "—",
      estimated: true,
    };
  });

  const chargingRows = safeCars.map((car) => {
    const p = car.evIntelligence?.chargingPracticality;
    const c = car.evIntelligence?.charging;
    return {
      carId: car._id,
      carName: car.name,
      practicality:
        p?.convenienceLevelLabel ||
        (isPresent(c?.convenienceScore)
          ? `Convenience ${c.convenienceScore}/100`
          : "—"),
      overnight: p?.overnightLabel || "—",
      roadTrip: p?.roadTripLabel || "—",
      estimated: true,
    };
  });

  const freshnessRows = safeCars.map((car) => {
    const f = car.evFreshness || car.evIntelligence?.freshness;
    const t = car.evTransparency || car.evIntelligence?.transparency;
    return {
      carId: car._id,
      carName: car.name,
      freshness: f ? formatFreshnessLabel(f) : "—",
      stale: Boolean(f?.isStale),
      updated: t?.showRecentlyUpdated ? "Recently updated" : "—",
    };
  });

  const hasData =
    rangeRows.some((r) => r.realWorld !== "—") ||
    ownershipRows.some((o) => o.monthly !== "—") ||
    freshnessRows.some((f) => f.freshness !== "—");

  return {
    hasData,
    rangeRows,
    ownershipRows,
    chargingRows,
    freshnessRows,
    anyStale: freshnessRows.some((f) => f.stale),
    disclaimer:
      "Estimated figures use EVSavari assumptions — not OEM guarantees. Confirm specs with dealers.",
  };
}
