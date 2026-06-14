/** @typedef {import("./types.js").VerdictContext} VerdictContext */

/**
 * @typedef {Object} VerdictHeadlineRule
 * @property {string} id
 * @property {number} [priority]
 * @property {(ctx: VerdictContext) => boolean} when
 * @property {string} headline
 */

/** @type {VerdictHeadlineRule[]} */
export const VERDICT_HEADLINE_RULES = [
  {
    id: "long-distance-strong",
    priority: 100,
    when: (ctx) =>
      ctx.hasPersona("Long-distance EV") ||
      (ctx.hasPersona("Highway EV") && ctx.strongHighway),
    headline: "Strong long-distance EV with impressive highway capability.",
  },
  {
    id: "premium-highway",
    priority: 99,
    when: (ctx) => ctx.hasPersona("Premium EV") && ctx.strongHighway,
    headline: "Premium long-distance EV with confident highway travel.",
  },
  {
    id: "city-value",
    priority: 98,
    when: (ctx) => ctx.hasPersona("City EV") && ctx.excellentOwnership,
    headline: "Ideal city EV with extremely low running costs.",
  },
  {
    id: "city-apartment",
    priority: 97,
    when: (ctx) => ctx.hasPersona("City EV") && ctx.hasPersona("Apartment EV"),
    headline: "Ideal city EV with practical apartment charging.",
  },
  {
    id: "city-ev",
    priority: 96,
    when: (ctx) => ctx.hasPersona("City EV"),
    headline: "Smart city EV built for everyday commuting.",
  },
  {
    id: "value-ev",
    priority: 95,
    when: (ctx) => ctx.hasPersona("Value EV"),
    headline: "Strong value EV with sensible running costs.",
  },
  {
    id: "first-ev",
    priority: 94,
    when: (ctx) => ctx.hasPersona("First EV"),
    headline: "Well-rounded first EV with balanced everyday capability.",
  },
  {
    id: "apartment-ev",
    priority: 93,
    when: (ctx) => ctx.hasPersona("Apartment EV"),
    headline: "Practical apartment EV with easy home charging.",
  },
  {
    id: "highway-capable",
    priority: 92,
    when: (ctx) => ctx.strongHighway,
    headline: "Capable highway EV for mixed city and touring use.",
  },
  {
    id: "default",
    priority: 0,
    when: () => true,
    headline: "Balanced electric vehicle for mixed everyday driving.",
  },
];

export const VERDICT_BEST_FOR_PHRASES = Object.freeze({
  "City Driving": "city driving",
  "Apartment Living": "apartment charging",
  "First EV buyers": "first-time EV buyers",
  "Budget-conscious buyers": "budget-conscious buyers",
  "Frequent highway travel": "highway travel",
  "Long-distance touring": "touring",
  "Value seekers": "value-focused buyers",
});

/**
 * @typedef {Object} VerdictCautionRule
 * @property {(ctx: VerdictContext) => boolean} when
 * @property {string} text
 * @property {number} [priority]
 */

/** @type {VerdictCautionRule[]} */
export const VERDICT_CAUTION_RULES = [
  {
    priority: 100,
    when: (ctx) => ctx.weakHighway || ctx.avoidsHighway,
    text: "Better suited to city driving than long highway journeys.",
  },
  {
    priority: 90,
    when: (ctx) =>
      ctx.moderateHighway &&
      (ctx.hasPersona("City EV") || ctx.hasPersona("Apartment EV")),
    text: "Works best for mixed city use rather than frequent long highway runs.",
  },
  {
    priority: 80,
    when: (ctx) => ctx.avoidsRemote,
    text: "Plan charging carefully if you travel far from established networks.",
  },
];

/**
 * @param {VerdictHeadlineRule[]} rules
 * @param {VerdictContext} ctx
 * @returns {string|null}
 */
export function resolveVerdictHeadline(rules, ctx) {
  const match = [...rules]
    .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
    .find((rule) => rule.when(ctx));

  return match?.headline || null;
}

/**
 * @param {string[]} items
 * @returns {string}
 */
export function joinVerdictPhrases(items) {
  if (!items.length) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items.at(-1)}`;
}

/**
 * @param {VerdictContext} ctx
 * @returns {string|null}
 */
export function buildVerdictSummary(ctx) {
  const phrases = [];

  for (const label of ctx.bestFor.slice(0, 3)) {
    const phrase = VERDICT_BEST_FOR_PHRASES[label];
    if (phrase && !phrases.includes(phrase)) {
      phrases.push(phrase);
    }
  }

  if (ctx.strongFamily && !phrases.includes("family usage")) {
    phrases.push("family usage");
  }

  const premiumFirstBuyer =
    ctx.hasPersona("Premium EV") && ctx.hasPersona("First EV");

  if (premiumFirstBuyer) {
    phrases.push("buyers looking for a premium first EV");
    const firstEvIndex = phrases.indexOf("first-time EV buyers");
    if (firstEvIndex >= 0) phrases.splice(firstEvIndex, 1);
  }

  const opener =
    ctx.excellentOwnership ||
    ctx.strongHighway ||
    ctx.strongApartment ||
    ctx.strongFamily
      ? "Excellent for"
      : "Good for";

  const positiveSentence = phrases.length
    ? `${opener} ${joinVerdictPhrases(phrases)}.`
    : null;

  const caution = [...VERDICT_CAUTION_RULES]
    .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
    .find((rule) => rule.when(ctx))?.text;

  if (positiveSentence && caution) {
    return `${positiveSentence} ${caution}`;
  }

  return positiveSentence || caution || null;
}
