/**
 * Trusted Tier-1 productionization cohort (5 families).
 */

export const TIER1_PRODUCTIONIZATION_SLUGS = Object.freeze([
  "tata-nexon-ev",
  "tata-punch-ev",
  "tata-curvv-ev",
  "mg-zs-ev",
  "byd-atto-3",
]);

export const TIER1_PRODUCTIONIZATION_LABELS = Object.freeze({
  "tata-nexon-ev": "Tata Nexon EV",
  "tata-punch-ev": "Tata Punch EV",
  "tata-curvv-ev": "Tata Curvv EV",
  "mg-zs-ev": "MG ZS EV",
  "byd-atto-3": "BYD Atto 3",
});

export function isTier1ProductionizationSlug(slug = "") {
  return TIER1_PRODUCTIONIZATION_SLUGS.includes(
    String(slug || "").trim().toLowerCase()
  );
}

export function filterProductionizationCars(cars = []) {
  return cars.filter((c) =>
    isTier1ProductionizationSlug(
      c?.familySlug || c?.slug || c?.catalogMeta?.familySlug
    )
  );
}

/**
 * Default compare pairs for trust audits within cohort.
 */
export function defaultProductionizationComparePairs() {
  return [
    "tata-nexon-ev-vs-mg-zs-ev",
    "tata-punch-ev-vs-tata-nexon-ev",
    "tata-curvv-ev-vs-byd-atto-3",
    "mg-zs-ev-vs-byd-atto-3",
  ];
}
