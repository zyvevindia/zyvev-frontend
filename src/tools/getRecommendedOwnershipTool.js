import { buildPersonas, buildPersonaContext } from "../intelligence/buildPersonas.js";
import { buildFamilyScore } from "../intelligence/buildFamilyScore.js";
import { PREMIUM_PRICE_THRESHOLD_INR } from "../intelligence/personaRules.js";

/** ₹18 lakh — budget EV price tier threshold */
export const BUDGET_PRICE_THRESHOLD_INR = 1_800_000;

const FAMILY_SCORE_THRESHOLD = 75;

/** @typedef {"cost-per-km"|"tco"|"savings-vs-petrol"|"emi"} OwnershipToolId */

/**
 * @typedef {Object} OwnershipToolRecommendation
 * @property {OwnershipToolId} id
 * @property {string} path
 * @property {string} title
 * @property {string} headline
 * @property {string} description
 * @property {string} ctaLabel
 * @property {"cost-per-km"|"tco"|"savings"|"emi"} icon
 */

/** @type {Record<OwnershipToolId, OwnershipToolRecommendation>} */
export const OWNERSHIP_TOOL_RECOMMENDATIONS = Object.freeze({
  "cost-per-km": {
    id: "cost-per-km",
    path: "/tools/cost-per-km",
    title: "Cost per km",
    headline: "Estimate running cost per kilometre",
    description:
      "See what each kilometre costs with your home charging and driving pattern.",
    ctaLabel: "Calculate cost per km",
    icon: "cost-per-km",
  },
  tco: {
    id: "tco",
    path: "/tools/tco",
    title: "Total Cost of Ownership",
    headline: "Estimate your long-term ownership cost",
    description:
      "Model depreciation, charging, maintenance, and insurance over five years.",
    ctaLabel: "Calculate TCO",
    icon: "tco",
  },
  "savings-vs-petrol": {
    id: "savings-vs-petrol",
    path: "/tools/savings-vs-petrol",
    title: "Petrol vs EV Savings",
    headline: "See how much you save versus petrol",
    description:
      "Compare lifetime running and ownership cost against an equivalent petrol car.",
    ctaLabel: "Compare savings",
    icon: "savings",
  },
  emi: {
    id: "emi",
    path: "/tools/emi",
    title: "EMI Calculator",
    headline: "Calculate monthly EMI",
    description:
      "Estimate loan EMI and total finance outflow before you book the vehicle.",
    ctaLabel: "Calculate EMI",
    icon: "emi",
  },
});

/**
 * @template T
 * @param {() => T} buildFn
 * @returns {T|null}
 */
function safeBuild(buildFn) {
  try {
    return buildFn();
  } catch {
    return null;
  }
}

/**
 * Deterministic ownership-tool recommendation from EV intelligence personas.
 * Priority: Value/Budget → Petrol Savings; City/Apartment → Cost per km;
 * Premium/Family → EMI; default → TCO.
 * @param {object|null|undefined} vehicle
 * @returns {OwnershipToolRecommendation}
 */
export function resolveRecommendedOwnershipToolId(vehicle) {
  if (!vehicle) return "tco";

  const personas = safeBuild(() => buildPersonas(vehicle).personas) ?? [];
  const personaSet = new Set(personas);
  const ctx = safeBuild(() => buildPersonaContext(vehicle)) ?? {};
  const startingPrice = ctx.startingPrice ?? null;
  const familyScore = safeBuild(() => buildFamilyScore(vehicle).score);

  const isBudgetEv =
    personaSet.has("Value EV") ||
    (startingPrice != null && startingPrice <= BUDGET_PRICE_THRESHOLD_INR);

  if (isBudgetEv) return "savings-vs-petrol";

  const isCityEv =
    personaSet.has("City EV") || personaSet.has("Apartment EV");
  if (isCityEv) return "cost-per-km";

  const isPremiumEv =
    personaSet.has("Premium EV") ||
    (startingPrice != null && startingPrice >= PREMIUM_PRICE_THRESHOLD_INR);

  const isFamilyEv =
    familyScore != null && familyScore >= FAMILY_SCORE_THRESHOLD;

  if (isPremiumEv || isFamilyEv) return "emi";

  return "tco";
}

/**
 * @param {object|null|undefined} vehicle
 * @returns {OwnershipToolRecommendation}
 */
export function getRecommendedOwnershipTool(vehicle) {
  const id = resolveRecommendedOwnershipToolId(vehicle);
  return OWNERSHIP_TOOL_RECOMMENDATIONS[id];
}
