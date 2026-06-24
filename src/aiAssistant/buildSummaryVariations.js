/**
 * Deterministic summary variations for assistant recommendations.
 */

import { BUYER_ARCHETYPE_IDS } from "../recommendations/constants.js";
import { FIT_TIERS } from "../recommendations/fitConstants.js";
import { selectNarrativeVariation } from "./selectNarrativeVariation.js";

/** @type {Record<string, Record<string, string[]>>} */
const SUMMARY_VARIATIONS = Object.freeze({
  [BUYER_ARCHETYPE_IDS.FAMILY_BUYER]: Object.freeze({
    [FIT_TIERS.EXCELLENT]: Object.freeze([
      "{name} offers strong family practicality with sensible ownership support for everyday household driving.",
      "{name} balances cabin usability and service access in a way family buyers are likely to appreciate.",
      "For households needing versatile day-to-day transport, {name} is a compelling match.",
      "{name} fits buyers who prioritise family usability without overspending on unused capability.",
      "Family-focused buyers are likely to find {name} practical for school runs, errands, and weekend trips.",
    ]),
    [FIT_TIERS.GOOD]: Object.freeze([
      "{name} aligns well with family routines and offers practical ownership for mixed daily use.",
      "Households focused on usability are likely to find {name} a sensible everyday option.",
      "{name} supports family buyers who want practical space and predictable running costs.",
      "For buyers prioritising family usability, {name} remains a thoughtful option to review.",
      "{name} is a workable match for families balancing city use and occasional longer trips.",
    ]),
    [FIT_TIERS.MODERATE]: Object.freeze([
      "{name} can work for some family routines, though buyers should weigh space and charging needs.",
      "Family buyers may find {name} usable with planning, especially for smaller households.",
      "{name} offers partial family practicality — compare cabin and charging fit before deciding.",
    ]),
    [FIT_TIERS.LIMITED]: Object.freeze([
      "{name} may feel constrained for family-focused buyers who need more space or flexibility.",
      "Households should compare {name} carefully against alternatives with stronger family practicality.",
    ]),
    [FIT_TIERS.INSUFFICIENT]: Object.freeze([
      "{name} is unlikely to meet the day-to-day needs of most family-focused buyers.",
      "Family buyers may prefer alternatives with stronger space and usability for household routines.",
    ]),
  }),
  [BUYER_ARCHETYPE_IDS.CITY_COMMUTER]: Object.freeze({
    [FIT_TIERS.EXCELLENT]: Object.freeze([
      "{name} is well matched to predictable urban routes and low-stress daily commuting.",
      "City commuters are likely to appreciate {name} for easy manoeuvrability and ownership economics.",
      "{name} suits buyers who want straightforward city usability without highway-first compromises.",
      "For urban-focused driving, {name} offers practical day-to-day usability.",
      "{name} fits buyers who mainly drive locally and value running-cost efficiency.",
    ]),
    [FIT_TIERS.GOOD]: Object.freeze([
      "{name} is a sensible option for city-focused buyers with regular local driving.",
      "Urban commuters may find {name} practical for errands, work commutes, and short trips.",
      "{name} supports city buyers who want manageable charging and everyday usability.",
      "For predictable city use, {name} remains a relevant option to compare.",
    ]),
    [FIT_TIERS.MODERATE]: Object.freeze([
      "{name} can work for some city routines, though charging and size should be reviewed.",
      "City buyers may find {name} usable with trade-offs in tight parking or heavy traffic.",
    ]),
    [FIT_TIERS.LIMITED]: Object.freeze([
      "{name} may feel less ideal for buyers who need compact, efficient city usability.",
      "Urban commuters should compare {name} against more city-focused alternatives.",
    ]),
    [FIT_TIERS.INSUFFICIENT]: Object.freeze([
      "{name} is unlikely to suit buyers who need strong city-focused practicality.",
    ]),
  }),
  [BUYER_ARCHETYPE_IDS.HIGHWAY_TRAVELLER]: Object.freeze({
    [FIT_TIERS.EXCELLENT]: Object.freeze([
      "{name} offers confident highway usability for buyers who travel longer distances regularly.",
      "Highway-focused buyers are likely to appreciate {name} for range and charging practicality.",
      "{name} suits inter-city routines where range confidence matters.",
      "For frequent highway use, {name} is a strong option to review in detail.",
    ]),
    [FIT_TIERS.GOOD]: Object.freeze([
      "{name} supports highway routines with sensible range and charging expectations.",
      "Buyers who mix city and highway use may find {name} a capable everyday option.",
      "{name} fits drivers who need workable long-distance usability without premium overspend.",
    ]),
    [FIT_TIERS.MODERATE]: Object.freeze([
      "{name} can handle some highway use, but charging and range planning will matter.",
      "Highway buyers should review {name} against alternatives with stronger long-distance confidence.",
    ]),
    [FIT_TIERS.LIMITED]: Object.freeze([
      "{name} may require careful planning for regular long-distance travel.",
    ]),
    [FIT_TIERS.INSUFFICIENT]: Object.freeze([
      "{name} is unlikely to suit buyers who depend on frequent highway travel.",
    ]),
  }),
  [BUYER_ARCHETYPE_IDS.BUDGET_BUYER]: Object.freeze({
    [FIT_TIERS.EXCELLENT]: Object.freeze([
      "{name} delivers strong purchase value and ownership economics for cost-conscious buyers.",
      "Value-focused shoppers are likely to appreciate how {name} balances price and running costs.",
      "{name} fits buyers who want sensible EV ownership without overspending.",
      "For budget-minded buyers, {name} offers attractive everyday economics.",
    ]),
    [FIT_TIERS.GOOD]: Object.freeze([
      "{name} remains a thoughtful option for buyers prioritising value and running costs.",
      "Cost-conscious buyers may find {name} practical for everyday ownership.",
      "{name} aligns with shoppers who want sensible purchase value at this budget.",
    ]),
    [FIT_TIERS.MODERATE]: Object.freeze([
      "{name} offers moderate value — compare total ownership costs before deciding.",
    ]),
    [FIT_TIERS.LIMITED]: Object.freeze([
      "{name} may feel expensive relative to the value priorities in this brief.",
    ]),
    [FIT_TIERS.INSUFFICIENT]: Object.freeze([
      "{name} is unlikely to meet the value expectations of budget-focused buyers.",
    ]),
  }),
  [BUYER_ARCHETYPE_IDS.PREMIUM_BUYER]: Object.freeze({
    [FIT_TIERS.EXCELLENT]: Object.freeze([
      "{name} offers refinement and capability that premium buyers are likely to appreciate.",
      "Discerning buyers may find {name} compelling for comfort, performance, and ownership experience.",
      "{name} suits shoppers who accept a higher purchase price for a premium EV experience.",
    ]),
    [FIT_TIERS.GOOD]: Object.freeze([
      "{name} delivers meaningful premium appeal for buyers seeking an elevated ownership experience.",
      "Premium-focused buyers may find {name} a relevant option among higher-end alternatives.",
    ]),
    [FIT_TIERS.MODERATE]: Object.freeze([
      "{name} has some premium appeal, though buyers should compare refinement closely.",
    ]),
    [FIT_TIERS.LIMITED]: Object.freeze([
      "{name} may not fully meet premium buyer expectations for refinement.",
    ]),
    [FIT_TIERS.INSUFFICIENT]: Object.freeze([
      "{name} is unlikely to align with premium buyer expectations at this budget.",
    ]),
  }),
  [BUYER_ARCHETYPE_IDS.APARTMENT_OWNER]: Object.freeze({
    [FIT_TIERS.EXCELLENT]: Object.freeze([
      "{name} works well when home charging is limited and public charging fills the gap.",
      "Apartment-focused buyers are likely to find {name} practical with a clear charging routine.",
      "{name} suits buyers who plan around society or workplace charging access.",
    ]),
    [FIT_TIERS.GOOD]: Object.freeze([
      "{name} is workable for apartment owners who can plan charging around daily routines.",
      "Buyers without dedicated home charging may find {name} manageable with planning.",
    ]),
    [FIT_TIERS.MODERATE]: Object.freeze([
      "{name} may need extra charging planning for apartment-focused buyers.",
    ]),
    [FIT_TIERS.LIMITED]: Object.freeze([
      "{name} may feel challenging when reliable home charging is unavailable.",
    ]),
    [FIT_TIERS.INSUFFICIENT]: Object.freeze([
      "{name} is unlikely to suit buyers who depend on convenient apartment charging.",
    ]),
  }),
  [BUYER_ARCHETYPE_IDS.FIRST_TIME_EV_BUYER]: Object.freeze({
    [FIT_TIERS.EXCELLENT]: Object.freeze([
      "{name} offers approachable ownership for buyers new to electric driving.",
      "First-time EV buyers are likely to find {name} straightforward to live with day to day.",
      "{name} suits shoppers entering EV ownership who want practical support and clarity.",
    ]),
    [FIT_TIERS.GOOD]: Object.freeze([
      "{name} is a manageable first EV with sensible ownership expectations.",
      "New EV owners may find {name} practical while they build charging routines.",
    ]),
    [FIT_TIERS.MODERATE]: Object.freeze([
      "{name} can work as a first EV, though buyers should confirm charging feels manageable.",
    ]),
    [FIT_TIERS.LIMITED]: Object.freeze([
      "{name} may feel demanding for buyers new to EV ownership.",
    ]),
    [FIT_TIERS.INSUFFICIENT]: Object.freeze([
      "{name} is unlikely to be an easy first EV for most new electric buyers.",
    ]),
  }),
});

/**
 * @param {string} template
 * @param {string} vehicleName
 * @returns {string}
 */
function applyVehicleName(template, vehicleName) {
  return String(template || "").replace(/\{name\}/g, vehicleName || "This EV");
}

/**
 * @param {{
 *   vehicleSlug?: string,
 *   archetypeId?: string,
 *   fitTier?: string,
 *   vehicleName?: string,
 *   fallback?: string,
 * }} params
 * @returns {string[]}
 */
export function buildSummaryVariations({
  vehicleSlug = "",
  archetypeId = "",
  fitTier = "",
  vehicleName = "This EV",
  fallback = "",
} = {}) {
  const byArchetype = SUMMARY_VARIATIONS[archetypeId];
  const templates = byArchetype?.[fitTier] || [];
  const variants = templates.map((template) =>
    applyVehicleName(template, vehicleName)
  );

  if (variants.length) {
    return variants;
  }

  if (fallback) {
    return [fallback];
  }

  return [];
}

/**
 * @param {{
 *   vehicleSlug: string,
 *   archetypeId: string,
 *   fitTier: string,
 *   vehicleName: string,
 *   fallback?: string,
 * }} params
 * @returns {string}
 */
export function selectAssistantSummary({
  vehicleSlug,
  archetypeId,
  fitTier,
  vehicleName,
  fallback = "",
}) {
  const variants = buildSummaryVariations({
    vehicleSlug,
    archetypeId,
    fitTier,
    vehicleName,
    fallback,
  });

  if (!variants.length) {
    return fallback;
  }

  return (
    selectNarrativeVariation(
      variants,
      `${vehicleSlug}::${archetypeId}::${fitTier}::summary`
    ) || fallback
  );
}
