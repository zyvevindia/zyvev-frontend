/**
 * Build editorial vehicle review content from intelligence engines.
 */

import { buildScoreExplanationContext } from "../intelligence/buildScoreExplanation.js";
import { buildPersonas } from "../intelligence/buildPersonas.js";
import { resolveServiceNetworkBrand } from "../intelligence/buildServiceNetworkScore.js";
import { buildReviewContext } from "./buildReviewContext.js";
import { REVIEW_LIMITS } from "./constants.js";
import {
  joinReviewList,
  resolveCityDrivingNarrative,
  resolveReviewFamilyName,
  resolveVehicleSlug,
  safeReviewBuild,
} from "./reviewBuilderUtils.js";
import {
  buildNaturalSentence,
  dedupeReviewItems,
  joinFragmentsNaturally,
  normalizeReviewText,
  reviewSectionBodyOrFallback,
} from "./reviewTextUtils.js";

/** @type {Record<string, string>} */
const PERSONA_VERDICT_LABELS = {
  "City EV": "Excellent city EV",
  "Value EV": "Great value EV",
  "Highway EV": "Strong highway cruiser",
  "Long-distance EV": "Strong highway cruiser",
  "Family EV": "Balanced family EV",
  "Apartment EV": "Practical apartment EV",
  "First EV": "Well-rounded first EV",
  "Premium EV": "Premium everyday EV",
};

/** @type {Record<string, string>} */
const BEST_FOR_FRIENDLY = {
  "City Driving": "City commuters",
  "Apartment Living": "Apartment owners",
  "First EV buyers": "First-time EV buyers",
  "Budget-conscious buyers": "Budget-conscious buyers",
  "Frequent highway travel": "Occasional highway drivers",
  "Long-distance touring": "Weekend getaways",
  "Value seekers": "Value-focused buyers",
  "Family use": "Small families",
};

/** @type {Record<string, string>} */
const AVOID_FOR_FRIENDLY = {
  "Frequent highway travel": "Frequent highway travelers",
  "Long-distance touring": "Regular long-distance touring",
  "Large families": "Large families needing extra space",
  "Fast-charging priority": "Buyers needing the fastest charging",
  "Remote area travel": "Drivers far from charging networks",
};

/**
 * @param {string[]} personas
 * @returns {string}
 */
function resolveQualitativeVerdictLabel(personas = []) {
  for (const persona of personas) {
    const label = PERSONA_VERDICT_LABELS[persona];
    if (label) return label;
  }
  return "Balanced everyday EV";
}

/**
 * @param {string[]} items
 * @param {Record<string, string>} map
 * @returns {string[]}
 */
function mapFriendlyLabels(items = [], map = {}) {
  return dedupeReviewItems(
    items.map((item) => map[item] || normalizeReviewText(item)),
    5
  );
}

/**
 * @param {import("./buildReviewContext.js").ReviewContext} ctx
 * @param {object|null|undefined} vehicle
 * @returns {string}
 */
function buildOverviewCopy(ctx, vehicle) {
  const familyName = resolveReviewFamilyName(vehicle);
  const verdict = ctx.verdict;
  const headline = verdict?.headline;
  const summary = verdict?.summary;

  if (headline || summary) {
    return joinFragmentsNaturally([headline, summary], {
      fallback: `${familyName} offers a balanced electric ownership experience for everyday Indian driving.`,
    });
  }

  return buildNaturalSentence(
    `${familyName} offers a balanced electric ownership experience for everyday Indian driving.`
  );
}

/**
 * @param {import("./buildReviewContext.js").ReviewContext} ctx
 * @param {object|null|undefined} vehicle
 * @returns {string}
 */
function buildCityDrivingCopy(ctx, vehicle) {
  const personaLabels = ctx.personas?.personas ?? [];
  const cityOriented = personaLabels.filter((label) =>
    /city|apartment|value|first|commute|urban|daily/i.test(String(label))
  );
  const personasToMention = cityOriented.length
    ? cityOriented
    : personaLabels.slice(0, 2);

  const fragments = [];

  if (personasToMention.length) {
    fragments.push(`positioned as ${joinReviewList(personasToMention).toLowerCase()}`);
  }

  const scoreCtx = safeReviewBuild(() => buildScoreExplanationContext(vehicle));
  const cityNarrative = resolveCityDrivingNarrative(scoreCtx?.cityScore);
  if (cityNarrative) {
    fragments.push(cityNarrative.replace(/\.$/, ""));
  }

  const cityBestFor = (ctx.recommendation?.bestFor ?? []).filter((label) =>
    /city|commute|urban|apartment|daily|local/i.test(String(label))
  );
  if (cityBestFor.length) {
    fragments.push(
      `especially strong for ${joinReviewList(cityBestFor).toLowerCase()}`
    );
  }

  return joinFragmentsNaturally(fragments, {
    opener: "In the city, this EV feels easy to live with",
    fallback: "Well suited to everyday city driving and local errands.",
  });
}

/**
 * @param {import("./buildReviewContext.js").ReviewContext} ctx
 * @returns {string}
 */
function buildHighwayDrivingCopy(ctx) {
  const fragments = [];

  if (ctx.highway?.label) {
    fragments.push(ctx.highway.label.replace(/\.$/, ""));
  }

  fragments.push("manageable charging stops on inter-city routes");

  return joinFragmentsNaturally(fragments, {
    opener: "On the highway, this EV is comfortable enough for mixed city and touring use",
    fallback: "Suitable for occasional highway journeys with sensible charging planning.",
  });
}

/**
 * @param {import("./buildReviewContext.js").ReviewContext} ctx
 * @returns {string}
 */
function buildChargingExperienceCopy(ctx) {
  const fragments = [];

  if (ctx.charging?.acChargingExperience) {
    fragments.push(ctx.charging.acChargingExperience.replace(/\.$/, ""));
  }
  if (ctx.charging?.dcChargingExperience) {
    fragments.push(ctx.charging.dcChargingExperience.replace(/\.$/, ""));
  } else if (ctx.charging?.label) {
    fragments.push(ctx.charging.label.replace(/\.$/, ""));
  }

  return joinFragmentsNaturally(fragments, {
    opener: "Charging the vehicle is straightforward for most owners",
    fallback:
      "Charging experience depends on your home setup and local public network access.",
  });
}

/**
 * @param {import("./buildReviewContext.js").ReviewContext} ctx
 * @returns {string}
 */
function buildOwnershipCostCopy(ctx) {
  const label = normalizeReviewText(ctx.ownership?.label);
  if (!label) {
    return buildNaturalSentence(
      "Running costs stay lower than comparable petrol cars when charged at home."
    );
  }

  return joinFragmentsNaturally([label.replace(/\.$/, "")], {
    opener: "Day-to-day running costs are a highlight here",
    fallback:
      "Running costs stay lower than comparable petrol cars when charged at home.",
  });
}

/**
 * @param {import("./buildReviewContext.js").ReviewContext} ctx
 * @returns {string}
 */
function buildFamilySuitabilityCopy(ctx) {
  const fragments = [];

  if (ctx.family?.label) {
    fragments.push(ctx.family.label.replace(/\.$/, ""));
  }

  fragments.push("enough space for daily family luggage");

  return joinFragmentsNaturally(fragments, {
    opener: "For family use, this EV works well for small households",
    fallback: "Comfortable for a small family with room for daily luggage.",
  });
}

/**
 * @param {import("./buildReviewContext.js").ReviewContext} ctx
 * @param {object|null|undefined} vehicle
 * @returns {string}
 */
function buildServiceExperienceCopy(ctx, vehicle) {
  const fragments = [];

  if (ctx.service?.label) {
    fragments.push(ctx.service.label.replace(/\.$/, ""));
  }

  const brand = safeReviewBuild(() => resolveServiceNetworkBrand(vehicle));
  if (brand) {
    fragments.push(`backed by ${brand} service centres across major cities`);
  }

  return joinFragmentsNaturally(fragments, {
    opener: "Service support is an important part of long-term ownership",
    fallback: "Check service coverage in your region before you buy.",
  });
}

/**
 * @param {import("./buildReviewContext.js").ReviewContext} ctx
 * @returns {string}
 */
function buildVerdictSummaryCopy(ctx) {
  const personas = ctx.personas?.personas ?? [];
  const label = resolveQualitativeVerdictLabel(personas);
  const verdict = ctx.verdict;

  if (verdict?.summary) {
    return normalizeReviewText(verdict.summary);
  }

  const bestFor = mapFriendlyLabels(ctx.recommendation?.bestFor ?? [], BEST_FOR_FRIENDLY);
  if (bestFor.length) {
    return buildNaturalSentence(
      `${label} with sensible strengths for ${joinReviewList(bestFor).toLowerCase()}.`
    );
  }

  return buildNaturalSentence(`${label} for mixed everyday Indian driving.`);
}

/**
 * @param {object|null|undefined} vehicle
 * @returns {import("./types.js").VehicleReview|null}
 */
export function buildVehicleReview(vehicle) {
  if (!vehicle || typeof vehicle !== "object") {
    return null;
  }

  const ctx = buildReviewContext(vehicle);
  const vehicleSlug = resolveVehicleSlug(vehicle);
  const familyName = resolveReviewFamilyName(vehicle, vehicleSlug);

  if (!vehicleSlug) {
    return null;
  }

  const verdict = ctx.verdict ?? { headline: null, summary: null };
  const personas = ctx.personas?.personas ?? [];
  const bestFor = mapFriendlyLabels(ctx.recommendation?.bestFor ?? [], BEST_FOR_FRIENDLY);
  const avoidFor = mapFriendlyLabels(
    ctx.recommendation?.avoidFor ?? [],
    AVOID_FOR_FRIENDLY
  );
  const considerations = dedupeReviewItems(
    [...ctx.weaknesses, ...avoidFor],
    REVIEW_LIMITS.maxCons
  );

  const qualitativeLabel = resolveQualitativeVerdictLabel(personas);
  const whoShouldBuy = dedupeReviewItems(
    [...bestFor, ...personas.slice(0, 3)],
    5
  );
  const whoShouldAvoid = dedupeReviewItems(
    [...avoidFor, ...considerations.slice(0, 2)],
    5
  );

  return {
    slug: `${vehicleSlug}-review`,
    title: `${familyName} Review`,
    vehicleSlug,
    familyName,
    overview: {
      body: buildOverviewCopy(ctx, vehicle),
    },
    pros: dedupeReviewItems(ctx.strengths, REVIEW_LIMITS.maxPros),
    cons: dedupeReviewItems(ctx.weaknesses, REVIEW_LIMITS.maxCons),
    cityDriving: {
      body: buildCityDrivingCopy(ctx, vehicle),
    },
    highwayDriving: {
      body: buildHighwayDrivingCopy(ctx),
    },
    chargingExperience: {
      body: buildChargingExperienceCopy(ctx),
    },
    ownershipCost: {
      body: buildOwnershipCostCopy(ctx),
    },
    familySuitability: {
      body: buildFamilySuitabilityCopy(ctx),
    },
    serviceExperience: {
      body: buildServiceExperienceCopy(ctx, vehicle),
    },
    whoShouldBuy,
    whoShouldAvoid,
    evSavariVerdict: {
      label: qualitativeLabel,
      bestFor,
      considerations,
    },
    finalVerdict: {
      headline: verdict.headline || qualitativeLabel,
      summary: buildVerdictSummaryCopy(ctx),
    },
    confidence: ctx.confidence,
  };
}

export { reviewSectionBodyOrFallback };
