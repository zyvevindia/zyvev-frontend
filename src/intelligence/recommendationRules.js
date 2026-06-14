/** @typedef {import("./types.js").RecommendationContext} RecommendationContext */

export const RECOMMENDATION_LIMITS = Object.freeze({
  maxBestFor: 4,
  maxAvoidFor: 2,
});

/**
 * @typedef {Object} RecommendationRule
 * @property {string} id
 * @property {(ctx: RecommendationContext) => boolean} when
 * @property {string} label
 * @property {number} [priority]
 * @property {string} [group] Mutually exclusive labels in the same group
 */

/** @type {RecommendationRule[]} */
export const RECOMMENDATION_BEST_FOR_RULES = [
  {
    id: "highway",
    priority: 100,
    when: (ctx) =>
      ctx.highwayPersonaScore != null && ctx.highwayPersonaScore > 80,
    label: "Frequent highway travel",
  },
  {
    id: "long-distance",
    priority: 99,
    when: (ctx) =>
      ctx.highwayPersonaScore != null &&
      ctx.highwayPersonaScore > 80 &&
      ctx.highwayPlanningRangeKm != null &&
      ctx.highwayPlanningRangeKm >= 250,
    label: "Long-distance touring",
  },
  {
    id: "first-ev",
    priority: 98,
    when: (ctx) => ctx.overallScore != null && ctx.overallScore > 80,
    label: "First EV buyers",
  },
  {
    id: "first-ev-capable",
    priority: 97,
    when: (ctx) =>
      ctx.overallScore != null &&
      ctx.overallScore >= 55 &&
      ctx.highwayPersonaScore != null &&
      ctx.highwayPersonaScore > 80 &&
      ctx.chargingPracticalityScore != null &&
      ctx.chargingPracticalityScore >= 80,
    label: "First EV buyers",
  },
  {
    id: "city-strong",
    group: "city",
    priority: 96,
    when: (ctx) => ctx.cityScore != null && ctx.cityScore > 80,
    label: "City Driving",
  },
  {
    id: "apartment",
    priority: 95,
    when: (ctx) =>
      ctx.apartmentScore != null &&
      ctx.apartmentScore >= 75 &&
      ctx.highwayPlanningRangeKm != null &&
      ctx.highwayPlanningRangeKm < 250,
    label: "Apartment Living",
  },
  {
    id: "ownership-budget",
    priority: 94,
    when: (ctx) =>
      ctx.ownershipCostScore != null &&
      ctx.ownershipCostScore > 80 &&
      ctx.highwayPersonaScore != null &&
      ctx.highwayPersonaScore <= 80,
    label: "Budget-conscious buyers",
  },
  {
    id: "city-apartment",
    group: "city",
    priority: 93,
    when: (ctx) =>
      ctx.cityScore != null &&
      ctx.cityScore >= 65 &&
      ctx.apartmentScore != null &&
      ctx.apartmentScore >= 75 &&
      ctx.highwayPlanningRangeKm != null &&
      ctx.highwayPlanningRangeKm < 220,
    label: "City Driving",
  },
  {
    id: "city-compact",
    group: "city",
    priority: 92,
    when: (ctx) =>
      ctx.apartmentScore != null &&
      ctx.apartmentScore >= 75 &&
      ctx.highwayPlanningRangeKm != null &&
      ctx.highwayPlanningRangeKm < 180 &&
      ctx.chargingPracticalityScore != null &&
      ctx.chargingPracticalityScore >= 85,
    label: "City Driving",
  },
  {
    id: "value",
    priority: 90,
    when: (ctx) => ctx.valueScore != null && ctx.valueScore > 75,
    label: "Value seekers",
  },
];

/** @type {RecommendationRule[]} */
export const RECOMMENDATION_AVOID_FOR_RULES = [
  {
    id: "avoid-highway",
    priority: 100,
    when: (ctx) => ctx.highwayScore != null && ctx.highwayScore < 50,
    label: "Frequent highway trips",
  },
  {
    id: "avoid-highway-moderate",
    priority: 95,
    when: (ctx) =>
      ctx.highwayScore != null &&
      ctx.highwayScore >= 50 &&
      ctx.highwayScore < 65 &&
      ctx.highwayPlanningRangeKm != null &&
      ctx.highwayPlanningRangeKm < 180,
    label: "Frequent highway trips",
  },
  {
    id: "avoid-remote",
    priority: 90,
    when: (ctx) =>
      ctx.chargingPracticalityScore != null &&
      ctx.chargingPracticalityScore < 50,
    label: "Remote travel",
  },
];

/**
 * @param {RecommendationRule[]} rules
 * @param {RecommendationContext} ctx
 * @param {number} limit
 * @returns {string[]}
 */
export function applyRecommendationRules(rules, ctx, limit) {
  const byGroup = new Map();
  const ungrouped = [];

  for (const rule of rules) {
    if (!rule.when(ctx)) continue;

    if (rule.group) {
      const existing = byGroup.get(rule.group);
      if (!existing || (rule.priority ?? 0) > (existing.priority ?? 0)) {
        byGroup.set(rule.group, rule);
      }
    } else {
      ungrouped.push(rule);
    }
  }

  const selected = [...byGroup.values(), ...ungrouped].sort(
    (a, b) => (b.priority ?? 0) - (a.priority ?? 0)
  );

  const labels = [];
  const seen = new Set();

  for (const rule of selected) {
    if (seen.has(rule.label)) continue;
    seen.add(rule.label);
    labels.push(rule.label);
    if (labels.length >= limit) break;
  }

  return labels;
}
