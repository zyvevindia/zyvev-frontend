/**
 * Defaults and bounds for petrol vs EV savings calculator.
 */

export const PETROL_SAVINGS_DEFAULTS = Object.freeze({
  evPriceInr: 1500000,
  petrolPriceInr: 1500000,
  annualKm: 12000,
  ownershipYears: 5,
  homeTariffInr: 8,
  homeChargingPct: 80,
  efficiencyKmPerKwh: 6,
  petrolPricePerLitre: 105,
  petrolEfficiencyKmPerL: 15,
  evMaintenancePerKm: 0.5,
  petrolMaintenancePerKm: 1.5,
  evResidualPct: 50,
  petrolResidualPct: 45,
  evInsuranceRatePerYear: 0.015,
  petrolInsuranceRatePerYear: 0.0125,
});

export const PETROL_SAVINGS_BOUNDS = Object.freeze({
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
  petrolPriceMin: 80,
  petrolPriceMax: 150,
  petrolEfficiencyMin: 8,
  petrolEfficiencyMax: 30,
  evMaintenanceMin: 0.2,
  evMaintenanceMax: 2,
  petrolMaintenanceMin: 0.5,
  petrolMaintenanceMax: 3,
  residualPctMin: 30,
  residualPctMax: 70,
});

export const PETROL_SAVINGS_COLORS = Object.freeze({
  ev: "#0f766e",
  petrol: "#64748b",
  depreciation: "#64748b",
  energy: "#0f766e",
  fuel: "#dc2626",
  maintenance: "#f59e0b",
  insurance: "#2563eb",
});

export const SAVINGS_TONE_THRESHOLDS = Object.freeze({
  nearParityPct: 5,
});
