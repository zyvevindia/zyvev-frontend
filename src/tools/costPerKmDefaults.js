/**
 * Defaults and bounds for the cost-per-km ownership calculator.
 */

export const COST_PER_KM_DEFAULTS = Object.freeze({
  homeTariffInr: 8,
  homeChargingPct: 80,
  efficiencyKmPerKwh: 6,
  monthlyKm: 1000,
  yearlyKm: 12000,
});

export const COST_PER_KM_BOUNDS = Object.freeze({
  homeTariffMin: 4,
  homeTariffMax: 20,
  homeChargingPctMin: 0,
  homeChargingPctMax: 100,
  efficiencyMin: 3,
  efficiencyMax: 12,
});

export const COST_PER_KM_PUBLIC_MULTIPLIER = 2;

export const COST_PER_KM_ICE_REFERENCE = Object.freeze({
  petrol: "Petrol car (₹7–9/km)",
  diesel: "Diesel car (₹5–7/km)",
});

export const COST_PER_KM_SAVINGS_TIERS = Object.freeze([
  { max: 1.5, label: "Low cost", tone: "low" },
  { max: 2.5, label: "Moderate", tone: "moderate" },
  { max: Infinity, label: "High", tone: "high" },
]);
