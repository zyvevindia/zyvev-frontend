import {
  OWNERSHIP_ASSUMPTIONS,
  OWNERSHIP_DEGRADATION_NOTE,
  OWNERSHIP_SAVINGS_DISCLAIMER,
  OWNERSHIP_ESTIMATE_DISCLAIMER,
} from "./constants.js";
import {
  isPresent,
  parseKwhFromText,
  pickFirstPresent,
  UNAVAILABLE,
} from "./governance.js";

function estimateBatteryKwh(car) {
  const specs = car?.specifications || {};
  const fromPack = parseKwhFromText(specs.batteryPack || car?.battery);
  if (isPresent(fromPack)) return fromPack;

  const meta = car?.catalogMeta || {};
  const fromMeta = parseKwhFromText(meta.ownershipWarranty?.batteryCapacity);
  return fromMeta;
}

function estimateEfficiencyKmPerKwh(car, batteryKwh) {
  const range =
    Number(car?.specifications?.range ?? car?.range) || 0;
  if (range > 0 && isPresent(batteryKwh) && batteryKwh > 0) {
    return range / batteryKwh;
  }
  return OWNERSHIP_ASSUMPTIONS.defaultEfficiencyKmPerKwh;
}

export function computeChargingCosts({
  monthlyKm = OWNERSHIP_ASSUMPTIONS.monthlyKm,
  efficiencyKmPerKwh,
  ratePerKwh = OWNERSHIP_ASSUMPTIONS.electricityRateBlendedInr,
}) {
  const kwhPerMonth = monthlyKm / efficiencyKmPerKwh;
  const monthly = Math.round(kwhPerMonth * ratePerKwh);
  const yearly = monthly * 12;
  const petrolMonthly = Math.round(
    monthlyKm * OWNERSHIP_ASSUMPTIONS.petrolCostPerKmInr
  );
  const savingsYearly = Math.max(0, petrolMonthly * 12 - yearly);

  return {
    monthlyChargingCostInr: monthly,
    yearlyChargingCostInr: yearly,
    petrolEquivalentYearlyInr: petrolMonthly * 12,
    savingsVsPetrolYearlyInr: savingsYearly,
    kwhPerMonth: Math.round(kwhPerMonth * 10) / 10,
    yearlyKwh: Math.round(kwhPerMonth * 12 * 10) / 10,
  };
}

function buildWarrantySummary(warranty) {
  if (!warranty?.available) {
    return "Battery warranty details unavailable — confirm with OEM for your variant.";
  }
  const parts = [];
  if (isPresent(warranty.years)) {
    parts.push(`${warranty.years}-year battery warranty`);
  }
  if (isPresent(warranty.km)) {
    parts.push(
      `up to ${Number(warranty.km).toLocaleString("en-IN")} km`
    );
  }
  return parts.length
    ? `${parts.join(" · ")} (verify terms for your city and variant).`
    : "Battery warranty listed — confirm coverage with dealer.";
}

function buildRiskIndicators(car, chargingIntel, warranty) {
  const risks = [];
  if (!warranty?.available) {
    risks.push("Battery warranty not confirmed in available data");
  }
  if (chargingIntel?.homeChargingSupported !== true) {
    risks.push("Home charging may depend on public or workplace access");
  }
  const price = Number(car?.startingPrice ?? car?.price) || 0;
  if (price > 2800000) {
    risks.push("Premium segment — higher insurance and repair costs possible");
  }
  return risks.slice(0, 3);
}

/**
 * @param {object} car
 * @param {object} [chargingIntel]
 */
export function buildOwnershipIntelligence(car, chargingIntel = null) {
  const meta = car?.catalogMeta || {};
  const warranty = meta.ownershipWarranty || {};
  const ownershipIntel = meta.ownershipIntelligence || {};
  const practicality = meta.ownershipPracticality || {};

  const batteryKwh = estimateBatteryKwh(car);
  const efficiency = estimateEfficiencyKmPerKwh(car, batteryKwh);
  const costs = computeChargingCosts({ efficiencyKmPerKwh: efficiency });

  const assumptions = {
    electricityRatePerKwh:
      OWNERSHIP_ASSUMPTIONS.electricityRateBlendedInr,
    monthlyKm: OWNERSHIP_ASSUMPTIONS.monthlyKm,
    efficiencyKmPerKwh: Math.round(efficiency * 10) / 10,
    petrolCostPerKm: OWNERSHIP_ASSUMPTIONS.petrolCostPerKmInr,
    note: OWNERSHIP_ESTIMATE_DISCLAIMER,
  };

  const batteryWarranty = {
    years: pickFirstPresent(
      warranty.batteryYears,
      ownershipIntel.batteryWarrantyYears
    ),
    km: pickFirstPresent(
      warranty.batteryKm,
      ownershipIntel.batteryWarrantyKm
    ),
    available:
      isPresent(warranty.batteryYears) ||
      isPresent(ownershipIntel.batteryWarrantyYears),
  };

  const serviceInterval = {
    km: pickFirstPresent(
      ownershipIntel.serviceIntervalKm,
      practicality.serviceIntervalKm,
      OWNERSHIP_ASSUMPTIONS.defaultServiceIntervalKm
    ),
    months: pickFirstPresent(
      ownershipIntel.serviceIntervalMonths,
      practicality.serviceIntervalMonths,
      OWNERSHIP_ASSUMPTIONS.defaultServiceIntervalMonths
    ),
    available:
      isPresent(ownershipIntel.serviceIntervalKm) ||
      isPresent(practicality.serviceIntervalKm),
    estimated: !(
      isPresent(ownershipIntel.serviceIntervalKm) ||
      isPresent(practicality.serviceIntervalKm)
    ),
  };

  const suitabilityIndicators = [];
  const suit = meta.suitabilityScores || {};
  if (suit.city >= 75) {
    suitabilityIndicators.push("Best for city commuting");
  }
  if (suit.highway >= 75) {
    suitabilityIndicators.push("Best for highway usage");
  }
  if (chargingIntel?.homeChargingSupported === true) {
    suitabilityIndicators.push("Home charging recommended");
  }
  if (
    chargingIntel?.homeChargingSupported === true &&
    suit.city >= 60
  ) {
    suitabilityIndicators.push("Apartment charging friendly (with AC point)");
  } else if (chargingIntel?.convenienceScore >= 70) {
    suitabilityIndicators.push("Public fast charging works well");
  }

  const catalogCost5yr = meta.ownershipCost5yr?.totalInr;
  const warrantySummary = buildWarrantySummary(batteryWarranty);
  const riskIndicators = buildRiskIndicators(
    car,
    chargingIntel,
    batteryWarranty
  );

  const hasPrice = Number(car?.startingPrice ?? car?.price) > 0;
  const hasRange =
    Number(car?.specifications?.range ?? car?.range) > 0;

  const hasData =
    hasPrice ||
    hasRange ||
    batteryWarranty.available ||
    isPresent(catalogCost5yr) ||
    isPresent(batteryKwh);

  return {
    monthlyChargingCostInr: costs.monthlyChargingCostInr,
    yearlyChargingCostInr: costs.yearlyChargingCostInr,
    yearlyKwhEstimate: costs.yearlyKwh,
    savingsVsPetrolYearlyInr: costs.savingsVsPetrolYearlyInr,
    assumptions,
    assumptionTransparency: {
      title: "How we estimate ownership costs",
      bullets: [
        `Driving: ${assumptions.monthlyKm} km/month assumed`,
        `Tariff: ~₹${assumptions.electricityRatePerKwh}/kWh blended (home + public)`,
        `Efficiency: ~${assumptions.efficiencyKmPerKwh} km/kWh (from specs or segment default)`,
        `Petrol comparison: ~₹${assumptions.petrolCostPerKm}/km hatchback reference`,
      ],
    },
    batteryWarranty,
    warrantySummary,
    serviceInterval,
    suitabilityIndicators,
    ownershipCost5yrInr: catalogCost5yr ?? UNAVAILABLE,
    degradationNote: OWNERSHIP_DEGRADATION_NOTE,
    savingsDisclaimer: OWNERSHIP_SAVINGS_DISCLAIMER,
    disclaimer: OWNERSHIP_ESTIMATE_DISCLAIMER,
    riskIndicators,
    estimated: true,
    hasData,
  };
}
