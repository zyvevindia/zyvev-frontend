/**
 * User suitability intelligence — usage-pattern matching (no demographics).
 */

import { buildVehicleIntelligence } from "../intelligence/buildVehicleIntelligence.js";
import { ensureArray } from "../utils/compareArrayUtils.js";
import { scoreOwnershipRealism } from "./ownershipRealismOps.js";
import { scoreChargingPracticality } from "./chargingPracticalityOps.js";

export const USAGE_PROFILES = Object.freeze({
  city_commuter: {
    id: "city_commuter",
    label: "City commuter",
    weights: { city: 0.35, charging: 0.25, apartment: 0.2, cost: 0.2 },
  },
  apartment_owner: {
    id: "apartment_owner",
    label: "Apartment owner",
    weights: { apartment: 0.4, charging: 0.3, city: 0.2, highway: 0.1 },
  },
  family_buyer: {
    id: "family_buyer",
    label: "Family buyer",
    weights: { family: 0.35, practicality: 0.3, highway: 0.2, city: 0.15 },
  },
  long_distance_driver: {
    id: "long_distance_driver",
    label: "Long-distance driver",
    weights: { highway: 0.4, charging: 0.3, range: 0.2, city: 0.1 },
  },
  budget_first_time_ev_buyer: {
    id: "budget_first_time_ev_buyer",
    label: "Budget first-time EV buyer",
    weights: { firstTime: 0.3, cost: 0.3, city: 0.2, charging: 0.2 },
  },
  premium_upgrade_buyer: {
    id: "premium_upgrade_buyer",
    label: "Premium upgrade buyer",
    weights: { premium: 0.35, highway: 0.25, family: 0.2, charging: 0.2 },
  },
  secondary_city_car: {
    id: "secondary_city_car",
    label: "Secondary city car",
    weights: { city: 0.35, cost: 0.25, apartment: 0.2, charging: 0.2 },
  },
  office_commuter: {
    id: "office_commuter",
    label: "Office commuter",
    weights: { city: 0.3, charging: 0.3, apartment: 0.2, cost: 0.2 },
  },
  occasional_highway_user: {
    id: "occasional_highway_user",
    label: "Occasional highway user",
    weights: { highway: 0.3, city: 0.3, charging: 0.25, family: 0.15 },
  },
});

function profileFit(car, profile) {
  const own = scoreOwnershipRealism(car);
  const chg = scoreChargingPracticality(car);
  const intel = buildVehicleIntelligence(car);
  const w = profile.weights;

  const parts = {
    city: own.commuterSuitabilityScore,
    highway: own.highwayConfidenceScore,
    apartment: own.apartmentSuitabilityScore,
    family: own.familySuitabilityScore,
    charging: chg.composite,
    firstTime: own.firstTimeBuyerConfidence,
    premium: own.premiumOwnershipMaturity,
    cost: intel?.ownership?.hasData ? 70 : 45,
    practicality: own.familySuitabilityScore,
    range: intel?.range?.hasData ? 68 : 40,
  };

  let sum = 0;
  let weight = 0;
  for (const [key, wt] of Object.entries(w)) {
    if (parts[key] != null) {
      sum += parts[key] * wt;
      weight += wt;
    }
  }
  return weight > 0 ? Math.round(sum / weight) : 0;
}

/**
 * @param {object} car
 */
export function scoreVehicleSuitabilityProfiles(car) {
  const matches = Object.values(USAGE_PROFILES)
    .map((profile) => ({
      profileId: profile.id,
      profileLabel: profile.label,
      fitScore: profileFit(car, profile),
    }))
    .sort((a, b) => b.fitScore - a.fitScore);

  return {
    slug: car.slug,
    name: car.name,
    topProfiles: matches.slice(0, 3),
    weakestProfile: matches[matches.length - 1],
  };
}

/**
 * Compare-level suitability lines (deterministic).
 */
export function buildCompareSuitabilityInsights(cars = []) {
  if (!cars?.length || cars.length < 2) return [];

  const scored = cars.map((car) => ({
    car,
    own: scoreOwnershipRealism(car),
    chg: scoreChargingPracticality(car),
  }));

  const lines = [];
  const bestApartment = [...scored].sort(
    (a, b) => b.own.apartmentSuitabilityScore - a.own.apartmentSuitabilityScore
  )[0];
  const bestHighway = [...scored].sort(
    (a, b) => b.own.highwayConfidenceScore - a.own.highwayConfidenceScore
  )[0];
  const bestFirstTime = [...scored].sort(
    (a, b) => b.own.firstTimeBuyerConfidence - a.own.firstTimeBuyerConfidence
  )[0];
  const bestFamily = [...scored].sort(
    (a, b) => b.own.familySuitabilityScore - a.own.familySuitabilityScore
  )[0];

  if (bestApartment?.car) {
    lines.push({
      type: "apartment",
      text: `Better for apartment charging: ${bestApartment.car.name}`,
      slug: bestApartment.car.slug,
    });
  }
  if (bestHighway?.car && bestHighway.car.slug !== bestApartment?.car?.slug) {
    lines.push({
      type: "highway",
      text: `Better for long highway trips: ${bestHighway.car.name}`,
      slug: bestHighway.car.slug,
    });
  }
  if (bestFirstTime?.car) {
    lines.push({
      type: "beginner",
      text: `More beginner-friendly EV: ${bestFirstTime.car.name}`,
      slug: bestFirstTime.car.slug,
    });
  }
  if (bestFamily?.car) {
    lines.push({
      type: "family",
      text: `Better as a family-focused pick: ${bestFamily.car.name}`,
      slug: bestFamily.car.slug,
    });
  }

  return lines;
}

/**
 * @param {object} ctx
 */
export function buildUserSuitabilityReport(ctx = {}) {
  const cars = ctx.cars || [];
  const vehicleProfiles = cars.map((car) => scoreVehicleSuitabilityProfiles(car));

  const unrealisticClusters = vehicleProfiles.filter(
    (v) => v.topProfiles[0]?.fitScore < 52 && v.topProfiles[0]?.fitScore > 0
  );

  const comparePairs = ensureArray(ctx.comparePairs).slice(0, 10);
  const compareGaps = ensureArray(comparePairs).map((pair) => {
    const slug = pair.slug || pair.pairSlug || "";
    const vehicles = cars.filter((c) => {
      const s = String(c.slug || "").toLowerCase();
      return slug.split("-vs-").some((p) => s.startsWith(p));
    });
    return {
      pairSlug: slug,
      insights: buildCompareSuitabilityInsights(vehicles),
      vehicleCount: vehicles.length,
    };
  });

  const profileLeaders = {};
  for (const profile of Object.values(USAGE_PROFILES)) {
    const ranked = cars
      .map((car) => ({
        slug: car.slug,
        name: car.name,
        fit: profileFit(car, profile),
      }))
      .sort((a, b) => b.fit - a.fit);
    profileLeaders[profile.id] = ranked.slice(0, 5);
  }

  return {
    vehicleProfiles,
    profileLeaders,
    unrealisticClusters: unrealisticClusters.slice(0, 12),
    compareGaps: compareGaps.filter((g) => g.insights.length),
    ownershipMaturityAvg: Math.round(
      cars.reduce(
        (n, c) => n + scoreOwnershipRealism(c).ownershipRealismScore,
        0
      ) / Math.max(1, cars.length)
    ),
    generatedAt: new Date().toISOString(),
    exportMeta: {
      reportType: "user-suitability",
      version: 1,
      privacyNote: "Usage-pattern only — no demographic targeting",
      generatedAt: new Date().toISOString(),
    },
  };
}
