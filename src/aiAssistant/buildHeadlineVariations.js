/**
 * Deterministic headline variations for assistant recommendations.
 */

import { BUYER_ARCHETYPE_IDS } from "../recommendations/constants.js";
import { FIT_TIERS } from "../recommendations/fitConstants.js";
import { selectNarrativeVariation } from "./selectNarrativeVariation.js";

/** @type {Record<string, Record<string, string[]>>} */
const HEADLINE_VARIATIONS = Object.freeze({
  [BUYER_ARCHETYPE_IDS.FAMILY_BUYER]: Object.freeze({
    [FIT_TIERS.EXCELLENT]: Object.freeze([
      "Excellent choice for families.",
      "A standout option for family-focused buyers.",
      "Families are likely to appreciate this EV.",
      "Well matched to household needs.",
      "Recommended for buyers prioritising family usability.",
      "A practical pick for everyday family use.",
      "Strong family practicality in everyday use.",
      "Well suited to school runs and weekend trips.",
    ]),
    [FIT_TIERS.GOOD]: Object.freeze([
      "Strong choice for families.",
      "Well suited to family-focused buyers.",
      "Families are likely to appreciate this EV.",
      "A practical option for households.",
      "Recommended for buyers prioritising family usability.",
      "A sensible fit for family day-to-day driving.",
      "Balances family practicality with ownership ease.",
      "A compelling option for growing households.",
    ]),
    [FIT_TIERS.MODERATE]: Object.freeze([
      "A workable option for family buyers.",
      "Family use is possible with some trade-offs.",
      "Households may find it usable with planning.",
      "Practical for some family routines.",
      "Worth considering for smaller households.",
      "Family buyers should weigh space and charging needs.",
    ]),
    [FIT_TIERS.LIMITED]: Object.freeze([
      "Limited fit for family-focused buyers.",
      "Family practicality may feel constrained.",
      "Households should compare space carefully.",
      "May not suit larger family routines.",
    ]),
    [FIT_TIERS.INSUFFICIENT]: Object.freeze([
      "Not ideal for family-focused buyers.",
      "Family practicality is unlikely to feel sufficient.",
      "Households may prefer more versatile alternatives.",
    ]),
  }),
  [BUYER_ARCHETYPE_IDS.CITY_COMMUTER]: Object.freeze({
    [FIT_TIERS.EXCELLENT]: Object.freeze([
      "Excellent fit for urban commuters.",
      "Well suited to predictable city driving.",
      "A strong match for daily city routes.",
      "City buyers are likely to appreciate this EV.",
      "Recommended for low-stress urban commuting.",
      "A practical option for stop-start traffic.",
      "Strong city usability for everyday errands.",
    ]),
    [FIT_TIERS.GOOD]: Object.freeze([
      "Solid fit for urban commuters.",
      "Well suited to city-focused buyers.",
      "A practical option for daily commuting.",
      "Recommended for predictable urban routes.",
      "City drivers are likely to find it workable.",
      "Strong everyday usability in urban settings.",
      "A sensible pick for local driving.",
    ]),
    [FIT_TIERS.MODERATE]: Object.freeze([
      "Workable for urban commuting with trade-offs.",
      "City use is possible with some planning.",
      "Urban buyers should weigh charging convenience.",
      "A moderate fit for local driving.",
    ]),
    [FIT_TIERS.LIMITED]: Object.freeze([
      "Limited fit for city-focused commuting.",
      "Urban practicality may feel constrained.",
      "City buyers may want more compact alternatives.",
    ]),
    [FIT_TIERS.INSUFFICIENT]: Object.freeze([
      "Not ideal for predictable urban commuting.",
      "City-focused buyers may find better matches.",
    ]),
  }),
  [BUYER_ARCHETYPE_IDS.HIGHWAY_TRAVELLER]: Object.freeze({
    [FIT_TIERS.EXCELLENT]: Object.freeze([
      "Excellent fit for regular highway travel.",
      "Well suited to long-distance drivers.",
      "Highway buyers are likely to appreciate this EV.",
      "A confident option for inter-city routes.",
      "Recommended for frequent highway use.",
      "Strong range confidence on longer trips.",
    ]),
    [FIT_TIERS.GOOD]: Object.freeze([
      "Capable choice for regular highway travel.",
      "Well suited to highway-focused buyers.",
      "A practical option for longer distances.",
      "Recommended for mixed highway routines.",
      "Highway use is likely to feel manageable.",
      "Sensible for drivers who travel beyond the city.",
    ]),
    [FIT_TIERS.MODERATE]: Object.freeze([
      "Highway use is possible, but planning matters.",
      "Long-distance buyers should plan charging stops.",
      "Workable on highways with thoughtful routing.",
    ]),
    [FIT_TIERS.LIMITED]: Object.freeze([
      "Long-distance use may require careful planning.",
      "Highway capability feels limited for frequent travel.",
    ]),
    [FIT_TIERS.INSUFFICIENT]: Object.freeze([
      "Not designed primarily for frequent long-distance driving.",
      "Highway-focused buyers may prefer stronger range options.",
    ]),
  }),
  [BUYER_ARCHETYPE_IDS.BUDGET_BUYER]: Object.freeze({
    [FIT_TIERS.EXCELLENT]: Object.freeze([
      "Excellent value for budget-conscious buyers.",
      "Well suited to value-focused shoppers.",
      "A strong match for cost-conscious ownership.",
      "Recommended for buyers prioritising purchase value.",
      "Sensible economics for budget-minded buyers.",
    ]),
    [FIT_TIERS.GOOD]: Object.freeze([
      "Strong value for budget-conscious buyers.",
      "Well suited to value-focused buyers.",
      "A practical option for cost-conscious shoppers.",
      "Recommended for buyers prioritising running costs.",
      "Attractive ownership economics at this price.",
      "A thoughtful pick for budget-focused buyers.",
    ]),
    [FIT_TIERS.MODERATE]: Object.freeze([
      "Moderate value for budget-focused buyers.",
      "Cost-conscious buyers should compare ownership closely.",
      "Workable value with some trade-offs.",
    ]),
    [FIT_TIERS.LIMITED]: Object.freeze([
      "Limited value at this price point.",
      "Budget buyers may find stronger alternatives.",
    ]),
    [FIT_TIERS.INSUFFICIENT]: Object.freeze([
      "Not ideal for budget-focused buyers.",
      "Value-focused shoppers may prefer lower-cost options.",
    ]),
  }),
  [BUYER_ARCHETYPE_IDS.PREMIUM_BUYER]: Object.freeze({
    [FIT_TIERS.EXCELLENT]: Object.freeze([
      "Premium buyers are likely to appreciate this EV.",
      "A standout option for discerning buyers.",
      "Well matched to premium ownership expectations.",
      "Recommended for buyers seeking refinement.",
      "Strong premium appeal in everyday use.",
    ]),
    [FIT_TIERS.GOOD]: Object.freeze([
      "A compelling option for premium buyers.",
      "Well suited to buyers seeking refinement.",
      "Premium-focused buyers may find it appealing.",
      "Recommended for a elevated ownership experience.",
      "Balances premium appeal with everyday usability.",
    ]),
    [FIT_TIERS.MODERATE]: Object.freeze([
      "Some premium appeal, with notable trade-offs.",
      "Premium buyers should compare refinement closely.",
      "Workable premium option with compromises.",
    ]),
    [FIT_TIERS.LIMITED]: Object.freeze([
      "Limited premium appeal for discerning buyers.",
      "Premium expectations may not be fully met.",
    ]),
    [FIT_TIERS.INSUFFICIENT]: Object.freeze([
      "Not aligned with premium buyer expectations.",
      "Discerning buyers may prefer more refined alternatives.",
    ]),
  }),
  [BUYER_ARCHETYPE_IDS.APARTMENT_OWNER]: Object.freeze({
    [FIT_TIERS.EXCELLENT]: Object.freeze([
      "Strong fit for apartment-focused buyers.",
      "Well suited to limited home charging setups.",
      "Apartment owners are likely to appreciate this EV.",
      "Recommended when home charging is constrained.",
      "Practical with thoughtful charging planning.",
    ]),
    [FIT_TIERS.GOOD]: Object.freeze([
      "Workable for apartment owners with charging plans.",
      "Well suited to society and public charging routines.",
      "A practical option without dedicated home charging.",
      "Recommended for apartment-focused buyers.",
      "Usable when charging access needs planning.",
    ]),
    [FIT_TIERS.MODERATE]: Object.freeze([
      "Usable for apartment owners, with charging trade-offs.",
      "Charging convenience may need extra planning.",
      "Workable with a clear public charging routine.",
    ]),
    [FIT_TIERS.LIMITED]: Object.freeze([
      "Limited fit when home charging is constrained.",
      "Apartment buyers should confirm charging access.",
    ]),
    [FIT_TIERS.INSUFFICIENT]: Object.freeze([
      "Not ideal for apartment-focused charging needs.",
      "Limited-charging buyers may prefer other options.",
    ]),
  }),
  [BUYER_ARCHETYPE_IDS.FIRST_TIME_EV_BUYER]: Object.freeze({
    [FIT_TIERS.EXCELLENT]: Object.freeze([
      "Excellent first EV for new electric owners.",
      "Well suited to first-time EV buyers.",
      "A approachable option for new EV ownership.",
      "Recommended for buyers new to electric driving.",
      "Straightforward ownership for EV newcomers.",
    ]),
    [FIT_TIERS.GOOD]: Object.freeze([
      "Strong first EV for new electric owners.",
      "Well suited to buyers entering EV ownership.",
      "A manageable first EV with practical support.",
      "Recommended for first-time electric buyers.",
      "Approachable for buyers learning EV routines.",
    ]),
    [FIT_TIERS.MODERATE]: Object.freeze([
      "A manageable first EV with some learning curve.",
      "First-time buyers should plan charging routines.",
      "Workable entry into EV ownership.",
    ]),
    [FIT_TIERS.LIMITED]: Object.freeze([
      "May feel demanding as a first EV.",
      "New EV owners may want simpler alternatives.",
    ]),
    [FIT_TIERS.INSUFFICIENT]: Object.freeze([
      "Not ideal as a first EV for most buyers.",
      "First-time buyers may prefer easier options.",
    ]),
  }),
});

/**
 * @param {{
 *   vehicleSlug?: string,
 *   archetypeId?: string,
 *   fitTier?: string,
 *   fallback?: string,
 * }} params
 * @returns {string[]}
 */
export function buildHeadlineVariations({
  vehicleSlug = "",
  archetypeId = "",
  fitTier = "",
  fallback = "",
} = {}) {
  const byArchetype = HEADLINE_VARIATIONS[archetypeId];
  const variants = byArchetype?.[fitTier] || [];

  if (variants.length) {
    return [...variants];
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
 *   fallback?: string,
 * }} params
 * @returns {string}
 */
export function selectAssistantHeadline({
  vehicleSlug,
  archetypeId,
  fitTier,
  fallback = "",
}) {
  const variants = buildHeadlineVariations({
    vehicleSlug,
    archetypeId,
    fitTier,
    fallback,
  });

  if (!variants.length) {
    return fallback;
  }

  return (
    selectNarrativeVariation(
      variants,
      `${vehicleSlug}::${archetypeId}::${fitTier}::headline`
    ) || fallback
  );
}
