/** @typedef {import("./types.js").ServiceNetworkContext} ServiceNetworkContext */

export const SERVICE_NETWORK_LABELS = Object.freeze([
  { min: 80, label: "Excellent service confidence" },
  { min: 65, label: "Good service confidence" },
  { min: 50, label: "Moderate service confidence" },
  { min: 0, label: "Limited service coverage" },
]);

/** Default score for brands not yet mapped to a service tier */
export const SERVICE_NETWORK_DEFAULT_SCORE = 55;

/**
 * Canonical brand aliases for deterministic tier lookup.
 * Future dealer/service-center data can replace tier tables without engine changes.
 */
export const SERVICE_NETWORK_BRAND_ALIASES = Object.freeze({
  mini: "MINI",
  "mercedes benz": "Mercedes-Benz",
  mercedes: "Mercedes-Benz",
  "mercedes-benz": "Mercedes-Benz",
  citroën: "Citroen",
  "maruti suzuki": "Maruti Suzuki",
});

/**
 * Declarative OEM service reach tiers (India market, 2026 baseline).
 * @type {ReadonlyArray<{
 *   id: string,
 *   minScore: number,
 *   maxScore: number,
 *   brands: Readonly<Record<string, number>>
 * }>}
 */
export const SERVICE_NETWORK_TIERS = Object.freeze([
  {
    id: "tier1",
    minScore: 80,
    maxScore: 95,
    brands: Object.freeze({
      Tata: 90,
      Mahindra: 88,
      MG: 86,
      Hyundai: 92,
    }),
  },
  {
    id: "tier2",
    minScore: 60,
    maxScore: 80,
    brands: Object.freeze({
      BYD: 72,
      Citroen: 68,
      BMW: 70,
      Mercedes: 74,
      "Mercedes-Benz": 74,
      Kia: 76,
    }),
  },
  {
    id: "tier3",
    minScore: 40,
    maxScore: 60,
    brands: Object.freeze({
      MINI: 45,
      Mini: 45,
      Volvo: 52,
      Porsche: 48,
    }),
  },
]);

/**
 * @param {string|null|undefined} rawBrand
 * @returns {string|null}
 */
export function normalizeServiceNetworkBrand(rawBrand) {
  if (rawBrand == null || rawBrand === "") return null;

  const trimmed = String(rawBrand).trim();
  if (!trimmed) return null;

  const aliasKey = trimmed.toLowerCase();
  if (SERVICE_NETWORK_BRAND_ALIASES[aliasKey]) {
    return SERVICE_NETWORK_BRAND_ALIASES[aliasKey];
  }

  for (const tier of SERVICE_NETWORK_TIERS) {
    if (tier.brands[trimmed] != null) return trimmed;
  }

  const titleCase = trimmed
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");

  if (SERVICE_NETWORK_BRAND_ALIASES[titleCase.toLowerCase()]) {
    return SERVICE_NETWORK_BRAND_ALIASES[titleCase.toLowerCase()];
  }

  for (const tier of SERVICE_NETWORK_TIERS) {
    if (tier.brands[titleCase] != null) return titleCase;
  }

  return trimmed;
}

/**
 * @param {string|null|undefined} brand
 * @returns {number|null}
 */
export function resolveServiceNetworkBrandScore(brand) {
  const normalized = normalizeServiceNetworkBrand(brand);
  if (!normalized) return null;

  for (const tier of SERVICE_NETWORK_TIERS) {
    const score = tier.brands[normalized];
    if (score != null) {
      return Math.min(tier.maxScore, Math.max(tier.minScore, score));
    }
  }

  return null;
}

/**
 * @param {number|null|undefined} score
 * @returns {string}
 */
export function resolveServiceNetworkLabel(score) {
  const n = Number(score);
  if (!Number.isFinite(n)) return SERVICE_NETWORK_LABELS.at(-1).label;

  for (const tier of SERVICE_NETWORK_LABELS) {
    if (n >= tier.min) return tier.label;
  }

  return SERVICE_NETWORK_LABELS.at(-1).label;
}

/**
 * @param {ServiceNetworkContext} ctx
 * @returns {number}
 */
export function computeServiceNetworkScore(ctx) {
  const score = resolveServiceNetworkBrandScore(ctx.brand);
  return score ?? SERVICE_NETWORK_DEFAULT_SCORE;
}

/**
 * @param {ServiceNetworkContext} ctx
 * @returns {import("./types.js").ServiceNetworkScoreResult}
 */
export function applyServiceNetworkRules(ctx) {
  const score = computeServiceNetworkScore(ctx);

  return {
    score,
    label: resolveServiceNetworkLabel(score),
  };
}
