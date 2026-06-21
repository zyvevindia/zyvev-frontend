/**
 * Defaults and bounds for the TCO ownership calculator.
 */

export const TCO_DEFAULTS = Object.freeze({
  vehiclePriceInr: 1500000,
  annualKm: 12000,
  ownershipYears: 5,
  homeTariffInr: 8,
  homeChargingPct: 80,
  efficiencyKmPerKwh: 6,
  insuranceRatePerYear: 0.015,
  maintenanceCostPerKm: 0.5,
  residualValuePct: 50,
});

export const TCO_BOUNDS = Object.freeze({
  vehiclePriceMin: 500000,
  vehiclePriceMax: 10000000,
  annualKmMin: 5000,
  annualKmMax: 30000,
  ownershipYearsMin: 3,
  ownershipYearsMax: 8,
  homeTariffMin: 4,
  homeTariffMax: 20,
  homeChargingPctMin: 0,
  homeChargingPctMax: 100,
  efficiencyMin: 3,
  efficiencyMax: 12,
  maintenanceCostPerKmMin: 0.2,
  maintenanceCostPerKmMax: 2,
  insurancePerYearMin: 5000,
  insurancePerYearMax: 500000,
  residualValuePctMin: 30,
  residualValuePctMax: 70,
});

export const TCO_BREAKDOWN_COLORS = Object.freeze({
  depreciation: "#64748b",
  energy: "#0f766e",
  maintenance: "#f59e0b",
  insurance: "#2563eb",
});
