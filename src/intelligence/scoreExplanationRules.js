import { SCORE_EXPLANATION_LIMITS } from "./types.js";

/** @type {import("./types.js").ScoreExplanationRule[]} */
export const STRENGTH_RULES = [
  {
    id: "city-excellent",
    group: "city",
    priority: 100,
    when: (ctx) => ctx.cityScore != null && ctx.cityScore > 80,
    label: "Excellent city efficiency",
  },
  {
    id: "city-good",
    group: "city",
    priority: 90,
    when: (ctx) => ctx.cityScore != null && ctx.cityScore >= 65,
    label: "Good city efficiency",
  },
  {
    id: "value-strong",
    group: "value",
    priority: 100,
    when: (ctx) => ctx.valueScore != null && ctx.valueScore > 75,
    label: "Strong value for money",
  },
  {
    id: "value-competitive",
    group: "value",
    priority: 85,
    when: (ctx) =>
      ctx.valueScore != null &&
      ctx.valueScore >= 60 &&
      ctx.valueScore <= 75,
    label: "Competitive pricing",
  },
  {
    id: "charging-fast",
    group: "charging",
    priority: 100,
    when: (ctx) => ctx.chargingScore != null && ctx.chargingScore > 75,
    label: "Fast charging capability",
  },
  {
    id: "charging-decent",
    group: "charging",
    priority: 80,
    when: (ctx) =>
      ctx.chargingScore != null &&
      ctx.chargingScore >= 55 &&
      ctx.chargingScore <= 75,
    label: "Decent fast-charging",
  },
  {
    id: "highway-confident",
    group: "highway",
    priority: 85,
    when: (ctx) => ctx.highwayScore != null && ctx.highwayScore >= 70,
    label: "Confident highway cruising",
  },
  {
    id: "range-long",
    group: "range",
    priority: 88,
    when: (ctx) => ctx.rangeScore != null && ctx.rangeScore >= 70,
    label: "Long driving range",
  },
  {
    id: "safety-strong",
    group: "safety",
    priority: 75,
    when: (ctx) => ctx.safetyScore != null && ctx.safetyScore >= 75,
    label: "Strong safety credentials",
  },
  {
    id: "performance-energetic",
    group: "performance",
    priority: 70,
    when: (ctx) => ctx.performanceScore != null && ctx.performanceScore >= 75,
    label: "Energetic performance",
  },
];

/** @type {import("./types.js").ScoreExplanationRule[]} */
export const WEAKNESS_RULES = [
  {
    id: "battery-small",
    group: "battery",
    priority: 100,
    when: (ctx) => ctx.batteryKwh != null && ctx.batteryKwh < 25,
    label: "Smaller battery",
  },
  {
    id: "highway-moderate",
    group: "highway",
    priority: 100,
    when: (ctx) => ctx.highwayScore != null && ctx.highwayScore < 60,
    label: "Moderate highway range",
  },
  {
    id: "charging-limited",
    group: "charging",
    priority: 90,
    when: (ctx) => ctx.chargingScore != null && ctx.chargingScore < 40,
    label: "Limited fast-charging",
  },
  {
    id: "charging-moderate",
    group: "charging",
    priority: 70,
    when: (ctx) =>
      ctx.chargingScore != null &&
      ctx.chargingScore >= 40 &&
      ctx.chargingScore < 55,
    label: "Moderate fast-charging speed",
  },
  {
    id: "city-limited",
    group: "city",
    priority: 85,
    when: (ctx) => ctx.cityScore != null && ctx.cityScore < 50,
    label: "Less ideal for dense city use",
  },
  {
    id: "value-premium",
    group: "value",
    priority: 80,
    when: (ctx) => ctx.valueScore != null && ctx.valueScore < 50,
    label: "Higher price positioning",
  },
  {
    id: "range-short",
    group: "range",
    priority: 75,
    when: (ctx) => ctx.rangeScore != null && ctx.rangeScore < 45,
    label: "Shorter driving range",
  },
];

function pickRulesByGroup(rules, ctx) {
  const matched = rules.filter((rule) => {
    try {
      return rule.when(ctx);
    } catch {
      return false;
    }
  });

  const byGroup = new Map();
  for (const rule of matched) {
    const key = rule.group || rule.id;
    const existing = byGroup.get(key);
    if (!existing || (rule.priority ?? 0) > (existing.priority ?? 0)) {
      byGroup.set(key, rule);
    }
  }

  return [...byGroup.values()].sort(
    (a, b) => (b.priority ?? 0) - (a.priority ?? 0)
  );
}

/**
 * Apply declarative rules and return unique user-facing labels.
 * @param {import("./types.js").ScoreExplanationRule[]} rules
 * @param {import("./types.js").ScoreExplanationContext} ctx
 * @param {number} limit
 * @returns {string[]}
 */
export function applyScoreExplanationRules(rules, ctx, limit) {
  const selected = pickRulesByGroup(rules, ctx);
  const labels = [];
  const seen = new Set();

  for (const rule of selected) {
    const label = String(rule.label || "").trim();
    if (!label) continue;

    const key = label.toLowerCase();
    if (seen.has(key)) continue;

    seen.add(key);
    labels.push(label);
    if (labels.length >= limit) break;
  }

  return labels;
}

/**
 * @param {import("./types.js").ScoreExplanationContext} ctx
 * @returns {{ strengths: string[], weaknesses: string[] }}
 */
export function evaluateScoreExplanationRules(ctx) {
  return {
    strengths: applyScoreExplanationRules(
      STRENGTH_RULES,
      ctx,
      SCORE_EXPLANATION_LIMITS.maxStrengths
    ),
    weaknesses: applyScoreExplanationRules(
      WEAKNESS_RULES,
      ctx,
      SCORE_EXPLANATION_LIMITS.maxWeaknesses
    ),
  };
}

export { SCORE_EXPLANATION_LIMITS };
