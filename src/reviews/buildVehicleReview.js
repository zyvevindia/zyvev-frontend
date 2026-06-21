/**
 * Build editorial vehicle review content from intelligence engines.
 */

import { buildScoreExplanationContext } from "../intelligence/buildScoreExplanation.js";
import { resolveServiceNetworkBrand } from "../intelligence/buildServiceNetworkScore.js";
import { buildReviewContext } from "./buildReviewContext.js";
import {
  joinReviewList,
  joinReviewSentences,
  resolveCityDrivingNarrative,
  resolveVehicleDisplayName,
  resolveVehicleSlug,
  safeReviewBuild,
} from "./reviewBuilderUtils.js";

/**
 * @param {import("./buildReviewContext.js").ReviewContext} ctx
 * @param {object|null|undefined} vehicle
 * @returns {string}
 */
function buildOverviewCopy(ctx, vehicle) {
  const verdict = ctx.verdict;
  const headline = verdict?.headline;
  const summary = verdict?.summary;

  if (headline || summary) {
    return joinReviewSentences([headline, summary]);
  }

  const displayName = resolveVehicleDisplayName(vehicle);
  return `${displayName} offers a balanced electric ownership experience for everyday Indian driving.`;
}

/**
 * @param {import("./buildReviewContext.js").ReviewContext} ctx
 * @param {object|null|undefined} vehicle
 * @returns {string}
 */
function buildCityDrivingCopy(ctx, vehicle) {
  const parts = [];
  const personaLabels = ctx.personas?.personas ?? [];
  const cityOriented = personaLabels.filter((label) =>
    /city|apartment|value|first|commute|urban|daily/i.test(String(label))
  );
  const personasToMention = cityOriented.length
    ? cityOriented
    : personaLabels.slice(0, 2);

  if (personasToMention.length) {
    parts.push(`Positioned as ${joinReviewList(personasToMention)}.`);
  }

  const scoreCtx = safeReviewBuild(() => buildScoreExplanationContext(vehicle));
  const cityNarrative = resolveCityDrivingNarrative(scoreCtx?.cityScore);
  if (cityNarrative) {
    parts.push(cityNarrative);
  }

  const cityBestFor = (ctx.recommendation?.bestFor ?? []).filter((label) =>
    /city|commute|urban|apartment|daily|local/i.test(String(label))
  );
  if (cityBestFor.length) {
    parts.push(`Especially strong for ${joinReviewList(cityBestFor).toLowerCase()}.`);
  }

  return (
    joinReviewSentences(parts) ||
    "Well suited to everyday city driving and local errands."
  );
}

/**
 * @param {import("./buildReviewContext.js").ReviewContext} ctx
 * @returns {string}
 */
function buildHighwayDrivingCopy(ctx) {
  const parts = [];

  if (ctx.highway?.label) {
    parts.push(ctx.highway.label);
  }

  parts.push("Comfortable for inter-city travel with manageable charging stops.");

  return joinReviewSentences(parts);
}

/**
 * @param {import("./buildReviewContext.js").ReviewContext} ctx
 * @returns {string}
 */
function buildChargingExperienceCopy(ctx) {
  const parts = [];

  if (ctx.charging?.label) {
    parts.push(ctx.charging.label);
  }
  if (ctx.charging?.acChargingExperience) {
    parts.push(ctx.charging.acChargingExperience);
  }
  if (ctx.charging?.dcChargingExperience) {
    parts.push(ctx.charging.dcChargingExperience);
  }

  return (
    joinReviewSentences(parts) ||
    "Charging experience depends on your home setup and local public network access."
  );
}

/**
 * @param {import("./buildReviewContext.js").ReviewContext} ctx
 * @returns {string}
 */
function buildOwnershipCostCopy(ctx) {
  return (
    ctx.ownership?.label ||
    "Running costs stay lower than comparable petrol cars when charged at home."
  );
}

/**
 * @param {import("./buildReviewContext.js").ReviewContext} ctx
 * @returns {string}
 */
function buildFamilySuitabilityCopy(ctx) {
  const parts = [];

  if (ctx.family?.label) {
    parts.push(ctx.family.label);
  }

  parts.push("Comfortable for a small family with room for daily luggage.");

  return joinReviewSentences(parts);
}

/**
 * @param {import("./buildReviewContext.js").ReviewContext} ctx
 * @param {object|null|undefined} vehicle
 * @returns {string}
 */
function buildServiceExperienceCopy(ctx, vehicle) {
  const parts = [];

  if (ctx.service?.label) {
    parts.push(ctx.service.label);
  }

  const brand = safeReviewBuild(() => resolveServiceNetworkBrand(vehicle));
  if (brand) {
    parts.push(`Backed by ${brand} service centres across major cities.`);
  }

  return (
    joinReviewSentences(parts) ||
    "Check service coverage in your region before you buy."
  );
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
  const displayName = resolveVehicleDisplayName(vehicle);

  if (!vehicleSlug) {
    return null;
  }

  const verdict = ctx.verdict ?? { headline: null, summary: null };

  return {
    slug: `${vehicleSlug}-review`,
    title: `${displayName} Review`,
    vehicleSlug,
    overview: {
      body: buildOverviewCopy(ctx, vehicle),
    },
    pros: ctx.strengths,
    cons: ctx.weaknesses,
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
    finalVerdict: {
      headline: verdict.headline || "",
      summary: verdict.summary || "",
    },
    confidence: ctx.confidence,
  };
}
