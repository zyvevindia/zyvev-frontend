/**
 * Human-readable recommendation narratives from buyer fit results.
 *
 * Narratives explain fit — they do not rank vehicles or modify scores.
 */

import { FIT_TIERS } from "./fitConstants.js";
import { BUYER_ARCHETYPE_IDS } from "./constants.js";

/**
 * @typedef {{
 *   headline: string,
 *   summary: string,
 *   whyItFits: string[],
 *   considerations: string[],
 * }} RecommendationNarrative
 */

/** @type {Record<string, string>} */
const KNOWN_VEHICLE_NAMES = Object.freeze({
  "tata-nexon-ev": "Nexon EV",
  "mg-comet-ev": "Comet EV",
  "byd-seal": "BYD Seal",
  "mahindra-be-6": "BE 6",
});

/**
 * @param {string} value
 * @returns {string}
 */
function preserveOemCasing(value) {
  return String(value || "").replace(
    /\b(mg|byd|bmw|ev|kia|tata|mahindra|hyundai|citroen|mercedes|volvo)\b/gi,
    (match) => match.toUpperCase() === "MG" ? "MG" : match.toUpperCase() === "BYD" ? "BYD" : match.charAt(0).toUpperCase() + match.slice(1).toLowerCase()
  );
}
const MAX_WHY_IT_FITS = 4;
const MAX_CONSIDERATIONS = 2;
const MIN_WHY_IT_FITS = 2;

/** @type {Record<string, Record<string, string>>} */
const HEADLINE_BY_ARCHETYPE = Object.freeze({
  [BUYER_ARCHETYPE_IDS.CITY_COMMUTER]: Object.freeze({
    [FIT_TIERS.EXCELLENT]: "Excellent fit for urban commuters.",
    [FIT_TIERS.GOOD]: "Solid fit for urban commuters.",
    [FIT_TIERS.MODERATE]: "Workable for urban commuting with some trade-offs.",
    [FIT_TIERS.LIMITED]: "Limited fit for city-focused commuting.",
    [FIT_TIERS.INSUFFICIENT]: "Not ideal for predictable urban commuting.",
  }),
  [BUYER_ARCHETYPE_IDS.FAMILY_BUYER]: Object.freeze({
    [FIT_TIERS.EXCELLENT]: "Excellent choice for families.",
    [FIT_TIERS.GOOD]: "Strong choice for families.",
    [FIT_TIERS.MODERATE]: "A workable option for family buyers.",
    [FIT_TIERS.LIMITED]: "Limited fit for family-focused buyers.",
    [FIT_TIERS.INSUFFICIENT]: "Not ideal for family-focused buyers.",
  }),
  [BUYER_ARCHETYPE_IDS.HIGHWAY_TRAVELLER]: Object.freeze({
    [FIT_TIERS.EXCELLENT]: "Excellent fit for regular highway travel.",
    [FIT_TIERS.GOOD]: "Capable choice for regular highway travel.",
    [FIT_TIERS.MODERATE]: "Highway use is possible, but planning matters.",
    [FIT_TIERS.LIMITED]: "Long-distance use may require careful planning.",
    [FIT_TIERS.INSUFFICIENT]:
      "Not designed primarily for frequent long-distance driving.",
  }),
  [BUYER_ARCHETYPE_IDS.APARTMENT_OWNER]: Object.freeze({
    [FIT_TIERS.EXCELLENT]: "Strong fit for apartment-focused buyers.",
    [FIT_TIERS.GOOD]: "Workable for apartment owners with charging plans.",
    [FIT_TIERS.MODERATE]: "Usable for apartment owners, with charging trade-offs.",
    [FIT_TIERS.LIMITED]: "Limited fit when home charging is constrained.",
    [FIT_TIERS.INSUFFICIENT]: "Not ideal for apartment-focused charging needs.",
  }),
  [BUYER_ARCHETYPE_IDS.BUDGET_BUYER]: Object.freeze({
    [FIT_TIERS.EXCELLENT]: "Excellent value for budget-conscious buyers.",
    [FIT_TIERS.GOOD]: "Strong value for budget-conscious buyers.",
    [FIT_TIERS.MODERATE]: "Moderate value for budget-focused buyers.",
    [FIT_TIERS.LIMITED]: "Limited value at this price point.",
    [FIT_TIERS.INSUFFICIENT]: "Not ideal for budget-focused buyers.",
  }),
  [BUYER_ARCHETYPE_IDS.PREMIUM_BUYER]: Object.freeze({
    [FIT_TIERS.EXCELLENT]: "Premium buyers are likely to appreciate this EV.",
    [FIT_TIERS.GOOD]: "A compelling option for premium buyers.",
    [FIT_TIERS.MODERATE]: "Some premium appeal, with notable trade-offs.",
    [FIT_TIERS.LIMITED]: "Limited premium appeal for discerning buyers.",
    [FIT_TIERS.INSUFFICIENT]: "Not aligned with premium buyer expectations.",
  }),
  [BUYER_ARCHETYPE_IDS.FIRST_TIME_EV_BUYER]: Object.freeze({
    [FIT_TIERS.EXCELLENT]: "Excellent first EV for new electric owners.",
    [FIT_TIERS.GOOD]: "Strong first EV for new electric owners.",
    [FIT_TIERS.MODERATE]: "A manageable first EV with some learning curve.",
    [FIT_TIERS.LIMITED]: "May feel demanding as a first EV.",
    [FIT_TIERS.INSUFFICIENT]: "Not ideal as a first EV for most buyers.",
  }),
});

/** @type {Record<string, string>} */
const SUMMARY_CLOSING_BY_ARCHETYPE = Object.freeze({
  [BUYER_ARCHETYPE_IDS.CITY_COMMUTER]:
    "Low running costs and city-friendly usability make it a strong match for predictable daily commuting.",
  [BUYER_ARCHETYPE_IDS.FAMILY_BUYER]:
    "Broad service support and family-friendly packaging make it a compelling choice for households needing a versatile EV.",
  [BUYER_ARCHETYPE_IDS.HIGHWAY_TRAVELLER]:
    "Range confidence and highway usability make it a sensible option for drivers who travel longer distances regularly.",
  [BUYER_ARCHETYPE_IDS.APARTMENT_OWNER]:
    "Everyday usability with thoughtful charging planning makes it workable for apartment-focused buyers.",
  [BUYER_ARCHETYPE_IDS.BUDGET_BUYER]:
    "Sensible purchase value and ownership economics make it a thoughtful choice for cost-conscious buyers.",
  [BUYER_ARCHETYPE_IDS.PREMIUM_BUYER]:
    "Buyers prioritising refinement and everyday usability are likely to find it appealing.",
  [BUYER_ARCHETYPE_IDS.FIRST_TIME_EV_BUYER]:
    "Straightforward ownership and practical support make it approachable for first-time EV buyers.",
});

/** @type {Record<string, string>} */
const SUMMARY_CLOSING_WEAK_FIT = Object.freeze({
  [BUYER_ARCHETYPE_IDS.CITY_COMMUTER]:
    "Urban usability is present, but buyers should weigh day-to-day practicality carefully.",
  [BUYER_ARCHETYPE_IDS.FAMILY_BUYER]:
    "Family buyers should weigh space, service access, and daily practicality before deciding.",
  [BUYER_ARCHETYPE_IDS.HIGHWAY_TRAVELLER]:
    "Regular highway buyers should plan charging and range expectations carefully.",
  [BUYER_ARCHETYPE_IDS.APARTMENT_OWNER]:
    "Apartment buyers should confirm workable charging options before committing.",
  [BUYER_ARCHETYPE_IDS.BUDGET_BUYER]:
    "Budget-focused buyers should compare purchase price and ownership costs closely.",
  [BUYER_ARCHETYPE_IDS.PREMIUM_BUYER]:
    "Premium buyers may want to compare refinement and ownership experience against alternatives.",
  [BUYER_ARCHETYPE_IDS.FIRST_TIME_EV_BUYER]:
    "First-time EV buyers should confirm charging and service support feel manageable.",
});

/** @type {Record<string, string>} */
const REASON_NORMALIZATION = Object.freeze({
  "Low running costs and sensible ownership economics": "Low ownership costs",
  "Strong purchase value for cost-conscious buyers": "Attractive purchase value",
  "Well suited to predictable urban commuting": "Strong city usability",
  "Strong city usability": "Strong city usability",
  "Low running costs": "Low ownership costs",
  "Strong purchase value": "Attractive purchase value",
  "Strong highway capability": "Strong highway capability",
  "Confident highway and long-distance usability": "Strong highway capability",
  "Premium comfort and refinement": "Premium comfort and performance appeal",
  "Premium comfort and performance appeal": "Premium comfort and performance appeal",
  "Strong family practicality": "Strong family practicality",
  "Broad service support": "Broad service support",
  "Suitable for mixed city and highway usage": "Suitable for mixed city and highway usage",
});

/** @type {Record<string, string>} */
const CAUTION_NORMALIZATION = Object.freeze({
  "Charging infrastructure dependency": "Charging infrastructure remains important",
  "Limited premium appeal": "Premium appeal is limited",
  "Premium appeal is limited": "Premium appeal is limited",
  "Limited long-distance usability": "Long-distance capability is limited",
  "Long-distance usability remains limited": "Long-distance capability is limited",
  "Long-distance highway use needs careful planning": "Highway travel requires planning",
  "Charging convenience may require extra planning":
    "Charging infrastructure remains important",
  "Premium purchase price":
    "Purchase price may feel high for value-focused buyers",
  "Purchase price may feel high for value-focused buyers":
    "Purchase price may feel high for value-focused buyers",
  "Family practicality is limited": "Family practicality is limited",
  "City usability is not its strongest suit": "City usability is not its strongest suit",
});

/** @type {Record<string, string[]>} */
const ARCHETYPE_REASON_PRIORITY = Object.freeze({
  [BUYER_ARCHETYPE_IDS.CITY_COMMUTER]: [
    "city",
    "running cost",
    "ownership",
    "purchase value",
    "highway",
  ],
  [BUYER_ARCHETYPE_IDS.FAMILY_BUYER]: [
    "family",
    "service",
    "highway",
    "mixed city",
    "ownership",
  ],
  [BUYER_ARCHETYPE_IDS.HIGHWAY_TRAVELLER]: [
    "highway",
    "long-distance",
    "charging",
    "range",
  ],
  [BUYER_ARCHETYPE_IDS.APARTMENT_OWNER]: [
    "charging",
    "ownership",
    "city",
    "running cost",
  ],
  [BUYER_ARCHETYPE_IDS.BUDGET_BUYER]: [
    "purchase value",
    "ownership",
    "running cost",
    "value",
  ],
  [BUYER_ARCHETYPE_IDS.PREMIUM_BUYER]: [
    "premium",
    "highway",
    "comfort",
    "performance",
  ],
  [BUYER_ARCHETYPE_IDS.FIRST_TIME_EV_BUYER]: [
    "ownership",
    "service",
    "purchase value",
    "city",
  ],
});

/**
 * @param {string[]} phrases
 * @returns {string[]}
 */
function dedupePhrases(phrases = []) {
  const seen = new Set();
  const result = [];

  for (const phrase of phrases) {
    const cleaned = String(phrase || "").trim();
    if (!cleaned) continue;
    const key = cleaned.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(cleaned);
  }

  return result;
}

/**
 * @param {object|null|undefined} intelligenceCar
 * @param {import("../score2/types.js").VehicleScoreProfile|null|undefined} scoreProfile
 * @returns {string}
 */
function resolveVehicleName(intelligenceCar, scoreProfile) {
  const slug = String(
    scoreProfile?.vehicleSlug ||
      intelligenceCar?.familySlug ||
      intelligenceCar?.slug ||
      ""
  )
    .trim()
    .toLowerCase();

  const summary = scoreProfile?.explanation?.summary || "";
  const summaryNameMatch = summary.match(
    /\b(?:the\s+)?((?:Tata\s+)?Nexon EV|Comet EV|BYD Seal|BE 6)\b/i
  );
  if (summaryNameMatch?.[1]) {
    return preserveOemCasing(summaryNameMatch[1].replace(/^Tata\s+/i, "").trim());
  }

  const candidates = [
    intelligenceCar?.displayName,
    intelligenceCar?.name,
    intelligenceCar?.catalogMeta?.displayName,
    intelligenceCar?.fields?.displayName,
    KNOWN_VEHICLE_NAMES[slug],
  ]
    .map((value) => preserveOemCasing(String(value || "").trim()))
    .filter(Boolean);

  if (candidates.length) {
    return candidates[0];
  }

  return "This EV";
}

/**
 * @param {string} text
 * @returns {string}
 */
function firstSentence(text) {
  const value = String(text || "").trim();
  if (!value) return "";

  const match = value.match(/^[^.!?]+[.!?]/);
  return match ? match[0].trim() : value;
}

/**
 * @param {import("./types.js").BuyerArchetype} archetype
 * @param {import("./buildArchetypeFit.js").ArchetypeFitResult} fitResult
 * @returns {string}
 */
function buildHeadline(archetype, fitResult) {
  const byTier = HEADLINE_BY_ARCHETYPE[archetype.id];
  const headline = byTier?.[fitResult.fitTier];

  if (headline) {
    return headline;
  }

  return `Relevant for ${archetype.title.toLowerCase()} prioritising ${archetype.priority.toLowerCase()}.`;
}

/**
 * @param {string} vehicleName
 * @param {import("./types.js").BuyerArchetype} archetype
 * @param {import("./buildArchetypeFit.js").ArchetypeFitResult} fitResult
 * @param {import("../score2/types.js").VehicleScoreProfile} scoreProfile
 * @returns {string}
 */
function buildSummary(vehicleName, archetype, fitResult, scoreProfile) {
  const explanationSummary = scoreProfile.explanation?.summary || "";
  const weakFit =
    fitResult.fitTier === FIT_TIERS.LIMITED ||
    fitResult.fitTier === FIT_TIERS.INSUFFICIENT;

  let opening = firstSentence(explanationSummary);

  if (!opening || !opening.toLowerCase().includes(vehicleName.split(" ")[0]?.toLowerCase() || "__")) {
    opening = `${vehicleName} aligns with buyers focused on ${archetype.priority.toLowerCase()}.`;
  }

  const closing = weakFit
    ? SUMMARY_CLOSING_WEAK_FIT[archetype.id] ||
      "Buyers should weigh the trade-offs against their daily needs."
    : SUMMARY_CLOSING_BY_ARCHETYPE[archetype.id] ||
      `It remains a relevant option for ${archetype.title.toLowerCase()}.`;

  if (archetype.id === BUYER_ARCHETYPE_IDS.PREMIUM_BUYER && !weakFit) {
    const premiumOpening = firstSentence(explanationSummary);
    if (premiumOpening) {
      opening = premiumOpening.replace(
        /Buyers prioritizing luxury and performance may find it especially appealing\.?/i,
        ""
      ).trim();

      if (!opening.endsWith(".")) {
        opening = `${opening}.`;
      }
    }
  }

  if (archetype.id === BUYER_ARCHETYPE_IDS.FAMILY_BUYER && !weakFit) {
    opening = opening
      .replace("everyday practicality", "practicality")
      .replace("strong highway capability", "highway usability")
      .replace("Low operating costs", "Running costs");
  }

  return `${opening} ${closing}`.replace(/\s+/g, " ").trim();
}

/**
 * @param {string} reason
 * @returns {string}
 */
function normalizeReason(reason) {
  return REASON_NORMALIZATION[reason] || reason;
}

/**
 * @param {import("./types.js").BuyerArchetype} archetype
 * @param {import("./buildArchetypeFit.js").ArchetypeFitResult} fitResult
 * @param {import("../score2/types.js").VehicleScoreProfile} scoreProfile
 * @returns {string[]}
 */
function buildWhyItFits(archetype, fitResult, scoreProfile) {
  const priorities = ARCHETYPE_REASON_PRIORITY[archetype.id] || [];
  const phrases = dedupePhrases(
    (fitResult.reasons || []).map((reason) => normalizeReason(reason))
  );

  if (archetype.id === BUYER_ARCHETYPE_IDS.FAMILY_BUYER) {
    if (
      scoreProfile.score.highway &&
      !phrases.includes("Suitable for mixed city and highway usage")
    ) {
      phrases.push("Suitable for mixed city and highway usage");
    }
  }

  const ranked = [...phrases].sort((left, right) => {
    const leftIndex = priorities.findIndex((token) =>
      left.toLowerCase().includes(token)
    );
    const rightIndex = priorities.findIndex((token) =>
      right.toLowerCase().includes(token)
    );

    return (
      (leftIndex < 0 ? 99 : leftIndex) - (rightIndex < 0 ? 99 : rightIndex)
    );
  });

  const selected = dedupePhrases(ranked).slice(0, MAX_WHY_IT_FITS);

  if (selected.length >= MIN_WHY_IT_FITS) {
    return selected;
  }

  return dedupePhrases([
    ...selected,
    `Supports ${archetype.priority.toLowerCase()} priorities`,
  ]).slice(0, MAX_WHY_IT_FITS);
}

/**
 * @param {import("./buildArchetypeFit.js").ArchetypeFitResult} fitResult
 * @param {import("../score2/types.js").VehicleScoreProfile} scoreProfile
 * @returns {string[]}
 */
function buildConsiderations(fitResult, scoreProfile) {
  const phrases = dedupePhrases(
    (fitResult.cautions || []).map(
      (caution) => CAUTION_NORMALIZATION[caution] || caution
    )
  );

  if (
    phrases.length < MAX_CONSIDERATIONS &&
    scoreProfile.explanation.weaknesses?.length
  ) {
    for (const weakness of scoreProfile.explanation.weaknesses) {
      const normalized = CAUTION_NORMALIZATION[weakness] || weakness;
      phrases.push(normalized);
    }
  }

  return dedupePhrases(phrases)
    .filter(Boolean)
    .slice(0, MAX_CONSIDERATIONS);
}

/**
 * @param {{
 *   archetype: import("./types.js").BuyerArchetype|null|undefined,
 *   fitResult: import("./buildArchetypeFit.js").ArchetypeFitResult|null|undefined,
 *   scoreProfile: import("../score2/types.js").VehicleScoreProfile|null|undefined,
 *   intelligenceCar?: object|null,
 * }} input
 * @returns {RecommendationNarrative|null}
 */
export function buildRecommendationNarrative({
  archetype,
  fitResult,
  scoreProfile,
  intelligenceCar = null,
}) {
  if (!archetype?.id || !fitResult || !scoreProfile) {
    return null;
  }

  const vehicleName = resolveVehicleName(intelligenceCar, scoreProfile);

  return {
    headline: buildHeadline(archetype, fitResult),
    summary: buildSummary(vehicleName, archetype, fitResult, scoreProfile),
    whyItFits: buildWhyItFits(archetype, fitResult, scoreProfile),
    considerations: buildConsiderations(fitResult, scoreProfile),
  };
}
